from django.urls import path

from . import views

urlpatterns = [
    path("nudges/me/", views.my_nudges, name="nudges-me"),
]
