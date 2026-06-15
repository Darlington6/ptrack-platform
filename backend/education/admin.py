from django.contrib import admin

from .models import Article


@admin.register(Article)
class ArticleAdmin(admin.ModelAdmin):
    list_display = ["title_en", "category", "is_published", "published_at", "created_at"]
    list_filter = ["category", "is_published"]
    search_fields = ["title_en", "title_rw"]
    prepopulated_fields = {"slug": ("title_en",)}
