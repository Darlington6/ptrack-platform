"""
pTrack Django settings.

Environment variables are validated by ptrack.config.Settings (pydantic-settings).
SQLite is the default database for local dev; set DATABASE_URL to a postgres://
connection string to switch to PostgreSQL.
"""

from datetime import timedelta
from pathlib import Path

import sentry_sdk
from sentry_sdk.integrations.django import DjangoIntegration

from ptrack.config import cfg

sentry_sdk.init(
    dsn=cfg.SENTRY_DSN or None,
    integrations=[DjangoIntegration()],
    traces_sample_rate=1.0,
    send_default_pii=True,
    release=cfg.APP_VERSION,
    environment="development" if cfg.DEBUG else "production",
)

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = cfg.SECRET_KEY
DEBUG = cfg.DEBUG
ALLOWED_HOSTS = [h.strip() for h in cfg.ALLOWED_HOSTS.split(",") if h.strip()]

APP_VERSION = cfg.APP_VERSION

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # third-party
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "corsheaders",
    "drf_spectacular",
    "axes",
    # local apps
    "cloudinary_storage",
    "cloudinary",
    "accounts",
    "reports",
    "core",
    "recycling_centres",
    "nudges",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",           # must be first
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "axes.middleware.AxesMiddleware",                  # after AuthenticationMiddleware
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "csp.middleware.CSPMiddleware",
    "core.middleware.AuditLogMiddleware",
]

ROOT_URLCONF = "ptrack.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "ptrack.wsgi.application"
ASGI_APPLICATION = "ptrack.asgi.application"

# ── Database ──────────────────────────────────────────────────────────────────
DATABASE_URL = cfg.DATABASE_URL

if DATABASE_URL.startswith("postgres://") or DATABASE_URL.startswith("postgresql://"):
    import urllib.parse

    _url = urllib.parse.urlparse(DATABASE_URL)
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": _url.path.lstrip("/"),
            "USER": _url.username,
            "PASSWORD": _url.password,
            "HOST": _url.hostname,
            "PORT": _url.port or 5432,
        }
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": str(BASE_DIR / "db.sqlite3"),
        }
    }

# ── Cache (Redis) ─────────────────────────────────────────────────────────────
REDIS_URL = cfg.REDIS_URL

CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": REDIS_URL,
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
            "IGNORE_EXCEPTIONS": True,  # degrade gracefully if Redis is down
        },
        "KEY_PREFIX": "ptrack",
    }
}

# Use Redis for Django sessions too
SESSION_ENGINE = "django.contrib.sessions.backends.cache"
SESSION_CACHE_ALIAS = "default"

# ── Authentication ────────────────────────────────────────────────────────────
AUTHENTICATION_BACKENDS = [
    "axes.backends.AxesStandaloneBackend",
    "django.contrib.auth.backends.ModelBackend",
]

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.Argon2PasswordHasher",
    "django.contrib.auth.hashers.PBKDF2PasswordHasher",
    "django.contrib.auth.hashers.PBKDF2SHA1PasswordHasher",
    "django.contrib.auth.hashers.BCryptSHA256PasswordHasher",
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "Africa/Kigali"
USE_I18N = True
USE_TZ = True

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
AUTH_USER_MODEL = "accounts.User"

# ── Django REST Framework ──────────────────────────────────────────────────────
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
        "rest_framework.authentication.SessionAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.IsAuthenticated",),
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    # Throttling
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": "100/hour",
        "user": "1000/hour",
        "auth": "5/min",
        "report_submit": "10/hour",
        "recycling_log": "20/day",
    },
    # Pagination
    "DEFAULT_PAGINATION_CLASS": "core.pagination.StandardPagination",
    "PAGE_SIZE": 20,
}

# ── JWT Configuration ──────────────────────────────────────────────────────────
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(hours=8),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "ALGORITHM": "HS256",
    "SIGNING_KEY": SECRET_KEY,
    "AUTH_HEADER_TYPES": ("Bearer",),
}

