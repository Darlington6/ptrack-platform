from rest_framework.pagination import CursorPagination, PageNumberPagination


class StandardPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


class FeedCursorPagination(CursorPagination):
    """Cursor-based pagination for append-only feeds (Notifications, AuditLog, RewardHistory)."""

    page_size = 20
    ordering = "-created_at"
    cursor_query_param = "cursor"