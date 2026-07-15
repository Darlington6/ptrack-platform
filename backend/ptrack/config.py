"""
Pydantic-settings configuration for pTrack.

All environment variables are declared here with types and defaults.
settings.py imports `cfg` from this module instead of calling os.getenv directly,
so missing or mistyped env vars surface at startup rather than at runtime.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Core Django
    SECRET_KEY: str = "django-insecure-dev-key-change-me"
    DEBUG: bool = True
    ALLOWED_HOSTS: str = "localhost,127.0.0.1"
    APP_VERSION: str = "0.1.0"

    # Database
    DATABASE_URL: str = "sqlite:///db.sqlite3"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # CORS
    CORS_ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    # Sentry
    SENTRY_DSN: str = ""

    # Cloudinary
    USE_CLOUDINARY: bool = False
    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""

    # External APIs
    BREVO_API_KEY: str = ""
    DEFAULT_FROM_EMAIL: str = "pTrack <noreply@ptrack.rw>"
    GOOGLE_MAPS_API_KEY: str = ""
    GOOGLE_OAUTH_CLIENT_ID: str = ""

    # Web Push (VAPID)
    VAPID_PUBLIC_KEY: str = ""
    VAPID_PRIVATE_KEY: str = ""
    VAPID_SUBJECT: str = "mailto:d.tunyinko@alustudent.com"

    # Cron job trigger secret (shared between GitHub Actions and this backend)
    CRON_SECRET: str = ""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


cfg = Settings()
