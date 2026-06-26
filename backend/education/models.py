from django.db import models
from django.utils import timezone
from django.utils.text import slugify


class Article(models.Model):
    CATEGORY_CHOICES = [
        ("recycling", "Recycling"),
        ("waste_reduction", "Waste Reduction"),
        ("climate", "Climate"),
        ("policy", "Policy"),
        ("community", "Community"),
    ]

    slug = models.SlugField(max_length=120, unique=True)
    title_en = models.CharField(max_length=300)
    title_rw = models.CharField(max_length=300, blank=True)
    body_en = models.TextField()
    body_rw = models.TextField(blank=True)
    cover_image = models.ImageField(upload_to="education/covers/", null=True, blank=True)
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES, default="recycling")
    reading_time_minutes = models.PositiveSmallIntegerField(default=3)
    is_published = models.BooleanField(default=False)
    published_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-published_at", "-created_at"]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title_en)[:120]
        if self.is_published and not self.published_at:
            self.published_at = timezone.now()
        # Recalculate reading time from English body (200 words/min average)
        word_count = len(self.body_en.split()) if self.body_en else 0
        self.reading_time_minutes = max(1, round(word_count / 200))
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title_en
