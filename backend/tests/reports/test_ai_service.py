"""Tests for Gemini AI service (reports/ai_service.py)."""

import hashlib
import io
import json
from unittest.mock import MagicMock, patch

import pytest

import reports.ai_service as ai_module
from reports.ai_service import (
    _CACHE,
    _CACHE_MAX,
    _cache_get,
    _cache_set,
    analyse_bytes,
    analyse_report,
)

# ── Fixtures ──────────────────────────────────────────────────────────────────


@pytest.fixture(autouse=True)
def reset_ai_globals():
    """Clear module-level cache and working model before every test."""
    _CACHE.clear()
    ai_module._WORKING_MODEL = None
    yield
    _CACHE.clear()
    ai_module._WORKING_MODEL = None


def _png_bytes(w=10, h=10):
    """Return minimal valid PNG bytes."""
    import PIL.Image

    buf = io.BytesIO()
    PIL.Image.new("RGB", (w, h), color=(0, 128, 0)).save(buf, format="PNG")
    return buf.getvalue()


def _mock_genai(response_dict: dict, side_effect=None):
    """Return a mock genai module whose GenerativeModel.generate_content behaves as specified."""
    mock_genai = MagicMock()
    mock_model = MagicMock()
    if side_effect is not None:
        mock_model.generate_content.side_effect = side_effect
    else:
        mock_resp = MagicMock()
        mock_resp.text = json.dumps(response_dict)
        mock_model.generate_content.return_value = mock_resp
    mock_genai.GenerativeModel.return_value = mock_model
    return mock_genai


_VALID_PAYLOAD = {
    "waste_type": "bottles",
    "confidence": 0.9,
    "priority": 2,
    "priority_reason": "Near drain.",
    "is_valid": True,
    "invalid_reason": "",
    "description_en": "Plastic bottles.",
    "description_rw": "Incupa.",
}


# ── Cache helpers ─────────────────────────────────────────────────────────────


def test_cache_miss_returns_none():
    assert _cache_get("no_such_key") is None


def test_cache_set_and_get_round_trip():
    data = {"waste_type": "bags"}
    _cache_set("k1", data)
    assert _cache_get("k1") == data


def test_cache_moves_to_end_on_get():
    _cache_set("first", {"n": 1})
    _cache_set("second", {"n": 2})
    _cache_get("first")  # promote first
    assert list(_CACHE.keys())[-1] == "first"


def test_cache_evicts_oldest_when_full():
    for i in range(_CACHE_MAX):
        _cache_set(f"k{i}", {"n": i})
    _cache_set("overflow", {"n": "new"})
    # k0 should be evicted (oldest)
    assert _cache_get("k0") is None
    assert _cache_get("overflow") is not None


# ── No API key ────────────────────────────────────────────────────────────────


def test_analyse_bytes_returns_none_when_api_key_missing(settings):
    settings.GEMINI_API_KEY = ""
    result = analyse_bytes(b"any bytes", "desc", "Kimironko")
    assert result is None


# ── genai import error ────────────────────────────────────────────────────────


def test_analyse_bytes_returns_none_when_genai_not_installed(settings):
    settings.GEMINI_API_KEY = "fake-key"
    import builtins

    real_import = builtins.__import__

    def _fail_genai(name, *args, **kwargs):
        if name == "google.generativeai":
            raise ImportError("not installed")
        return real_import(name, *args, **kwargs)

    with patch("builtins.__import__", side_effect=_fail_genai):
        result = analyse_bytes(_png_bytes(), "desc", "sector")
    assert result is None


# ── Cache hit skips _run ──────────────────────────────────────────────────────


def test_analyse_bytes_returns_cached_result_without_calling_run(settings):
    settings.GEMINI_API_KEY = "fake-key"
    img = _png_bytes()
    img_hash = hashlib.md5(img).hexdigest()
    cached = {"waste_type": "other", "is_valid": False}
    _cache_set(img_hash, cached)

    with patch("reports.ai_service._run") as mock_run:
        result = analyse_bytes(img, "desc", "sector")
        mock_run.assert_not_called()
    assert result == cached


# ── PIL open failure ──────────────────────────────────────────────────────────


def test_analyse_bytes_returns_none_on_invalid_image_bytes(settings):
    settings.GEMINI_API_KEY = "fake-key"
    result = analyse_bytes(b"not an image", "desc", "sector")
    assert result is None


# ── Successful inference ──────────────────────────────────────────────────────


def test_analyse_bytes_success_returns_normalised_dict(settings):
    settings.GEMINI_API_KEY = "fake-key"
    mock_genai = _mock_genai(_VALID_PAYLOAD)

    with patch.dict("sys.modules", {"google.generativeai": mock_genai}):
        result = analyse_bytes(_png_bytes(), "desc", "Kimironko")

    assert result is not None
    assert result["waste_type"] == "bottles"
    assert result["priority"] == 2
    assert result["is_valid"] is True
    assert result["confidence"] == pytest.approx(0.9)


