from django.urls import path

from . import admin_views as v

urlpatterns = [
    # Analytics
    path(
        "admin/analytics/reports-over-time/",
        v.analytics_reports_over_time,
        name="admin-analytics-reports-over-time",
    ),
    path(
        "admin/analytics/by-sector/",
        v.analytics_by_sector,
        name="admin-analytics-by-sector",
    ),
    path(
        "admin/analytics/by-type/",
        v.analytics_by_type,
        name="admin-analytics-by-type",
    ),
    path(
        "admin/analytics/top-users/",
        v.analytics_top_users,
        name="admin-analytics-top-users",
    ),
    path(
        "admin/analytics/heatmap/",
        v.analytics_heatmap,
        name="admin-analytics-heatmap",
    ),
    path(
        "admin/analytics/kpis/",
        v.analytics_kpis,
        name="admin-analytics-kpis",
    ),
    path(
        "admin/analytics/funnel/",
        v.analytics_funnel,
        name="admin-analytics-funnel",
    ),
    # Audit logs
    path("admin/audit-logs/", v.audit_log_list, name="admin-audit-log-list"),
    path("admin/audit-logs/export.csv", v.audit_log_export, name="admin-audit-log-export"),
    path("admin/audit-logs/<int:pk>/", v.audit_log_detail, name="admin-audit-log-detail"),
    # Reports bulk + export
    path("admin/reports/bulk-verify/", v.reports_bulk_verify, name="admin-reports-bulk-verify"),
    path("admin/reports/bulk-reject/", v.reports_bulk_reject, name="admin-reports-bulk-reject"),
    path("admin/reports/export.csv", v.reports_export, name="admin-reports-export"),
    # Reward config
    path(
        "admin/configurations/points/",
        v.point_config_list_create,
        name="admin-point-config-list",
    ),
    path(
        "admin/configurations/points/<int:pk>/",
        v.point_config_detail,
        name="admin-point-config-detail",
    ),
    path(
        "admin/configurations/badges/",
        v.badge_list_create,
        name="admin-badge-list",
    ),
    path(
        "admin/configurations/badges/<int:pk>/",
        v.badge_detail,
        name="admin-badge-detail",
    ),
    # User management
    path("admin/users/", v.admin_users_list, name="admin-users-list"),
    path("admin/users/export.csv", v.admin_users_export, name="admin-users-export"),
    path("admin/users/<int:pk>/", v.admin_user_detail, name="admin-user-detail"),
]
