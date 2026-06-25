from django.urls import path

from . import views

urlpatterns = [
    # Public
    path("education/articles/", views.article_list, name="education-article-list"),
    path("education/articles/<slug:slug>/", views.article_detail, name="education-article-detail"),
    # Admin
    path("admin/education/articles/", views.admin_article_list, name="admin-article-list"),
    path(
        "admin/education/articles/create/", views.admin_article_create, name="admin-article-create"
    ),
    path(
        "admin/education/articles/<slug:slug>/",
        views.admin_article_update,
        name="admin-article-update",
    ),
    path(
        "admin/education/articles/<slug:slug>/delete/",
        views.admin_article_delete,
        name="admin-article-delete",
    ),
]
