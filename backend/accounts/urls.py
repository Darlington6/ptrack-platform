from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from . import views

urlpatterns = [
    path("register/", views.register, name="auth-register"),
    path("login/", views.login, name="auth-login"),
    path("refresh/", TokenRefreshView.as_view(), name="auth-refresh"),
    path("me/", views.me, name="auth-me"),
    path("me/password/", views.password_change, name="auth-password-change"),
    path("me/avatar/", views.avatar, name="auth-avatar"),
    path("me/impact/", views.impact, name="auth-impact"),
    path("me/export/", views.export_data, name="auth-export"),
    path("me/delete/", views.delete_account, name="auth-delete"),
    path("verify/send/", views.verify_send, name="auth-verify-send"),
    path("verify/confirm/", views.verify_confirm, name="auth-verify-confirm"),
    path("password/reset/request/", views.password_reset_request, name="auth-password-reset-request"),
    path("password/reset/confirm/", views.password_reset_confirm, name="auth-password-reset-confirm"),
]
