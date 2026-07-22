from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0002_add_verification_rejection_notification_categories"),
    ]

    operations = [
        migrations.AddField(
            model_name="notification",
            name="title_rw",
            field=models.CharField(blank=True, default="", max_length=200),
        ),
        migrations.AddField(
            model_name="notification",
            name="body_rw",
            field=models.TextField(blank=True, default=""),
        ),
    ]