def test_analyse_bytes_caches_result_on_success(settings):
    settings.GEMINI_API_KEY = "fake-key"
    mock_genai = _mock_genai(_VALID_PAYLOAD)
    img = _png_bytes()
    img_hash = hashlib.md5(img).hexdigest()

    with patch.dict("sys.modules", {"google.generativeai": mock_genai}):
        analyse_bytes(img, "desc", "sector")

    assert _cache_get(img_hash) is not None


def test_analyse_bytes_clamps_priority_out_of_range(settings):
    settings.GEMINI_API_KEY = "fake-key"
    payload = {**_VALID_PAYLOAD, "priority": 99}
    mock_genai = _mock_genai(payload)

    with patch.dict("sys.modules", {"google.generativeai": mock_genai}):
        result = analyse_bytes(_png_bytes(), "", "")

    assert result["priority"] == 5


def test_analyse_bytes_normalises_unknown_waste_type(settings):
    settings.GEMINI_API_KEY = "fake-key"
    payload = {**_VALID_PAYLOAD, "waste_type": "junk"}
    mock_genai = _mock_genai(payload)

    with patch.dict("sys.modules", {"google.generativeai": mock_genai}):
        result = analyse_bytes(_png_bytes(), "", "")

    assert result["waste_type"] == "other"


def test_analyse_bytes_strips_markdown_fences(settings):
    settings.GEMINI_API_KEY = "fake-key"
    mock_genai = MagicMock()
    mock_resp = MagicMock()
    mock_resp.text = f"```json\n{json.dumps(_VALID_PAYLOAD)}\n```"
    mock_model = MagicMock()
    mock_model.generate_content.return_value = mock_resp
    mock_genai.GenerativeModel.return_value = mock_model

    with patch.dict("sys.modules", {"google.generativeai": mock_genai}):
        result = analyse_bytes(_png_bytes(), "", "")

    assert result is not None
    assert result["waste_type"] == "bottles"


# ── Model fallback: 404 ───────────────────────────────────────────────────────


def test_analyse_bytes_falls_back_after_404(settings):
    settings.GEMINI_API_KEY = "fake-key"
    mock_genai = MagicMock()
    fail_model = MagicMock()
    fail_model.generate_content.side_effect = Exception("404 model is not found")
    good_resp = MagicMock()
    good_resp.text = json.dumps(_VALID_PAYLOAD)
    good_model = MagicMock()
    good_model.generate_content.return_value = good_resp
    # First candidate raises 404; subsequent ones succeed
    mock_genai.GenerativeModel.side_effect = [fail_model, good_model, good_model]

    with patch.dict("sys.modules", {"google.generativeai": mock_genai}):
        result = analyse_bytes(_png_bytes(), "", "")

    assert result is not None
    assert result["waste_type"] == "bottles"


# ── Model fallback: 429 ───────────────────────────────────────────────────────


def test_analyse_bytes_returns_none_when_all_models_quota_exceeded(settings):
    settings.GEMINI_API_KEY = "fake-key"
    mock_genai = MagicMock()
    fail_model = MagicMock()
    fail_model.generate_content.side_effect = Exception("429 RESOURCE_EXHAUSTED")
    mock_genai.GenerativeModel.return_value = fail_model

    with patch.dict("sys.modules", {"google.generativeai": mock_genai}):
        result = analyse_bytes(_png_bytes(), "", "")

    assert result is None


# ── Non-retryable error ───────────────────────────────────────────────────────


def test_analyse_bytes_returns_none_on_non_retryable_error(settings):
    settings.GEMINI_API_KEY = "fake-key"
    mock_genai = _mock_genai({}, side_effect=ValueError("auth failure"))

    with patch.dict("sys.modules", {"google.generativeai": mock_genai}):
        result = analyse_bytes(_png_bytes(), "", "")

    assert result is None


# ── analyse_report ────────────────────────────────────────────────────────────


def test_analyse_report_downloads_and_delegates(settings):
    settings.GEMINI_API_KEY = "fake-key"
    img = _png_bytes()
    mock_resp = MagicMock()
    mock_resp.content = img

    with patch("reports.ai_service.requests.get", return_value=mock_resp):
        with patch("reports.ai_service._run", return_value={"waste_type": "bags"}) as mock_run:
            result = analyse_report("http://example.com/img.jpg", "desc", "Kimironko")

    assert result == {"waste_type": "bags"}
    mock_run.assert_called_once()


def test_analyse_report_returns_none_on_download_failure():
    with patch("reports.ai_service.requests.get", side_effect=Exception("network error")):
        result = analyse_report("http://example.com/img.jpg", "desc", "sector")
    assert result is None
