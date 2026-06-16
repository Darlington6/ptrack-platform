from django.urls import path

from . import views

urlpatterns = [
    path("reports/", views.reports_list_create, name="reports-list-create"),
    path("reports/<int:pk>/", views.report_detail, name="report-detail"),
    path("reports/<int:pk>/verify/", views.report_verify, name="report-verify"),
    path("recycling/", views.recycling_list_create, name="recycling-list-create"),
    path("leaderboard/", views.leaderboard, name="leaderboard"),
    path("rewards/me/", views.my_rewards, name="my-rewards"),
    path("community/stats/", views.community_stats, name="community-stats"),
    path("community/trends/", views.community_trends, name="community-trends"),
    path("badges/", views.badges_list, name="badges-list"),
]
