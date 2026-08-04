"""
Gemini-powered waste report analysis.

Public API:
  analyse_bytes(image_bytes, description, sector)
      → Called at submission time with raw file bytes (no DB write yet).
        Used both by the pre-validation endpoint and as the submission guard.

  analyse_report(image_url, description, sector)
      → Called after save to (re-)populate AI fields on an existing report,
        e.g. for backfilling or when image is stored remotely.

All functions return None on any failure so callers can degrade gracefully.
"""

import hashlib
import io
import json
import logging
from collections import OrderedDict

import requests
from django.conf import settings

logger = logging.getLogger(__name__)

_VALID_WASTE_TYPES = {"bottles", "bags", "mixed", "other"}

# ── In-process LRU cache keyed by image MD5 ──────────────────────────────────
# Prevents hammering the Gemini API when the same image is submitted multiple
# times (common during dev/demo). Survives across requests within one process.
_CACHE: "OrderedDict[str, dict]" = OrderedDict()
_CACHE_MAX = 100


def _cache_get(image_hash: str) -> dict | None:
    if image_hash in _CACHE:
        _CACHE.move_to_end(image_hash)
        return _CACHE[image_hash]
    return None


def _cache_set(image_hash: str, result: dict) -> None:
    _CACHE[image_hash] = result
    _CACHE.move_to_end(image_hash)
    if len(_CACHE) > _CACHE_MAX:
        _CACHE.popitem(last=False)


_PROMPT = """You are a waste management AI assistant for pTrack, a citizen plastic-waste reporting system in Rwanda.
Analyse the submitted image and respond ONLY with valid JSON — no prose, no markdown fences.

Context:
- Citizen's description: "{description}"
- Location sector: "{sector}"

Respond with this exact JSON structure (no extra keys):
{{
  "waste_type": "bottles",
  "confidence": 0.85,
  "priority": 2,
  "priority_reason": "Large volume of bottles near a drainage channel.",
  "is_valid": true,
  "invalid_reason": "",
  "description_en": "Several plastic bottles are scattered near a drainage channel, posing a flood-risk hazard.",
  "description_rw": "Incupa za plastiki nyinshi ziramanikiye hafi y'umwonga, bitera ingorane z'imikorere y'amazi."
}}

Field rules:
- waste_type: one of "bottles" (plastic bottles/containers), "bags" (plastic bags/wrapping), "mixed" (multiple plastic types), "other" (non-plastic or unidentifiable)
- confidence: float 0.0–1.0 representing certainty about waste_type
- priority: integer 1–5
    P1 = Highest urgency — large volume, near waterway/drain, flood-risk area
    P2 = High — significant waste in public or high-traffic area
    P3 = Medium — moderate amount in residential area
    P4 = Low — small amount, low-risk location
    P5 = Lowest — minimal waste, no immediate environmental concern
- is_valid: true only if the image clearly shows waste or litter; false for selfies, scenery, food, blank images, etc.
- invalid_reason: brief explanation if is_valid is false, otherwise empty string
- description_en: 1–2 sentence English description of the visible waste, suitable for a citizen report; empty string if is_valid is false
- description_rw: same description in Kinyarwanda; empty string if is_valid is false
"""


# Models tried in order of free-tier RPD generosity (highest first).
# count_tokens has separate quota from generate_content, so we only treat a
# model as "working" after a real generate_content call succeeds.
_MODEL_CANDIDATES = [
    "gemini-1.5-flash",  # 1 500 RPD on free tier with a fresh project
    "gemini-1.5-flash-latest",  # alias for the same model
    "gemini-flash-latest",  # 20 RPD (gemini-3.6-flash) — last resort
]
_WORKING_MODEL: str | None = None  # set on first successful generate_content call


def _pil_to_jpeg_bytes(pil_image, max_side: int = 1024, quality: int = 85) -> bytes:
    """Downscale and JPEG-encode to avoid lossless-WebP OOM in the Gemini SDK."""
    import PIL.Image

    if pil_image.mode not in ("RGB", "L"):
        pil_image = pil_image.convert("RGB")
    w, h = pil_image.size
    if max(w, h) > max_side:
        scale = max_side / max(w, h)
        pil_image = pil_image.resize((int(w * scale), int(h * scale)), PIL.Image.Resampling.LANCZOS)
    buf = io.BytesIO()
    pil_image.save(buf, format="JPEG", quality=quality)
    return buf.getvalue()


