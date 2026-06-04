from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    ROLE_CHOICES = [("citizen", "Citizen"), ("admin", "Admin")]

    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=150, blank=True)
    phone_number = models.CharField(max_length=20, blank=True)
    sector = models.CharField(max_length=100, default="Kimironko")
    points = models.IntegerField(default=0)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default="citizen")
    created_at = models.DateTimeField(auto_now_add=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    def __str__(self):
        return self.email
