import random
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils import timezone

from reports.models import RecyclingActivity, Reward, WasteReport

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

KIGALI_CENTRES = [
    {
        "name": "Kimironko Plastic Collection Hub",
        "address": "KG 11 Ave, Kimironko",
        "sector": "Kimironko",
        "district": "Gasabo",
        "latitude": -1.9358,
        "longitude": 30.1284,
        "accepted_materials": ["PET", "HDPE", "PP"],
        "operating_hours": {
            "Mon": "08:00-17:00",
            "Tue": "08:00-17:00",
            "Wed": "08:00-17:00",
            "Thu": "08:00-17:00",
            "Fri": "08:00-17:00",
            "Sat": "09:00-13:00",
            "Sun": "closed",
        },
        "contact_phone": "+250788123001",
        "contact_email": "kimironko@ptrack.rw",
    },
    {
        "name": "Kacyiru Recycling Drop-Off",
        "address": "KN 4 Rd, Kacyiru",
        "sector": "Kacyiru",
        "district": "Gasabo",
        "latitude": -1.9441,
        "longitude": 30.0619,
        "accepted_materials": ["PET", "HDPE", "cardboard", "glass"],
        "operating_hours": {
            "Mon": "07:30-17:30",
            "Tue": "07:30-17:30",
            "Wed": "07:30-17:30",
            "Thu": "07:30-17:30",
            "Fri": "07:30-17:30",
            "Sat": "08:00-14:00",
            "Sun": "closed",
        },
        "contact_phone": "+250788123002",
        "contact_email": "kacyiru@ptrack.rw",
    },
    {
        "name": "Gisozi Community Recycling Point",
        "address": "KG 200 St, Gisozi",
        "sector": "Gisozi",
        "district": "Gasabo",
        "latitude": -1.9212,
        "longitude": 30.0747,
        "accepted_materials": ["PET", "PP", "LDPE"],
        "operating_hours": {
            "Mon": "08:00-16:00",
            "Tue": "08:00-16:00",
            "Wed": "08:00-16:00",
            "Thu": "08:00-16:00",
            "Fri": "08:00-16:00",
            "Sat": "09:00-12:00",
            "Sun": "closed",
        },
        "contact_phone": "+250788123003",
        "contact_email": "gisozi@ptrack.rw",
    },
    {
        "name": "Nyabugogo Waste Exchange Centre",
        "address": "Nyabugogo Bus Terminal Area",
        "sector": "Nyabugogo",
        "district": "Nyarugenge",
        "latitude": -1.9388,
        "longitude": 30.0499,
        "accepted_materials": ["PET", "HDPE", "mixed plastics", "cardboard"],
        "operating_hours": {
            "Mon": "07:00-18:00",
            "Tue": "07:00-18:00",
            "Wed": "07:00-18:00",
            "Thu": "07:00-18:00",
            "Fri": "07:00-18:00",
            "Sat": "07:00-16:00",
            "Sun": "08:00-13:00",
        },
        "contact_phone": "+250788123004",
        "contact_email": "nyabugogo@ptrack.rw",
    },
    {
        "name": "Remera Plastic Recovery Station",
        "address": "KG 9 Ave, Remera",
        "sector": "Remera",
        "district": "Gasabo",
        "latitude": -1.9547,
        "longitude": 30.1122,
        "accepted_materials": ["PET", "PP", "HDPE", "EPS"],
        "operating_hours": {
            "Mon": "08:00-17:00",
            "Tue": "08:00-17:00",
            "Wed": "08:00-17:00",
            "Thu": "08:00-17:00",
            "Fri": "08:00-17:00",
            "Sat": "09:00-14:00",
            "Sun": "closed",
        },
        "contact_phone": "+250788123005",
        "contact_email": "remera@ptrack.rw",
    },
    {
        "name": "Kiyovu Eco Collection Point",
        "address": "KN 13 Ave, Kiyovu",
        "sector": "Kiyovu",
        "district": "Nyarugenge",
        "latitude": -1.9519,
        "longitude": 30.0601,
        "accepted_materials": ["PET", "glass", "cardboard"],
        "operating_hours": {
            "Mon": "08:00-17:00",
            "Tue": "08:00-17:00",
            "Wed": "08:00-17:00",
            "Thu": "08:00-17:00",
            "Fri": "08:00-17:00",
            "Sat": "closed",
            "Sun": "closed",
        },
        "contact_phone": "+250788123006",
        "contact_email": "kiyovu@ptrack.rw",
    },
    {
        "name": "Nyamirambo Recycling Hub",
        "address": "KN 40 St, Nyamirambo",
        "sector": "Nyamirambo",
        "district": "Nyarugenge",
        "latitude": -1.9803,
        "longitude": 30.0458,
        "accepted_materials": ["PET", "HDPE", "PP", "mixed plastics"],
        "operating_hours": {
            "Mon": "07:30-17:00",
            "Tue": "07:30-17:00",
            "Wed": "07:30-17:00",
            "Thu": "07:30-17:00",
            "Fri": "07:30-17:00",
            "Sat": "08:00-15:00",
            "Sun": "closed",
        },
        "contact_phone": "+250788123007",
        "contact_email": "nyamirambo@ptrack.rw",
    },
    {
        "name": "Gikondo Industrial Recycling Facility",
        "address": "KK 15 Rd, Gikondo",
        "sector": "Gikondo",
        "district": "Kicukiro",
        "latitude": -1.9752,
        "longitude": 30.0842,
        "accepted_materials": ["PET", "HDPE", "PP", "LDPE", "PS", "cardboard", "metal"],
        "operating_hours": {
            "Mon": "06:00-18:00",
            "Tue": "06:00-18:00",
            "Wed": "06:00-18:00",
            "Thu": "06:00-18:00",
            "Fri": "06:00-18:00",
            "Sat": "07:00-16:00",
            "Sun": "closed",
        },
        "contact_phone": "+250788123008",
        "contact_email": "gikondo@ptrack.rw",
    },
    {
        "name": "Kicukiro Centre de Recyclage",
        "address": "KK 3 Ave, Kicukiro",
        "sector": "Kicukiro",
        "district": "Kicukiro",
        "latitude": -2.0025,
        "longitude": 30.0887,
        "accepted_materials": ["PET", "HDPE", "cardboard", "glass"],
        "operating_hours": {
            "Mon": "08:00-17:00",
            "Tue": "08:00-17:00",
            "Wed": "08:00-17:00",
            "Thu": "08:00-17:00",
            "Fri": "08:00-17:00",
            "Sat": "09:00-13:00",
            "Sun": "closed",
        },
        "contact_phone": "+250788123009",
        "contact_email": "kicukiro@ptrack.rw",
    },
    {
        "name": "Kanombe Plastic Drop-Off Point",
        "address": "KK 728 St, Kanombe",
        "sector": "Kanombe",
        "district": "Kicukiro",
        "latitude": -1.9685,
        "longitude": 30.1389,
        "accepted_materials": ["PET", "PP", "HDPE"],
        "operating_hours": {
            "Mon": "08:00-16:00",
            "Tue": "08:00-16:00",
            "Wed": "08:00-16:00",
            "Thu": "08:00-16:00",
            "Fri": "08:00-16:00",
            "Sat": "09:00-12:00",
            "Sun": "closed",
        },
        "contact_phone": "+250788123010",
        "contact_email": "kanombe@ptrack.rw",
    },
]