def _run(jpeg_bytes: bytes, description: str, sector: str) -> dict | None:
    """Core inference: try each model candidate until one succeeds."""
    global _WORKING_MODEL

    api_key = getattr(settings, "GEMINI_API_KEY", "")
    if not api_key:
        logger.info("GEMINI_API_KEY not set — AI analysis disabled")
        return None
    try:
        import google.generativeai as genai
    except ImportError:
        logger.error("google-generativeai package not installed")
        return None

    genai.configure(api_key=api_key)

    prompt = _PROMPT.format(
        description=description or "No description provided",
        sector=sector or "Unknown",
    )

    # Prefer the previously successful model; fall back to full list otherwise.
    candidates = (
        [_WORKING_MODEL] + [m for m in _MODEL_CANDIDATES if m != _WORKING_MODEL]
        if _WORKING_MODEL
        else _MODEL_CANDIDATES
    )

    img_blob = {"mime_type": "image/jpeg", "data": jpeg_bytes}

    for model_name in candidates:
        try:
            model = genai.GenerativeModel(model_name)
            response = model.generate_content([prompt, img_blob])

            # Succeeded — cache this model name for future calls.
            if _WORKING_MODEL != model_name:
                logger.info("Gemini: using model %s", model_name)
                _WORKING_MODEL = model_name

            raw = response.text.strip()
            if raw.startswith("```"):
                parts = raw.split("```")
                raw = parts[1] if len(parts) > 1 else parts[0]
                if raw.startswith("json"):
                    raw = raw[4:]

            data = json.loads(raw.strip())

            waste_type = data.get("waste_type", "other")
            if waste_type not in _VALID_WASTE_TYPES:
                waste_type = "other"

            priority = int(data.get("priority", 3))
            priority = max(1, min(5, priority))

            return {
                "waste_type": waste_type,
                "confidence": float(data.get("confidence", 0.0)),
                "priority": priority,
                "priority_reason": str(data.get("priority_reason", ""))[:500],
                "is_valid": bool(data.get("is_valid", True)),
                "invalid_reason": str(data.get("invalid_reason", ""))[:500],
                "description_en": str(data.get("description_en", ""))[:500],
                "description_rw": str(data.get("description_rw", ""))[:500],
            }

        except Exception as exc:
            exc_str = str(exc)
            if "404" in exc_str or "is not found" in exc_str:
                logger.debug("Model %s: not found for this project, skipping", model_name)
                if _WORKING_MODEL == model_name:
                    _WORKING_MODEL = None
                continue
            if "429" in exc_str or "RESOURCE_EXHAUSTED" in exc_str:
                logger.warning("Model %s: quota exceeded, trying next candidate", model_name)
                if _WORKING_MODEL == model_name:
                    _WORKING_MODEL = None
                continue
            # Non-retryable error (bad response, parse failure, auth, etc.)
            logger.warning("Gemini analysis failed on %s: %s", model_name, exc)
            return None

    logger.warning("All Gemini model candidates exhausted or unavailable")
    return None


def analyse_bytes(image_bytes: bytes, description: str, sector: str) -> dict | None:
    """
    Analyse raw image bytes (e.g. from request.FILES before any DB save).
    Returns a result dict or None if AI is unavailable.
    """
    image_hash = hashlib.md5(image_bytes).hexdigest()
    cached = _cache_get(image_hash)
    if cached is not None:
        logger.debug("AI cache hit for image %s", image_hash[:8])
        return cached
    try:
        import PIL.Image

        pil_image = PIL.Image.open(io.BytesIO(image_bytes))
        jpeg_bytes = _pil_to_jpeg_bytes(pil_image)
        result = _run(jpeg_bytes, description, sector)
        if result is not None:
            _cache_set(image_hash, result)
        return result
    except Exception as exc:
        logger.warning("Could not open image bytes for analysis: %s", exc)
        return None


def analyse_report(image_url: str, description: str, sector: str) -> dict | None:
    """
    Download an image from a URL and run analysis.
    Used to populate AI fields on an already-saved report.
    Returns a result dict or None if unavailable.
    """
    try:
        resp = requests.get(image_url, timeout=15)
        resp.raise_for_status()
        return analyse_bytes(resp.content, description, sector)
    except Exception as exc:
        logger.warning("Could not download image for AI analysis (%s): %s", image_url, exc)
        return None
