from django.urls import path

from . import views

urlpatterns = [
    path("health/", views.health_check, name="health-check"),
    # Notifications
    path("notifications/", views.notifications_list, name="notifications-list"),
    path("notifications/read-all/", views.notifications_read_all, name="notifications-read-all"),
    path("notifications/<int:pk>/read/", views.notification_read, name="notification-read"),
    path("notifications/<int:pk>/", views.notification_delete, name="notification-delete"),
]
