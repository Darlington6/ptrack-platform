from django.core.cache import cache
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from core.pagination import StandardPagination
from reports.permissions import IsAdminRole

from .models import Article
from .serializers import ArticleDetailSerializer, ArticleListSerializer

_ARTICLE_LIST_CACHE_TTL = 600  # 10 minutes


# ── Public endpoints ───────────────────────────────────────────────────────────


@extend_schema(
    tags=["education"],
    parameters=[
        OpenApiParameter("category", str, description="Filter by category"),
        OpenApiParameter("q", str, description="Search in title"),
    ],
    responses={200: ArticleListSerializer(many=True)},
    summary="List published education articles",
)
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def article_list(request):
    """Return published articles; supports ?category= and ?q= filters."""
    qs = Article.objects.filter(is_published=True)

    category = request.query_params.get("category")
    if category:
        qs = qs.filter(category=category)

    q = request.query_params.get("q")
    if q:
        qs = qs.filter(title_en__icontains=q)

    paginator = StandardPagination()
    page = paginator.paginate_queryset(qs, request)
    if page is not None:
        return paginator.get_paginated_response(ArticleListSerializer(page, many=True).data)
    return Response(ArticleListSerializer(qs, many=True).data)


@extend_schema(
    tags=["education"],
    responses={200: ArticleDetailSerializer},
    summary="Retrieve a single published article by slug",
)
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def article_detail(request, slug):
    cache_key = f"education:article:{slug}"
    data = cache.get(cache_key)
    if data is None:
        try:
            article = Article.objects.get(slug=slug, is_published=True)
        except Article.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        data = ArticleDetailSerializer(article).data
        cache.set(cache_key, data, timeout=_ARTICLE_LIST_CACHE_TTL)
    return Response(data)


# ── Admin endpoints ────────────────────────────────────────────────────────────


@extend_schema(
    tags=["admin-education"],
    responses={200: ArticleDetailSerializer(many=True)},
    summary="List all articles including unpublished (admin only)",
)
@api_view(["GET"])
@permission_classes([IsAdminRole])
def admin_article_list(request):
    qs = Article.objects.all().order_by("-created_at")
    paginator = StandardPagination()
    page = paginator.paginate_queryset(qs, request)
    if page is not None:
        return paginator.get_paginated_response(ArticleDetailSerializer(page, many=True).data)
    return Response(ArticleDetailSerializer(qs, many=True).data)


@extend_schema(
    tags=["admin-education"],
    request=ArticleDetailSerializer,
    responses={201: ArticleDetailSerializer},
    summary="Create an article (admin only)",
)
@api_view(["POST"])
@permission_classes([IsAdminRole])
def admin_article_create(request):
    serializer = ArticleDetailSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    article = serializer.save()
    return Response(ArticleDetailSerializer(article).data, status=status.HTTP_201_CREATED)


@extend_schema(
    tags=["admin-education"],
    request=ArticleDetailSerializer,
    responses={200: ArticleDetailSerializer},
    summary="Update an article (admin only)",
)
@api_view(["PATCH"])
@permission_classes([IsAdminRole])
def admin_article_update(request, slug):
    try:
        article = Article.objects.get(slug=slug)
    except Article.DoesNotExist:
        return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
    serializer = ArticleDetailSerializer(article, data=request.data, partial=True)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    serializer.save()
    cache.delete(f"education:article:{slug}")
    return Response(serializer.data)


@extend_schema(
    tags=["admin-education"],
    responses={204: None},
    summary="Delete an article (admin only)",
)
@api_view(["DELETE"])
@permission_classes([IsAdminRole])
def admin_article_delete(request, slug):
    try:
        article = Article.objects.get(slug=slug)
    except Article.DoesNotExist:
        return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
    article.delete()
    cache.delete(f"education:article:{slug}")
    return Response(status=status.HTTP_204_NO_CONTENT)
