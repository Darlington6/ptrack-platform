from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("reports", "0003_badgedefinition_pointconfiguration"),
    ]

    operations = [
        migrations.AddField(
            model_name="wastereport",
            name="thumbnail",
            field=models.ImageField(blank=True, null=True, upload_to="ptrack/thumbnails/"),
        ),
        migrations.AlterField(
            model_name="wastereport",
            name="image",
            field=models.ImageField(blank=True, null=True, upload_to="ptrack/reports/"),
        ),
    ]
