from rest_framework import serializers

from .models import Article


class ArticleListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views — omits body fields."""

    class Meta:
        model = Article
        fields = [
            "id",
            "slug",
            "title_en",
            "title_rw",
            "cover_image",
            "category",
            "reading_time_minutes",
            "published_at",
        ]
        read_only_fields = fields


class ArticleDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Article
        fields = [
            "id",
            "slug",
            "title_en",
            "title_rw",
            "body_en",
            "body_rw",
            "cover_image",
            "category",
            "reading_time_minutes",
            "is_published",
            "published_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
