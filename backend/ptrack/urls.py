"""
URL configuration for the pTrack project.

API routes:
  /api/auth/  → accounts.urls  (register, login, refresh, me)
  /api/       → reports.urls   (reports, recycling, leaderboard, rewards)

API docs (development only):
  /api/schema/        → raw OpenAPI 3.0 JSON schema
  /api/docs/          → Swagger UI   (interactive)
  /api/redoc/         → ReDoc UI     (read-only, clean)
  /api-auth/          → DRF browsable-API session login/logout
  /django-admin/      → Django admin panel
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

# Uncomment the lines below to test Sentry error tracking with a sample endpoint
# from django.http import HttpResponse
# def trigger_error(request):
#     division_by_zero = 1 / 0
#     return HttpResponse("Error triggered!", status=500)
urlpatterns = [
    # Django admin
    path("django-admin/", admin.site.urls),
    # Sentry test endpoint (uncomment to test Sentry integration)
    # path("sentry-debug/", trigger_error),
    # Browsable API session auth (shows Login/Logout in the DRF browser UI)
    path("api-auth/", include("rest_framework.urls")),
    # Application API
    path("api/auth/", include("accounts.urls")),
    path("api/", include("reports.urls")),
    # OpenAPI schema + interactive docs
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
