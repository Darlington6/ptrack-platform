from django.urls import path

from . import views

urlpatterns = [
    path("recycling-centres/", views.centres_list, name="recycling-centres-list"),
    path("recycling-centres/<int:pk>/", views.centre_detail, name="recycling-centres-detail"),
    # Admin CRUD
    path("admin/recycling-centres/", views.admin_centre_create, name="admin-centre-create"),
    path(
        "admin/recycling-centres/<int:pk>/",
        views.admin_centre_update,
        name="admin-centre-update",
    ),
    path(
        "admin/recycling-centres/<int:pk>/delete/",
        views.admin_centre_delete,
        name="admin-centre-delete",
    ),
]
