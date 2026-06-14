"""
URL configuration for the pTrack project.

All application routes live under /api/v1/.

API docs:
  /api/v1/schema/   → raw OpenAPI 3.0 JSON
  /api/v1/docs/     → Swagger UI
  /api/v1/redoc/    → ReDoc UI
  /api-auth/        → DRF browsable-API session login/logout
  /django-admin/    → Django admin panel
"""

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

urlpatterns = [
    path("django-admin/", admin.site.urls),
    path("api-auth/", include("rest_framework.urls")),

    # ── v1 API ──────────────────────────────────────────────────────────────
    path("api/v1/auth/", include("accounts.urls")),
    path("api/v1/", include("reports.urls")),
    path("api/v1/", include("recycling_centres.urls")),
    path("api/v1/", include("nudges.urls")),
    path("api/v1/", include("core.urls")),

    # ── OpenAPI docs ─────────────────────────────────────────────────────────
    path("api/v1/schema/", SpectacularAPIView.as_view(), name="schema"),
    path(
        "api/v1/docs/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
    path(
        "api/v1/redoc/",
        SpectacularRedocView.as_view(url_name="schema"),
        name="redoc",
    ),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
