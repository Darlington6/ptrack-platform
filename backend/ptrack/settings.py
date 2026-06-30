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
    "anymail",
    # local apps
    "cloudinary_storage",
    "cloudinary",
    "accounts",
    "reports",
    "core",
    "recycling_centres",
    "nudges",
    "education",
    "push",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",  # must be first
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "axes.middleware.AxesMiddleware",  # after AuthenticationMiddleware
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

# cached_db: writes to both Redis and the DB — survives Redis being unavailable locally
SESSION_ENGINE = "django.contrib.sessions.backends.cached_db"
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
        "google_auth": "10/min",
        "report_submit": "10/hour",
        "recycling_log": "20/day",
        "map_bbox": "60/hour",
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
    "SECURITY": [{"BearerAuth": []}],
    "COMPONENTS": {
        "securitySchemes": {
            "BearerAuth": {
                "type": "http",
                "scheme": "bearer",
                "bearerFormat": "JWT",
                "description": (
                    "JWT access token. Obtain via POST /api/v1/auth/login/ "
                    "and set as: Authorization: Bearer <token>"
                ),
            }
        }
    },
    "TAGS": [
        {"name": "auth", "description": "Registration, login, JWT refresh, current user"},
        {"name": "reports", "description": "Waste report submission and verification"},
        {"name": "recycling", "description": "Recycling activity logging"},
        {"name": "leaderboard", "description": "Top users by points"},
        {"name": "rewards", "description": "User reward history"},
        {"name": "recycling-centres", "description": "Kigali recycling drop-off centres"},
        {"name": "nudges", "description": "Personalised behavioural nudges"},
        {"name": "education", "description": "Education articles about recycling and climate"},
        {"name": "notifications", "description": "In-app notification inbox"},
        {"name": "health", "description": "Service health check"},
        {"name": "admin-analytics", "description": "Platform analytics (admin only)"},
        {"name": "admin-audit-logs", "description": "Admin audit trail (admin only)"},
        {"name": "admin-reports", "description": "Bulk report management (admin only)"},
        {
            "name": "admin-configurations",
            "description": "Point and badge configuration (admin only)",
        },
        {
            "name": "admin-recycling-centres",
            "description": "Recycling centre management (admin only)",
        },
        {"name": "admin-education", "description": "Education content management (admin only)"},
    ],
}

# ── CORS ───────────────────────────────────────────────────────────────────────
CORS_ALLOWED_ORIGINS = [o.strip() for o in cfg.CORS_ALLOWED_ORIGINS.split(",") if o.strip()]
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = [
    "accept",
    "authorization",
    "content-type",
    "origin",
    "x-csrftoken",
    "x-requested-with",
    "x-request-id",
]

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
    # Trust Render's (and any reverse proxy's) X-Forwarded-Proto header so
    # Django knows the original request was HTTPS. Without this, Django sees
    # every internal HTTP request as plain HTTP and issues an infinite HTTPS
    # redirect loop, causing 500s on browser-driven pages like the admin.
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    CSRF_TRUSTED_ORIGINS = [
        f"https://{h.strip()}"
        for h in cfg.ALLOWED_HOSTS.split(",")
        if h.strip() and "localhost" not in h.strip() and "127.0.0.1" not in h.strip()
    ]

# ── Content Security Policy ───────────────────────────────────────────────────
# Swagger UI loads assets from jsDelivr CDN; exempt docs paths from CSP
CSP_EXCLUDE_URL_PREFIXES = ("/api/v1/docs", "/api/v1/schema")

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
GOOGLE_OAUTH_CLIENT_ID = cfg.GOOGLE_OAUTH_CLIENT_ID
USE_CLOUDINARY = cfg.USE_CLOUDINARY

# ── Web Push (VAPID) ──────────────────────────────────────────────────────────
VAPID_PUBLIC_KEY = cfg.VAPID_PUBLIC_KEY
VAPID_PRIVATE_KEY = cfg.VAPID_PRIVATE_KEY
VAPID_SUBJECT = cfg.VAPID_SUBJECT

# ── Email ─────────────────────────────────────────────────────────────────────
DEFAULT_FROM_EMAIL = cfg.DEFAULT_FROM_EMAIL
SERVER_EMAIL = DEFAULT_FROM_EMAIL

if cfg.RESEND_API_KEY:
    EMAIL_BACKEND = "anymail.backends.resend.EmailBackend"
    ANYMAIL = {"RESEND_API_KEY": cfg.RESEND_API_KEY}
else:
    EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

# ── Logging ───────────────────────────────────────────────────────────────────
_LOG_FORMATTER = "json" if not DEBUG else "verbose"

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "json": {
            "()": "pythonjsonlogger.json.JsonFormatter",
            "format": "%(asctime)s %(name)s %(levelname)s %(message)s",
        },
        "verbose": {
            "format": "{asctime} {levelname} {name} {message}",
            "style": "{",
        },
    },
    "filters": {
        "require_debug_false": {"()": "django.utils.log.RequireDebugFalse"},
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": _LOG_FORMATTER,
        },
    },
    "root": {
        "handlers": ["console"],
        "level": "INFO",
    },
    "loggers": {
        "django": {"handlers": ["console"], "level": "WARNING", "propagate": False},
        "django.request": {"handlers": ["console"], "level": "ERROR", "propagate": False},
        "ptrack": {
            "handlers": ["console"],
            "level": "DEBUG" if DEBUG else "INFO",
            "propagate": False,
        },
        "accounts": {
            "handlers": ["console"],
            "level": "DEBUG" if DEBUG else "INFO",
            "propagate": False,
        },
        "reports": {
            "handlers": ["console"],
            "level": "DEBUG" if DEBUG else "INFO",
            "propagate": False,
        },
        "core": {
            "handlers": ["console"],
            "level": "DEBUG" if DEBUG else "INFO",
            "propagate": False,
        },
    },
}