# ── OpenAPI / Spectacular ──────────────────────────────────────────────────────
SPECTACULAR_SETTINGS = {
    "TITLE": "pTrack API",
    "DESCRIPTION": (
        "REST API for pTrack — a digital incentive platform for plastic waste "
        "management in Kigali, Rwanda. "
        "Authenticate via POST /api/v1/auth/login/ to obtain a JWT, then click "
        "'Authorize' and enter: Bearer <your_access_token>."
    ),
    "VERSION": APP_VERSION,
    "SERVE_INCLUDE_SCHEMA": False,
    "CONTACT": {"name": "Desmond Tunyinko", "email": "d.tunyinko@alustudent.com"},
    "LICENSE": {"name": "MIT"},
    "TAGS": [
        {"name": "auth", "description": "Registration, login, JWT refresh, current user"},
        {"name": "reports", "description": "Waste report submission and verification"},
        {"name": "recycling", "description": "Recycling activity logging"},
        {"name": "leaderboard", "description": "Top users by points"},
        {"name": "rewards", "description": "User reward history"},
        {"name": "recycling-centres", "description": "Kigali recycling drop-off centres"},
        {"name": "nudges", "description": "Personalised behavioural nudges"},
        {"name": "health", "description": "Service health check"},
    ],
}

# ── CORS ───────────────────────────────────────────────────────────────────────
CORS_ALLOWED_ORIGINS = [
    o.strip() for o in cfg.CORS_ALLOWED_ORIGINS.split(",") if o.strip()
]
CORS_ALLOW_CREDENTIALS = True

# ── Storage ───────────────────────────────────────────────────────────────────
STORAGES = {
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
}

if cfg.USE_CLOUDINARY:
    STORAGES["default"] = {
        "BACKEND": "cloudinary_storage.storage.MediaCloudinaryStorage",
    }
    CLOUDINARY_STORAGE = {
        "CLOUD_NAME": cfg.CLOUDINARY_CLOUD_NAME,
        "API_KEY": cfg.CLOUDINARY_API_KEY,
        "API_SECRET": cfg.CLOUDINARY_API_SECRET,
    }

# ── Security headers ──────────────────────────────────────────────────────────
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"
SECURE_REFERRER_POLICY = "strict-origin-when-cross-origin"
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = "Lax"

if not DEBUG:
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True

# ── Content Security Policy ───────────────────────────────────────────────────
CSP_DEFAULT_SRC = ("'self'",)
CSP_SCRIPT_SRC = (
    "'self'",
    "https://maps.googleapis.com",
    "https://accounts.google.com",
    "https://apis.google.com",
)
CSP_STYLE_SRC = (
    "'self'",
    "'unsafe-inline'",
    "https://fonts.googleapis.com",
)
CSP_FONT_SRC = (
    "'self'",
    "https://fonts.gstatic.com",
)
CSP_IMG_SRC = (
    "'self'",
    "data:",
    "blob:",
    "https://res.cloudinary.com",
    "https://*.googleapis.com",
    "https://*.gstatic.com",
)
CSP_CONNECT_SRC = (
    "'self'",
    "https://maps.googleapis.com",
    "https://o0.ingest.sentry.io",
    "https://*.sentry.io",
)

# ── django-axes (brute-force protection) ──────────────────────────────────────
AXES_FAILURE_LIMIT = 5
AXES_COOLOFF_TIME = timedelta(minutes=15)
AXES_RESET_ON_SUCCESS = True
AXES_LOCKOUT_PARAMETERS = ["ip_address"]
AXES_CACHE = "default"

# ── Misc ──────────────────────────────────────────────────────────────────────
RESEND_API_KEY = cfg.RESEND_API_KEY
GOOGLE_MAPS_API_KEY = cfg.GOOGLE_MAPS_API_KEY