NUDGE_RULES = [
    {
        "code": "STREAK_WARNING",
        "title_en": "Keep your streak alive!",
        "title_rw": "Komeza inzira yawe!",
        "body_en": "You have an active streak. Don't let it reset — submit a report or log recycling today.",
        "body_rw": "Ufite inzira ikora. Ntuzayihagarike — tanga raporo cyangwa wandike ibikorwa by'imyuzurure uyu munsi.",
        "category": "streak",
        "priority": 1,
        "trigger_condition": {
            "type": "STREAK_WARNING",
            "min_streak": 2,
            "hours_since_activity": 20,
        },
        "cooldown_hours": 20,
    },
    {
        "code": "WEEKLY_GOAL_NEAR",
        "title_en": "Almost there — weekly goal in reach!",
        "title_rw": "Hafi ugere — intego ya buri cyumweru iri hafi!",
        "body_en": "You're close to your weekly report goal. One more submission could push you over!",
        "body_rw": "Uri hafi intego yawe ya raporo za buri cyumweru. Gutuza kimwe gushobora kukurenza!",
        "category": "engagement",
        "priority": 2,
        "trigger_condition": {"type": "WEEKLY_GOAL_NEAR", "threshold_pct": 60},
        "cooldown_hours": 6,
    },
    {
        "code": "WEEKLY_GOAL_MET",
        "title_en": "Weekly goal achieved!",
        "title_rw": "Intego ya buri cyumweru yagerweho!",
        "body_en": "Congratulations! You met your weekly report goal. Keep up the great work for Kigali!",
        "body_rw": "Ikaze! Wageze intego yawe ya raporo za buri cyumweru. Komeza akazi keza ka Kigali!",
        "category": "celebration",
        "priority": 3,
        "trigger_condition": {"type": "WEEKLY_GOAL_MET"},
        "cooldown_hours": 168,  # once per week
    },
    {
        "code": "COMMUNITY_ACTIVE",
        "title_en": "Your sector is buzzing!",
        "title_rw": "Akarere kawe karakorana!",
        "body_en": "There have been over 10 waste reports in your sector this week. Join the effort!",
        "body_rw": "Hariho raporo z'imyanda irenga 10 mu karere kawe iki cyumweru. Injira mu bikorwa!",
        "category": "community",
        "priority": 4,
        "trigger_condition": {"type": "COMMUNITY_ACTIVE", "threshold": 10},
        "cooldown_hours": 48,
    },
    {
        "code": "FIRST_REPORT_REMINDER",
        "title_en": "Submit your first report!",
        "title_rw": "Tanga raporo yawe ya mbere!",
        "body_en": "You joined pTrack but haven't submitted a report yet. Start making a difference today!",
        "body_rw": "Winjiye pTrack ariko nturatange raporo. Tangira gukora itandukaniro uyu munsi!",
        "category": "onboarding",
        "priority": 5,
        "trigger_condition": {"type": "FIRST_REPORT_REMINDER", "hours_after_join": 24},
        "cooldown_hours": 24,
    },
    {
        "code": "BADGE_PROGRESS",
        "title_en": "Badge almost in reach!",
        "title_rw": "Badge iri hafi!",
        "body_en": "You're within 3 reports of unlocking a new badge. Keep going!",
        "body_rw": "Uri hafi raporo 3 zo gufungura badge nshya. Komeza!",
        "category": "achievement",
        "priority": 6,
        "trigger_condition": {"type": "BADGE_PROGRESS", "within": 3},
        "cooldown_hours": 12,
    },
    {
        "code": "RECYCLING_CENTRE_NEARBY",
        "title_en": "Recycling centre near you",
        "title_rw": "Aho gusubiza no hafi yawe",
        "body_en": "There's a plastic drop-off centre in your sector. Visit it to earn bonus points!",
        "body_rw": "Hari aho gusubiza plastiki mu karere kawe. Gusura uzabone amanota yiyongera!",
        "category": "engagement",
        "priority": 7,
        "trigger_condition": {"type": "RECYCLING_CENTRE_NEARBY"},
        "cooldown_hours": 72,
    },
    {
        "code": "WEEKLY_DIGEST",
        "title_en": "Your weekly impact summary",
        "title_rw": "Incamake y'ingaruka yawe ya buri cyumweru",
        "body_en": "See how much plastic you diverted from Kigali's environment this week.",
        "body_rw": "Reba ingano ya plastiki wagabanyije mu bidukikije bya Kigali iki cyumweru.",
        "category": "digest",
        "priority": 8,
        "trigger_condition": {"type": "WEEKLY_DIGEST"},
        "cooldown_hours": 168,
    },
]


