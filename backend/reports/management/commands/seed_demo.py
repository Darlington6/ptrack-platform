import random
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from reports.models import WasteReport, Reward, RecyclingActivity

User = get_user_model()

RWANDAN_NAMES = [
    ("Amahoro", "Uwimana"),
    ("Irakoze", "Habimana"),
    ("Gasimba", "Niyonzima"),
    ("Mutesi", "Ingabire"),
    ("Rukundo", "Nsabimana"),
    ("Kaneza", "Mukamana"),
    ("Bizimana", "Nkurunziza"),
    ("Uwase", "Kayitesi"),
]

WASTE_TYPES = ["bottles", "bags", "mixed", "other"]
ACTIVITY_TYPES = ["drop_off", "pickup", "exchange", "other"]
KIMIRONKO_LAT = -1.9358
KIMIRONKO_LNG = 30.1284


class Command(BaseCommand):
    help = "Seed the database with demo data for pTrack."

    def handle(self, *args, **options):
        self.stdout.write("Seeding demo data…")

        # Admin user
        admin, created = User.objects.get_or_create(
            email="admin@ptrack.rw",
            defaults={
                "username": "admin",
                "full_name": "pTrack Admin",
                "role": "admin",
                "sector": "Kimironko",
                "points": 0,
            },
        )
        if created:
            admin.set_password("admin1234")
            admin.save()
            self.stdout.write(self.style.SUCCESS("  ✓ Admin user created"))
        else:
            self.stdout.write("  · Admin user already exists")

        # Citizen users
        citizens = []
        for i, (first, last) in enumerate(RWANDAN_NAMES):
            email = f"{first.lower()}.{last.lower()}@example.rw"
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    "username": f"{first.lower()}{i+1}",
                    "full_name": f"{first} {last}",
                    "role": "citizen",
                    "sector": "Kimironko",
                    "points": random.randint(50, 500),
                },
            )
            if created:
                user.set_password("citizen1234")
                user.save()
            citizens.append(user)

        self.stdout.write(self.style.SUCCESS(f"  ✓ {len(citizens)} citizen users ready"))

        # Waste reports
        statuses = ["pending", "pending", "pending", "verified", "resolved"]
        report_count = 0
        for i in range(15):
            user = random.choice(citizens)
            lat = KIMIRONKO_LAT + random.uniform(-0.005, 0.005)
            lng = KIMIRONKO_LNG + random.uniform(-0.005, 0.005)
            report, created = WasteReport.objects.get_or_create(
                user=user,
                latitude=round(lat, 6),
                longitude=round(lng, 6),
                defaults={
                    "waste_type": random.choice(WASTE_TYPES),
                    "description": random.choice([
                        "Found plastic bottles near the market.",
                        "Bags dumped by the roadside.",
                        "Mixed plastic near drainage channel.",
                        "Abandoned plastic near school gate.",
                        "",
                    ]),
                    "status": random.choice(statuses),
                },
            )
            if created:
                report_count += 1

        self.stdout.write(self.style.SUCCESS(f"  ✓ {report_count} waste reports created"))

        # Recycling activities
        activity_count = 0
        for i in range(10):
            user = random.choice(citizens)
            activity = RecyclingActivity.objects.create(
                user=user,
                activity_type=random.choice(ACTIVITY_TYPES),
                points_awarded=15,
            )
            Reward.objects.create(
                user=user,
                points_earned=15,
                reward_type="recycling_logged",
            )
            activity_count += 1

        self.stdout.write(self.style.SUCCESS(f"  ✓ {activity_count} recycling activities created"))

        # Create rewards for existing reports that don't have them
        for report in WasteReport.objects.all():
            if not Reward.objects.filter(user=report.user, reward_type="report_submitted").exists():
                Reward.objects.create(
                    user=report.user,
                    points_earned=10,
                    reward_type="report_submitted",
                )

        self.stdout.write(self.style.SUCCESS("\nDemo seed complete!"))
        self.stdout.write("  Admin login  → admin@ptrack.rw / admin1234")
        self.stdout.write(f"  Citizen login → {citizens[0].email} / citizen1234")
