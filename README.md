# pTrack - Plastic Waste Tracking and Incentive Platform

![Python](https://img.shields.io/badge/Python-3.13-3776AB?logo=python&logoColor=white)
![Django](https://img.shields.io/badge/Django-6.0.6-092E20?logo=django&logoColor=white)
![DRF](https://img.shields.io/badge/DRF-3.17.1-red)
![React](https://img.shields.io/badge/React-19.2.6-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0.3-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8.1.1-646CFF?logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.3.1-06B6D4?logo=tailwindcss&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-7-DC382D?logo=redis&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-Workbox_7.4.1-5A0FC8?logo=googlechrome&logoColor=white)
![CI](https://github.com/Darlington6/ptrack-platform/actions/workflows/ci.yml/badge.svg)

pTrack is a pilot digital incentive platform for plastic waste management in Kigali, Rwanda, developed as the capstone project for a BSc Software Engineering degree at African Leadership University (ALU). The platform targets Kimironko Sector, Gasabo District, and uses a gamified points-and-badges system to encourage citizens to report plastic waste hotspots and log recycling activities.

**Research context:** The platform tests the hypothesis that digital incentives, such as points, badges, leaderboards, and streak-based nudges, can produce a measurable behavioural change in plastic waste reporting frequency and recycling uptake in a peri-urban Kigali neighbourhood.

---

## Live Demo

| Service | URL |
|---|---|
| Frontend (Vercel) | https://ptrack-platform.vercel.app |
| Backend API (Render) | https://ptrack-platform.onrender.com/api/v1/ |
| Swagger / OpenAPI docs | https://ptrack-platform.onrender.com/api/v1/docs/ |
| ReDoc | https://ptrack-platform.onrender.com/api/v1/redoc/ |

**Default credentials (seeded):**

| Role | Email | Password |
|---|---|---|
| Admin | admin@ptrack.rw | admin1234 |
| Citizen | amahoro.uwimana@example.rw | citizen1234 |

> The backend runs on a free Render instance. The first request after inactivity may take up to 50 seconds to warm up.

---

## Demo Video

[Watch the 5-minute demo on Google Drive](https://drive.google.com/drive/folders/1xowblkNqjmfCLAZRyZ0o7CyDnBSP8t4C?usp=drive_link)

---

## Table of Contents

1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [Architecture](#architecture)
4. [Getting Started](#getting-started)
   - [Quick Start with Docker](#quick-start-with-docker)
   - [Manual Setup without Docker](#manual-setup-without-docker)
5. [Environment Variables](#environment-variables)
6. [Running Tests](#running-tests)
7. [Code Quality](#code-quality)
8. [API Reference](#api-reference)
9. [PWA Installation](#pwa-installation)
10. [Deployment](#deployment)
11. [CI/CD Pipeline](#cicd-pipeline)
12. [Project Structure](#project-structure)
13. [Licence](#licence)

---

## Features

### Citizen-Facing

**Waste Reporting**
- Submit geotagged plastic waste reports with photo upload and GPS coordinates
- Select waste type (plastic bottles, plastic bags, mixed plastic, other)
- Add a description; the map pins the exact location using Google Maps
- Earn 5 points per report submitted; earn an additional 10 points when an admin verifies the report. All these are subject to the admin's configuration of the point values
- Reports queue in IndexedDB when the device is offline and sync automatically on reconnect

**Recycling Activity Logging**
- Log drop-off, pickup, exchange, and other recycling activities
- Earn 5 points per logged activity, dependent on admin's configuration of the point values

**Gamification**
- Cumulative points visible on the profile and dashboard
- Badge system: milestones unlock badges (Sprout/First Steps, Eco Warrior, Recycling Hero, and more)
- Activity streaks tracked daily; streak warnings sent by notification and email when a streak is at risk
- Weekly goal configurable per user under Account in the user profile's settings (default: 5 activities per week)
- Progress ring on the dashboard shows weekly goal completion

**Leaderboard**
- Top citizens ranked by total points
- Each user controls their visibility via a privacy toggle (show\_on\_leaderboard)

**Notifications**
- In-app notification inbox with read/unread state, category badges, etc.
- Push notification support (Web Push / VAPID) — opt-in per device
- Email notifications via Resend (badge earned, streak warnings, weekly digest, community updates)
- Notification preference controls per category in the settings page

**Maps and Recycling Centres**
- Interactive Google Maps view of all submitted waste reports colour-coded by status
- Marker clustering for dense areas
- Recycling centre finder: lists drop-off points in Kigali with distance sorting and a Leaflet map

**Education Hub**
- Admin-authored articles about plastic waste, recycling, and climate impact
- Markdown-rendered content, category filtering, read-time estimates

**Community Impact**
- Public-facing aggregate stats: total reports, total recycling activities, estimated plastic diverted
- Engagement trends chart (weekly/monthly, using Recharts)

**Profile and Settings**
- Profile picture upload (Cloudinary), bio, date of birth, sector, phone number
- Email verification flow (send code -> confirm code)
- Password change with current-password confirmation
- Google OAuth link/unlink
- Language preference (English / Kinyarwanda) via i18next
- Theme preference (light / dark / system) persisted to backend and applied on load
- Personal data export (CSV, GDPR-compliant)
- Account soft-delete

**Onboarding**
- Multi-step onboarding wizard for first-time users; marks `has_completed_onboarding` on completion

**Nudges**
- Personalised behavioural nudges served via the backend nudges app
- NudgeBanner displayed in-app at contextually relevant moments

---

### Admin Dashboard

**Overview**
- KPI cards: total reports, verified reports, total recycling activities, total citizens, active streaks, total points awarded
- Quick-action shortcuts to the most common workflows

**Analytics**
- Reports over time (line chart, filterable by date range)
- Reports by sector (bar chart)
- Reports by waste type (pie chart)
- Top users by points (table)
- Geographic heatmap (Google Maps heat layer)
- Engagement funnel: registered -> onboarded -> first report -> recurring reporter

**Report Management**
- Filterable, sortable table of all reports (status, waste type, sector, date, user)
- Single-report verify / reject / resolve with rejection reason
- Bulk verify and bulk reject
- CSV export of full report dataset

**User Management**
- Paginated user list with search by email
- Per-user detail: profile, points, streak, role, verification status
- CSV export

**Reward Configuration**
- Edit point values per event (report\_submitted, recycling\_logged, verification\_bonus)
- Create, edit, and deactivate badge definitions including point thresholds

**Education Content Management**
- Create, edit, and delete education articles from the admin panel using a Markdown editor

**Recycling Centre Management**
- Add and remove recycling drop-off centre listings

**Audit Log**
- Immutable admin action trail: who did what, on which object, from which IP
- Filterable, exportable to CSV

**System Health**
- Live health check: API, database, and Redis cache status
- Backend version displayed

---

### Security and Infrastructure

- JWT authentication with access and refresh tokens, token blacklist on logout
- Argon2 password hashing
- Brute-force login protection via django-axes (5 failures -> 15-minute IP lockout)
- DRF throttling for public endpoints
- HTTP security headers: HSTS, CSP, X-Frame-Options DENY, Referrer-Policy, CSRF
- CORS restricted to configured frontend origin
- Redis-backed caching (django-redis)
- Structured JSON logging in production (python-json-logger)
- Sentry error and performance monitoring (frontend + backend)
- Cloudinary media storage in production (avatars and report photos)
- Soft deletes across all user-generated content (reports, rewards, activities, users)
- Audit middleware records all state-changing requests

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Frontend language | TypeScript | 6.0.3 |
| Frontend framework | React | 19.2.6 |
| Build tool | Vite | 8.1.1 |
| CSS framework | TailwindCSS | 4.3.1 |
| Routing | React Router | 7.18.1 |
| Server state | TanStack React Query | 5.101.2 |
| Client state | Zustand | 5.0.14 |
| HTTP client | Axios | 1.18.1 |
| Forms | React Hook Form + Zod | 7.80.0 + 4.4.3 |
| Charts | Recharts | 3.9.1 |
| Maps (interactive) | @vis.gl/react-google-maps | 1.8.3 |
| Maps (centres) | React Leaflet | 5.0.0 |
| PWA | vite-plugin-pwa + Workbox | 1.3.0 + 7.4.1 |
| Offline storage | idb (IndexedDB) | 8.0.3 |
| Icons | Lucide React | 1.22.0 |
| i18n | i18next + react-i18next | 26.3.4 + 17.0.8 |
| Error tracking (FE) | @sentry/react | 10.62.0 |
| Backend language | Python | 3.13 |
| Backend framework | Django | 6.0.6 |
| REST API | Django REST Framework | 3.17.1 |
| Auth tokens | SimpleJWT | 5.5.1 |
| API schema | drf-spectacular | 0.29.0 |
| CORS | django-cors-headers | 4.9.0 |
| Static files | Whitenoise | 6.12.0 |
| WSGI server | Gunicorn | 26.0.0 |
| Cache / sessions | django-redis | 7.0.0 |
| Rate limiting | django-axes + DRF throttles | 8.3.1 |
| Media storage | Cloudinary | 1.44.2 |
| Email | django-anymail (Resend) | 15.0 |
| Web push | pywebpush | 2.3.0 |
| OAuth | google-auth | 2.55.1 |
| Password hashing | argon2-cffi | 25.1.0 |
| Logging | python-json-logger | 4.1.0 |
| Error tracking (BE) | sentry-sdk | 2.63.0 |
| Config validation | pydantic-settings | 2.14.2 |
| Database | PostgreSQL | 16 |
| Hosting (frontend) | Vercel | — |
| Hosting (backend) | Render | — |
| Database hosting | Neon | — |

---

## Architecture

```
Browser / Mobile
      |
      | HTTPS
      v
 Vercel CDN  ──── React SPA (Vite build)
      |
      | /api/v1/* (Axios, JWT bearer)
      v
 Render Web Service
      |
 Gunicorn (2 workers)
      |
 Django 6 + DRF
   ├── accounts   (users, auth, OAuth, email verification)
   ├── reports    (waste reports, recycling, leaderboard, badges, rewards)
   ├── core       (audit log, notifications, admin analytics)
   ├── recycling_centres
   ├── nudges     (behavioural nudges)
   ├── education  (articles)
   └── push       (Web Push / VAPID)
      |         \
      |          \── Redis (caching, axes lockout store)
      v
 Neon PostgreSQL (managed, serverless)

Render Cron Jobs (3)
   ├── send_community_updates  (Tue + Fri 17:00 CAT)
   ├── send_weekly_digest      (Sunday 18:00 CAT)
   └── send_streak_warnings    (daily 19:00 CAT)
```

The frontend is a Progressive Web App. On first install, Workbox precaches the shell and static assets. Report submissions are intercepted by a background sync strategy — if the user is offline, the payload is stored in IndexedDB and replayed when connectivity is restored.

---

## Getting Started

### Prerequisites

- **Docker Desktop** — recommended for the quickest path (no Python or Node required locally)
- Or: **Python 3.13**, **Node.js 20**, and **npm** for a manual setup

### Quick Start with Docker

```bash
git clone https://github.com/Darlington6/ptrack-platform.git
cd ptrack-platform

# Copy the backend env file and fill in the minimum required values
cp backend/.env.example backend/.env

# Build and start all services (Postgres, Redis, Django, Vite dev server)
make up

# Run database migrations
make migrate

# Seed demo data: 1 admin + 8 citizens + sample reports
make seed
```

Services available after `make up`:

| Service | URL |
|---|---|
| Frontend (Vite) | http://localhost:5173 |
| Backend (Django) | http://localhost:8000 |
| Swagger UI | http://localhost:8000/api/v1/docs/ |
| Django admin | http://localhost:8000/django-admin/ |

**Make commands:**

```bash
make up          # start all services in the background
make down        # stop all services
make logs        # tail all service logs
make shell-be    # open a Django management shell
make shell-db    # open a psql session inside the Postgres container
make migrate     # run python manage.py migrate
make seed        # run python manage.py seed_demo
make test-be     # run pytest inside the backend container
make test-fe     # run vitest inside the frontend container
make lint        # run ruff, black, and eslint checks
make format      # auto-fix all formatting issues
make rebuild     # rebuild images from scratch (--no-cache)
make clean       # stop + remove volumes, node_modules, venv, __pycache__
```

> **Note on Docker vs. local dev database:** `docker compose up` uses a local Postgres container (`postgres://ptrack:ptrack@postgres:5432/ptrack`). This is a completely separate database from the one used by `npm run dev` / `python manage.py runserver`, which reads `DATABASE_URL` from `backend/.env` — typically pointing to sqlite or Postgres depending one's setup. Data seeded in one environment is not visible in the other.

---

### Manual Setup without Docker

#### 1. Clone

```bash
git clone https://github.com/Darlington6/ptrack-platform.git
cd ptrack-platform
```

#### 2. Backend

```bash
cd backend

# Create and activate a virtual environment
python3 -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate

# Install runtime dependencies
pip install -r requirements.txt

# Install dev/test dependencies (adds pytest, Black, Ruff, mypy, etc.)
pip install -r requirements-dev.txt

# Copy and configure the environment file
cp .env.example .env
# Edit .env — at minimum set DATABASE_URL and SECRET_KEY

# Apply migrations
python manage.py migrate

# (Optional) Seed demo data
python manage.py seed_demo

# Start the development server
python manage.py runserver
```

Backend runs at **http://localhost:8000**

#### 3. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

Frontend runs at **http://localhost:5173**

The Vite dev server proxies `/api` requests to `http://localhost:8000` automatically via the proxy config in `vite.config.ts`. No extra configuration is needed for local development.

---

## Environment Variables

### Backend (`backend/.env`)

Copy `backend/.env.example` and fill in the required values.

| Variable | Required | Description |
|---|---|---|
| `SECRET_KEY` | Yes | Django secret key. Generate with: `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"` |
| `DEBUG` | Yes | `True` for local dev, `False` for production |
| `DATABASE_URL` | Yes | PostgreSQL connection string (`postgres://user:pass@host:port/db`) or `sqlite:///db.sqlite3` for local |
| `ALLOWED_HOSTS` | Yes | Comma-separated list of allowed hostnames |
| `CORS_ALLOWED_ORIGINS` | Yes | Comma-separated list of allowed frontend origins |
| `REDIS_URL` | Yes | Redis connection string (`redis://localhost:6379/0`) |
| `SENTRY_DSN` | No | Sentry DSN for error tracking |
| `RESEND_API_KEY` | No | Resend API key for transactional email |
| `DEFAULT_FROM_EMAIL` | No | From address for transactional email |
| `GOOGLE_OAUTH_CLIENT_ID` | No | Google OAuth 2.0 client ID |
| `GOOGLE_MAPS_API_KEY` | No | Google Maps API key (used by the backend geocoder) |
| `VAPID_PUBLIC_KEY` | No | VAPID public key for Web Push |
| `VAPID_PRIVATE_KEY` | No | VAPID private key for Web Push |
| `VAPID_SUBJECT` | No | VAPID subject (mailto: or URL) |
| `USE_CLOUDINARY` | No | `True` to use Cloudinary for media; `False` uses local filesystem |
| `CLOUDINARY_CLOUD_NAME` | No | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | No | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | No | Cloudinary API secret |
| `APP_VERSION` | No | Version string shown in the health endpoint |

### Frontend (`frontend/.env`)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_BASE_URL` | Yes | Full URL of the backend API root, e.g. `http://localhost:8000/api/v1` |
| `VITE_GOOGLE_CLIENT_ID` | No | Google OAuth client ID for Google Sign-In |
| `VITE_GOOGLE_MAPS_API_KEY` | No | Google Maps JavaScript API key |
| `VITE_GOOGLE_MAPS_MAP_ID` | No | Google Maps Map ID for advanced markers |
| `VITE_SENTRY_DSN` | No | Sentry DSN for frontend error tracking |

---

## Running Tests

pTrack has three test suites: backend unit/integration tests (pytest), frontend unit tests (Vitest), and end-to-end browser tests (Playwright).

### Backend Tests

```bash
cd backend
source venv/bin/activate

# Run all tests with coverage
pytest

# Run with short traceback (less verbose output)
pytest --tb=short

# Run a specific test file
pytest tests/accounts/test_auth.py

# Run a specific test function
pytest tests/accounts/test_auth.py::test_register_creates_user
```

- 40+ tests across auth, models, services, admin, notifications, and reports
- Minimum coverage gate: 65% (enforced in CI)
- Coverage report generated at `backend/coverage.xml` and printed to stdout
- Uses a real PostgreSQL instance in CI (postgres:16 service container)

### Frontend Unit Tests (Vitest)

```bash
cd frontend

# Run all unit tests once
npm test

# Run with coverage report
npm test -- --run --coverage

# Watch mode (re-runs on file change)
npx vitest
```

- 31 tests covering auth flows, API client, component behaviour, and hooks
- jsdom environment via Vitest
- MSW (Mock Service Worker) used for API mocking
- Minimum thresholds: 60% lines, 60% functions, 50% branches

### End-to-End Tests (Playwright)

```bash
cd frontend

# Run all E2E tests headlessly (fastest, same as CI)
npx playwright test

# Run in interactive UI mode (step-through debugging, time-travel)
npx playwright test --ui

# Open the HTML report from the last run
npx playwright show-report

# Run a specific spec file
npx playwright test e2e/02-submit-report.spec.ts

# Run against a specific URL
PLAYWRIGHT_BASE_URL=https://ptrack-platform.vercel.app npx playwright test
```

**E2E test coverage (8 tests across 5 spec files):**

| Spec file | Scenario |
|---|---|
| `01-landing-to-login.spec.ts` | Landing page renders, navigation to login |
| `02-submit-report.spec.ts` | User registers, submits a waste report |
| `03-theme-language-persist.spec.ts` | Theme and language toggle persist on reload |
| `04-admin-verify-report.spec.ts` | Admin logs in, verifies a pending report |
| `05-offline-report-queue.spec.ts` | Report queued in IndexedDB when offline |

Playwright is configured to block Service Workers during tests to prevent Workbox from racing with CDP-level route mocks. Screenshots are captured on failure; traces are collected on first retry.

### Test Summary

| Suite | Runner | Tests | CI gate |
|---|---|---|---|
| Backend | pytest | 40+ | 65% coverage |
| Frontend unit | Vitest | 31 | 60% line coverage |
| E2E | Playwright | 8 | all pass |

---

## Code Quality

### Frontend

```bash
cd frontend

npm run typecheck      # TypeScript strict-mode check (tsc --noEmit)
npm run lint           # ESLint (typescript-eslint, react-hooks, jsx-a11y, import)
npm run lint:fix       # ESLint with auto-fix
npm run format         # Prettier (write)
npm run format:check   # Prettier (check only — used in CI)
npm run build          # Production build (tsc -b + vite build)
```

TypeScript is configured in strict mode with `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`, and `exactOptionalPropertyTypes`.

### Backend

```bash
cd backend
source venv/bin/activate

ruff check .           # lint (replaces flake8 + isort)
ruff check . --fix     # auto-fix lint issues and sort imports
black .                # format
black --check .        # format check only (used in CI)
mypy . --exclude venv  # static type checking
```

All tool configuration lives in `backend/pyproject.toml`. Line length is 100 for both Black and Ruff.

---

## API Reference

All endpoints are documented interactively at `/api/v1/docs/` (Swagger UI) and `/api/v1/redoc/` (ReDoc).

### Authentication (`/api/v1/auth/`)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `register/` | Public | Register; returns access + refresh tokens |
| POST | `login/` | Public | Login; returns access + refresh tokens |
| POST | `refresh/` | Public | Exchange refresh token for a new access token |
| GET/PATCH | `me/` | JWT | Get or update the authenticated user's profile |
| PATCH | `me/password/` | JWT | Change password |
| PUT | `me/avatar/` | JWT | Upload or remove profile picture |
| GET | `me/impact/` | JWT | Personal impact summary (points, reports, recycling) |
| GET | `me/export/` | JWT | Download personal data as CSV |
| DELETE | `me/delete/` | JWT | Soft-delete own account |
| POST | `verify/send/` | JWT | Send email verification code |
| POST | `verify/confirm/` | JWT | Confirm email verification code |
| POST | `password/reset/request/` | Public | Request password reset email |
| POST | `password/reset/confirm/` | Public | Confirm password reset with token + new password |
| POST | `google/` | Public | Google OAuth sign-in or register |
| POST | `google/link/` | JWT | Link Google account to existing account |
| POST | `google/unlink/` | JWT | Unlink Google account |

### Reports and Recycling (`/api/v1/`)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET/POST | `reports/` | JWT | List own reports or submit a new report |
| GET | `reports/<id>/` | JWT | Get a single report |
| PATCH | `reports/<id>/verify/` | Admin | Verify a report (+x pts to submitter) |
| PATCH | `reports/<id>/reject/` | Admin | Reject a report with a reason |
| PATCH | `reports/<id>/resolve/` | Admin | Mark a report as resolved |
| GET/POST | `recycling/` | JWT | List own recycling activities or log a new one |
| GET | `leaderboard/` | JWT | Paginated leaderboard, ranked by points |
| GET | `rewards/me/` | JWT | Own reward history and total points |
| GET | `community/stats/` | JWT | Aggregate community statistics |
| GET | `community/stats/public/` | Public | Public community stats (no auth required) |
| GET | `community/trends/` | JWT | Weekly/monthly trend data for charts |
| GET | `badges/` | Public | List all badge definitions |
| GET | `point-configs/` | Admin | List configured point values per event |

### Admin (`/api/v1/admin/`)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `analytics/reports-over-time/` | Admin | Report volume over time |
| GET | `analytics/by-sector/` | Admin | Reports grouped by sector |
| GET | `analytics/by-type/` | Admin | Reports grouped by waste type |
| GET | `analytics/top-users/` | Admin | Top users by points |
| GET | `analytics/heatmap/` | Admin | Report coordinates for heatmap |
| GET | `analytics/kpis/` | Admin | Platform KPI snapshot |
| GET | `analytics/funnel/` | Admin | Engagement funnel data |
| GET | `audit-logs/` | Admin | Paginated audit log |
| GET | `audit-logs/export.csv` | Admin | Export full audit log as CSV |
| GET | `audit-logs/<id>/` | Admin | Single audit log entry |
| POST | `reports/bulk-verify/` | Admin | Bulk verify a list of report IDs |
| POST | `reports/bulk-reject/` | Admin | Bulk reject a list of report IDs |
| GET | `reports/export.csv` | Admin | Export all reports as CSV |
| GET/POST | `configurations/points/` | Admin | List or create point configurations |
| GET/PUT/DELETE | `configurations/points/<id>/` | Admin | Update or delete a point configuration |
| GET/POST | `configurations/badges/` | Admin | List or create badge definitions |
| GET/PUT/DELETE | `configurations/badges/<id>/` | Admin | Update or delete a badge definition |
| GET | `users/` | Admin | Paginated user list with search |
| GET | `users/export.csv` | Admin | Export all users as CSV |
| GET/PATCH | `users/<id>/` | Admin | View or update a user |

### Other Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/health/` | Public | API, database, and Redis health check |
| GET | `/api/v1/notifications/` | JWT | Notification inbox |
| POST | `/api/v1/notifications/read-all/` | JWT | Mark all notifications read |
| PATCH | `/api/v1/notifications/<id>/read/` | JWT | Mark single notification read |
| DELETE | `/api/v1/notifications/<id>/` | JWT | Delete a notification |
| GET | `/api/v1/recycling-centres/` | JWT | List recycling drop-off centres |
| GET | `/api/v1/education/` | Public | List education articles |
| GET | `/api/v1/education/<slug>/` | Public | Single article |
| POST | `/api/v1/push/subscribe/` | JWT | Register a browser push subscription |

---

## PWA Installation

pTrack is a full Progressive Web App. It can be installed on Android, iOS, and desktop browsers and works entirely offline for core reporting workflows.

### Install on Android (Chrome)

1. Open the pTrack URL in Chrome for Android.
2. Tap the three-dot menu in the top-right corner.
3. Select **Add to Home screen** (or **Install app** if the install prompt appears automatically).
4. Confirm by tapping **Add** or **Install**.
5. The pTrack icon appears on your home screen. Tap it to launch in standalone mode (no browser UI).

### Install on iOS (Safari)

1. Open the pTrack URL in Safari on iPhone or iPad.
2. Tap the **Share** button (square with an arrow pointing up) at the bottom or top of the screen.
3. Scroll down and tap **Add to Home Screen**.
4. Edit the name if desired, then tap **Add**.
5. The icon appears on your home screen.

> iOS Safari does not support Web Push notifications. Push notifications are available on Android Chrome and desktop browsers.

### Install on Desktop (Chrome / Edge)

1. Open the pTrack URL in Chrome or Edge.
2. Look for the install icon in the address bar (a monitor with a down arrow), or open the browser menu and select **Install pTrack**.
3. Confirm the installation. The app opens in its own window.

### Offline Capability

- The app shell (HTML, JS, CSS, icons) is precached by Workbox on first install.
- Waste reports submitted while offline are stored in IndexedDB and replayed automatically when connectivity is restored.
- The dashboard, leaderboard, and recent reports are served from cache when offline (stale-while-revalidate strategy).

---

## Deployment

The production deployment uses three managed services — no servers to maintain.

### Frontend: Vercel

1. Import the GitHub repository in the Vercel dashboard.
2. Set the **root directory** to `frontend`.
3. Build command: `npm run build` — Output directory: `dist`
4. Set environment variables:
   - `VITE_API_BASE_URL` — your Render backend URL, e.g. `https://ptrack-platform.onrender.com`
   - `VITE_GOOGLE_CLIENT_ID` — Google OAuth client ID
   - `VITE_GOOGLE_MAPS_API_KEY` — Google Maps JS API key
   - `VITE_GOOGLE_MAPS_MAP_ID` — Google Maps Map ID
5. Vercel deploys automatically on every push to `main`.

### Backend: Render

The repository includes `render.yaml` at the root. Render auto-detects it and configures the following services:

| Service | Type | Schedule |
|---|---|---|
| `ptrack-backend` | Web service (Gunicorn) | Always on |
| `ptrack-community-updates` | Cron job | Tue + Fri 17:00 CAT |
| `ptrack-weekly-digest` | Cron job | Sunday 18:00 CAT |
| `ptrack-streak-warnings` | Cron job | Daily 19:00 CAT |

**Environment variables to set in the Render dashboard (service -> Environment):**

```
SECRET_KEY
DATABASE_URL          (Neon connection string)
REDIS_URL             (Render Redis or Upstash)
ALLOWED_HOSTS         (your-backend.onrender.com,localhost)
CORS_ALLOWED_ORIGINS  (https://your-frontend.vercel.app)
SENTRY_DSN
RESEND_API_KEY
DEFAULT_FROM_EMAIL
GOOGLE_MAPS_API_KEY
GOOGLE_OAUTH_CLIENT_ID
VAPID_PUBLIC_KEY
VAPID_PRIVATE_KEY
VAPID_SUBJECT
USE_CLOUDINARY
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
APP_VERSION
```

The build command in `render.yaml` runs `pip install -r requirements.txt && python manage.py collectstatic --noinput`. The start command runs `python manage.py migrate && gunicorn ptrack.wsgi:application`.

### Database: Neon

1. Create a new Neon project at neon.tech.
2. Copy the connection string from the Neon dashboard (format: `postgresql://user:pass@host/db?sslmode=require`).
3. Set this string as `DATABASE_URL` in the Render environment variables.

Neon provides serverless PostgreSQL with automatic branching. The production database runs on the `main` branch.

---

## Local Production Simulation (Docker)

To test the exact production build locally using Caddy as a reverse proxy:

```bash
# Generate a SECRET_KEY:
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"

# Copy and fill in the production env file
cp .env.prod.example .env.prod

# Build and start (Postgres, Redis, Django/Gunicorn, Caddy)
docker compose -f docker-compose.prod.yml --env-file .env.prod up --build
```

| Service | URL |
|---|---|
| Frontend (Caddy) | http://localhost |
| Django admin | http://localhost/django-admin/ |
| API | http://localhost/api/v1/ |

---

## CI/CD Pipeline

GitHub Actions runs five jobs on every push and pull request to `main` and `develop`.

| Job | What it checks |
|---|---|
| `frontend-quality` | TypeScript typecheck, ESLint, Prettier format check, Vite production build |
| `frontend-test` | Vitest (31 unit tests) with v8 coverage, uploads coverage artifact |
| `backend-quality` | Ruff lint, Black format check, mypy type checking |
| `backend-test` | pytest (40+ tests) against a real PostgreSQL 16 container, uploads coverage.xml |
| `e2e` | Playwright (8 E2E tests) — builds the frontend, starts Django, serves the dist with `npx serve --single`, runs Chromium |
| `secrets-scan` | Gitleaks scan of the full git history |

The E2E job depends on `frontend-quality` and `backend-test` passing first. Coverage artifacts (frontend HTML report, backend XML) are uploaded and retained for 30 days.

CodeQL security analysis runs weekly and on every PR to `main`.

---

## Project Structure

```
ptrack-platform/
├── backend/                     Django project
│   ├── accounts/                Custom User model, auth views, OAuth
│   ├── reports/                 WasteReport, Reward, RecyclingActivity, Badge models + API
│   ├── core/                    AuditLog, Notification, admin analytics, admin user mgmt
│   ├── recycling_centres/       RecyclingCentre model + API
│   ├── nudges/                  Nudge model + API (behavioural nudges)
│   ├── education/               Article model + API (education hub)
│   ├── push/                    Web Push subscription + sending
│   ├── utils/                   Shared utilities (email, pagination)
│   ├── ptrack/                  Django settings, URL root, config validation
│   ├── tests/                   pytest test suite
│   ├── requirements.txt         Runtime dependencies
│   ├── requirements-dev.txt     Dev + test dependencies
│   ├── pyproject.toml           Ruff, Black, mypy, pytest, coverage config
│   ├── Dockerfile               Production image
│   └── runtime.txt              Python 3.13.12
├── frontend/                    React + Vite app
│   ├── src/
│   │   ├── api/                 Axios client with JWT interceptor and refresh logic
│   │   ├── components/          Shared UI: Navbar, BottomNav, Sidebar, Skeletons, ui/
│   │   ├── context/             AuthContext (login, register, logout, refresh)
│   │   ├── hooks/               Custom React hooks
│   │   ├── pages/               Route-level components (citizen + admin)
│   │   │   └── admin/           Admin dashboard pages
│   │   ├── stores/              Zustand state stores
│   │   ├── sw.ts                Workbox service worker (injectManifest strategy)
│   │   └── test/                Vitest setup and unit tests
│   ├── e2e/                     Playwright E2E specs
│   ├── playwright.config.ts     Playwright configuration
│   ├── vite.config.ts           Vite + Vitest + PWA configuration
│   └── Dockerfile.dev           Dev image (with smart npm ci entrypoint)
├── docker-compose.yml           Local dev: Postgres + Redis + Django + Vite
├── docker-compose.prod.yml      Local prod sim: Postgres + Redis + Django + Caddy
├── Caddyfile                    Caddy reverse proxy config for local prod sim
├── Makefile                     Convenience wrappers for Docker Compose commands
├── render.yaml                  Render service + cron job definitions
├── .github/workflows/ci.yml     GitHub Actions CI pipeline
└── .env.prod.example            Template for local prod simulation env file
```

---

## Branch and Commit Conventions

```
feat/    new features
fix/     bug fixes
chore/   maintenance and dependency updates
docs/    documentation only
ci/      CI/CD changes
refactor/ code restructuring without behaviour change
```

pTrack uses [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(reports): add image upload to waste report form
fix(auth): redirect admin to /admin on login
chore(deps): upgrade axios to 1.18.x
ci: add playwright html reporter
```

---

## Licence

MIT © 2026 Desmond Tunyinko

---

## Acknowledgements

- **African Leadership University (ALU)** — institutional support and capstone framework
- **Supervisor: Mr. Neza David Tuyishimire** — guidance and feedback throughout the capstone
- React, Django, TailwindCSS, Vite, and the broader open-source ecosystem