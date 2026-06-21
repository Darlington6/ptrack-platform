from django.urls import path

from . import views

urlpatterns = [
    path("push/subscribe/", views.subscribe, name="push-subscribe"),
    path("push/unsubscribe/", views.unsubscribe, name="push-unsubscribe"),
    path("push/vapid-key/", views.vapid_public_key, name="push-vapid-key"),
]
