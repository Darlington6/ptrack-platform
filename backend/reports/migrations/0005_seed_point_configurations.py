from django.db import migrations

DEFAULTS = [
    ("report_submitted", 10, "Points awarded when a citizen submits a waste report"),
    ("recycling_logged", 15, "Points awarded when a citizen logs a recycling activity"),
    ("verification_bonus", 5, "Bonus points awarded when a report is verified by an admin"),
]


def seed_point_configs(apps, schema_editor):
    PointConfiguration = apps.get_model("reports", "PointConfiguration")
    for event, points, description in DEFAULTS:
        PointConfiguration.objects.get_or_create(
            event=event,
            defaults={"points": points, "description": description},
        )


def unseed_point_configs(apps, schema_editor):
    PointConfiguration = apps.get_model("reports", "PointConfiguration")
    PointConfiguration.objects.filter(event__in=[e for e, _, _ in DEFAULTS]).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("reports", "0004_wastereport_thumbnail"),
    ]

    operations = [
        migrations.RunPython(seed_point_configs, reverse_code=unseed_point_configs),
    ]
