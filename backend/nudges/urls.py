from django.urls import path

from . import views

urlpatterns = [
    path("nudges/me/", views.my_nudges, name="nudges-me"),
    path("nudges/active/", views.active_nudges, name="nudges-active"),
    path("nudges/<int:pk>/dismiss/", views.nudge_dismiss, name="nudge-dismiss"),
    path("nudges/<int:pk>/acted/", views.nudge_acted, name="nudge-acted"),
]