class Command(BaseCommand):
    help = "Seed the database with demo data for pTrack."

    def handle(self, *args, **options):
        self.stdout.write("Seeding demo data…")

        # ── Admin user ────────────────────────────────────────────────────────
        admin, created = User.objects.get_or_create(
            email="admin@ptrack.rw",
            defaults={
                "username": "admin",
                "full_name": "pTrack Admin",
                "role": "admin",
                "sector": "Kimironko",
                "points": 0,
                "email_verified": True,
            },
        )
        if created:
            admin.set_password("admin1234")
            admin.save()
            self.stdout.write(self.style.SUCCESS("  ✓ Admin user created"))
        else:
            self.stdout.write("  · Admin user already exists")

        # ── Citizen users ─────────────────────────────────────────────────────
        citizens = []
        for i, (first, last) in enumerate(RWANDAN_NAMES):
            email = f"{first.lower()}.{last.lower()}@example.rw"
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    "username": f"{first.lower()}{i + 1}",
                    "full_name": f"{first} {last}",
                    "role": "citizen",
                    "sector": "Kimironko",
                    "points": random.randint(50, 500),
                    "email_verified": True,
                    "weekly_goal": random.randint(3, 10),
                },
            )
            if created:
                user.set_password("citizen1234")
                user.save()
            citizens.append(user)

        self.stdout.write(self.style.SUCCESS(f"  ✓ {len(citizens)} citizen users ready"))

        # ── Waste reports ─────────────────────────────────────────────────────
        statuses = ["pending", "pending", "pending", "verified", "resolved"]
        report_count = 0
        for _i in range(15):
            user = random.choice(citizens)
            lat = KIMIRONKO_LAT + random.uniform(-0.005, 0.005)
            lng = KIMIRONKO_LNG + random.uniform(-0.005, 0.005)
            report, created = WasteReport.objects.get_or_create(
                user=user,
                latitude=round(lat, 6),
                longitude=round(lng, 6),
                defaults={
                    "waste_type": random.choice(WASTE_TYPES),
                    "description": random.choice(
                        [
                            "Found plastic bottles near the market.",
                            "Bags dumped by the roadside.",
                            "Mixed plastic near drainage channel.",
                            "Abandoned plastic near school gate.",
                            "",
                        ]
                    ),
                    "status": random.choice(statuses),
                },
            )
            if created:
                report_count += 1

        self.stdout.write(self.style.SUCCESS(f"  ✓ {report_count} waste reports created"))

        # ── Recycling activities ───────────────────────────────────────────────
        activity_count = 0
        for _i in range(10):
            user = random.choice(citizens)
            RecyclingActivity.objects.create(
                user=user,
                activity_type=random.choice(ACTIVITY_TYPES),
                points_awarded=15,
            )
            Reward.objects.create(user=user, points_earned=15, reward_type="recycling_logged")
            activity_count += 1

        self.stdout.write(self.style.SUCCESS(f"  ✓ {activity_count} recycling activities created"))

        # ── Rewards for existing reports ───────────────────────────────────────
        for report in WasteReport.objects.all():
            if not Reward.objects.filter(user=report.user, reward_type="report_submitted").exists():
                Reward.objects.create(
                    user=report.user, points_earned=10, reward_type="report_submitted"
                )

        # ── Streaks for citizens ───────────────────────────────────────────────
        from accounts.services import update_streak

        for user in citizens:
            # Simulate activity over the last few days so streaks are populated
            fake_days = random.randint(1, 5)
            user.last_activity_date = timezone.localdate() - timedelta(days=1)
            user.current_streak = fake_days
            user.longest_streak = max(fake_days, random.randint(fake_days, fake_days + 5))
            user.save(update_fields=["last_activity_date", "current_streak", "longest_streak"])
            # Calling update_streak now (activity today) will increment from yesterday
            update_streak(user)

        self.stdout.write(self.style.SUCCESS("  ✓ Streaks populated for citizens"))

        # ── Recycling centres ─────────────────────────────────────────────────
        from recycling_centres.models import RecyclingCentre

        centre_count = 0
        for c in KIGALI_CENTRES:
            _, created = RecyclingCentre.objects.get_or_create(
                name=c["name"],
                defaults=c,
            )
            if created:
                centre_count += 1

        self.stdout.write(self.style.SUCCESS(f"  ✓ {centre_count} recycling centres created"))

        # ── Nudge rules ───────────────────────────────────────────────────────
        from nudges.models import NudgeRule

        rule_count = 0
        for r in NUDGE_RULES:
            _, created = NudgeRule.objects.get_or_create(
                code=r["code"],
                defaults=r,
            )
            if created:
                rule_count += 1

        self.stdout.write(self.style.SUCCESS(f"  ✓ {rule_count} nudge rules created"))

        # ── Sample notifications ───────────────────────────────────────────────
        from core.models import Notification

        notif_count = 0
        sample_notifs = [
            {
                "category": "system",
                "title": "Welcome to pTrack!",
                "body": "Start by reporting plastic waste near you to earn your first points.",
                "action_url": "/report",
            },
            {
                "category": "badge_earned",
                "title": "First Steps badge earned!",
                "body": "You submitted your first waste report. Keep going!",
                "action_url": "/rewards",
            },
            {
                "category": "community",
                "title": "Kimironko is leading this week!",
                "body": "Your sector has the most reports this week. Great work!",
                "action_url": "/leaderboard",
            },
        ]

        # Give the admin and first two citizens sample notifications
        targets = [admin] + citizens[:2]
        for user in targets:
            for notif in sample_notifs:
                obj, created = Notification.objects.get_or_create(
                    recipient=user,
                    title=notif["title"],
                    defaults=notif,
                )
                if created:
                    notif_count += 1

        self.stdout.write(self.style.SUCCESS(f"  ✓ {notif_count} sample notifications created"))

        self.stdout.write(self.style.SUCCESS("\nDemo seed complete!"))
        self.stdout.write("  Admin login  → admin@ptrack.rw / admin1234")
        self.stdout.write(f"  Citizen login → {citizens[0].email} / citizen1234")
