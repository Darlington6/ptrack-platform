from django.urls import path

from . import views

urlpatterns = [
    path("recycling-centres/", views.centres_list, name="recycling-centres-list"),
]