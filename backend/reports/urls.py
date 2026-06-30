from django.urls import path

from . import views

urlpatterns = [
    path("reports/", views.reports_list_create, name="reports-list-create"),
    path("reports/<int:pk>/", views.report_detail, name="report-detail"),
    path("reports/<int:pk>/verify/", views.report_verify, name="report-verify"),
    path("reports/<int:pk>/reject/", views.report_reject, name="report-reject"),
    path("reports/<int:pk>/resolve/", views.report_resolve, name="report-resolve"),
    path("recycling/", views.recycling_list_create, name="recycling-list-create"),
    path("leaderboard/", views.leaderboard, name="leaderboard"),
    path("rewards/me/", views.my_rewards, name="my-rewards"),
    path("community/stats/", views.community_stats, name="community-stats"),
    path(
        "community/stats/public/",
        views.community_stats_public,
        name="community-stats-public",
    ),
    path("community/trends/", views.community_trends, name="community-trends"),
    path("badges/", views.badges_list, name="badges-list"),
    path("point-configs/", views.point_configs, name="point-configs"),
]
