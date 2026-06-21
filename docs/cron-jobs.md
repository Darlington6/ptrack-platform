# Cron Jobs — pTrack Scheduled Tasks

All scheduled tasks are Django management commands run via **Render Cron Jobs** (Dashboard → your service → Cron Jobs).

Timezone: **CAT (Central Africa Time, UTC+2)**. Render cron expressions run in UTC, so subtract 2 hours from CAT times.

---

## Jobs

### 1. `send_streak_warnings`

| Field        | Value                                      |
|--------------|--------------------------------------------|
| **Purpose**  | Notify users whose streak will expire today |
| **Schedule** | Daily at **19:00 CAT** (17:00 UTC)         |
| **Cron**     | `0 17 * * *`                               |
| **Command**  | `python manage.py send_streak_warnings`    |
| **Channels** | In-app, email (if streak_reminders=true), web push (if push_enabled=true) |

### 2. `send_weekly_digest`

| Field        | Value                                      |
|--------------|--------------------------------------------|
| **Purpose**  | Weekly summary of reports, recycling, and points |
| **Schedule** | Every **Sunday at 18:00 CAT** (16:00 UTC) |
| **Cron**     | `0 16 * * 0`                               |
| **Command**  | `python manage.py send_weekly_digest`      |
| **Channels** | In-app, email (if weekly_digest=true), web push (if push_enabled=true) |

### 3. `send_community_updates`

| Field        | Value                                                     |
|--------------|-----------------------------------------------------------|
| **Purpose**  | Sector-level activity update when sector has ≥ 5 reports/week |
| **Schedule** | Every **Tuesday and Friday at 17:00 CAT** (15:00 UTC)    |
| **Cron**     | `0 15 * * 2,5`                                            |
| **Command**  | `python manage.py send_community_updates`                 |
| **Channels** | In-app, web push (if push_enabled=true)                   |

---

## Setting up on Render

1. Go to your Render service dashboard.
2. Navigate to **Cron Jobs** → **New Cron Job**.
3. Set:
   - **Name**: e.g. `streak-warnings`
   - **Schedule**: paste the cron expression above
   - **Command**: e.g. `python manage.py send_streak_warnings`
   - **Environment**: same environment variables as your web service
4. Save and enable.

Render sends an email if a cron job exits non-zero — ensure your Django settings are correct in the environment.

---

## Required Environment Variables

```env
# Web Push (generate with: npx web-push generate-vapid-keys)
VAPID_PUBLIC_KEY=<your-public-key>
VAPID_PRIVATE_KEY=<your-private-key>
VAPID_SUBJECT=mailto:<youremail@example.com>
```

Set these in: Render Dashboard → Service → Environment → Environment Variables.

---

## Testing locally

```bash
# Inside backend/
python manage.py send_streak_warnings
python manage.py send_weekly_digest
python manage.py send_community_updates
```

To test push delivery:
```python
# Django shell
from push.helpers import send_push
from accounts.models import User
user = User.objects.get(email='your@email.com')
send_push(user, 'Test', 'Hello from pTrack!', url='/dashboard')
```