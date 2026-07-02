import factory
from django.contrib.auth import get_user_model
from factory.django import DjangoModelFactory

User = get_user_model()


class UserFactory(DjangoModelFactory):
    class Meta:
        model = User
        skip_postgeneration_save = True

    email = factory.Sequence(lambda n: f"user{n}@example.com")
    username = factory.Sequence(lambda n: f"user{n}")
    full_name = factory.Faker("name")
    phone_number = ""
    sector = ""
    points = 0
    role = "citizen"
    email_verified = False
    is_active = True
    is_deleted = False
    auth_method = "manual"
    current_streak = 0
    last_activity_date = None

    @factory.post_generation
    def password(obj, create, extracted, **kwargs):
        raw = extracted or "testpass123"
        obj.set_password(raw)
        if create:
            obj.save(update_fields=["password"])


class WasteReportFactory(DjangoModelFactory):
    class Meta:
        model = "reports.WasteReport"

    user = factory.SubFactory(UserFactory)
    latitude = factory.Faker("latitude")
    longitude = factory.Faker("longitude")
    sector = ""
    waste_type = "bottles"
    status = "pending"
    description = factory.Faker("sentence")
    rejection_reason = ""
    is_deleted = False


class RewardFactory(DjangoModelFactory):
    class Meta:
        model = "reports.Reward"

    user = factory.SubFactory(UserFactory)
    points_earned = 10
    reward_type = "report_submitted"


class RecyclingActivityFactory(DjangoModelFactory):
    class Meta:
        model = "reports.RecyclingActivity"

    user = factory.SubFactory(UserFactory)
    activity_type = "drop_off"
    points_awarded = 15


class BadgeDefinitionFactory(DjangoModelFactory):
    class Meta:
        model = "reports.BadgeDefinition"

    name = factory.Sequence(lambda n: f"Badge {n}")
    slug = factory.Sequence(lambda n: f"badge-{n}")
    description = factory.Faker("sentence")
    icon = ""
    required_points = factory.Sequence(lambda n: (n + 1) * 50)
    badge_type = "points"
    is_active = True
