from django.db import migrations


def add_has_completed_onboarding(apps, schema_editor):
    vendor = schema_editor.connection.vendor
    with schema_editor.connection.cursor() as cursor:
        if vendor == "sqlite":
            cursor.execute("PRAGMA table_info(accounts_user)")
            columns = [row[1] for row in cursor.fetchall()]
            if "has_completed_onboarding" not in columns:
                cursor.execute(
                    "ALTER TABLE accounts_user ADD COLUMN has_completed_onboarding BOOL NOT NULL DEFAULT 0"
                )
        else:
            cursor.execute("""
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'accounts_user'
                  AND column_name = 'has_completed_onboarding'
                """)
            if not cursor.fetchone():
                cursor.execute(
                    "ALTER TABLE accounts_user ADD COLUMN has_completed_onboarding BOOLEAN NOT NULL DEFAULT FALSE"
                )


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0003_merge_20260616_0025"),
    ]

    operations = [
        migrations.RunPython(
            add_has_completed_onboarding,
            reverse_code=migrations.RunPython.noop,
        ),
    ]
