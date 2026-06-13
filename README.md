# pTrack — Plastic Waste Tracking & Incentive Platform

pTrack is a pilot web-based digital incentive platform for plastic waste management in Kigali, Rwanda. Citizens earn points by reporting plastic waste hotspots and logging recycling activities. Points accumulate on a leaderboard, and badges are awarded as milestones are reached. Administrators can verify reports and monitor city-wide activity through a dedicated dashboard.

Built as a BSc Software Engineering capstone project at African Leadership University (ALU).

---

## [Demo Video](https://drive.google.com/drive/folders/1xowblkNqjmfCLAZRyZ0o7CyDnBSP8t4C?usp=drive_link)

## [GitHub Repo](https://github.com/Darlington6/ptrack-platform.git)

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v3, React Router v6, Axios, Lucide React |
| Backend | Django 5, Django REST Framework, Simple JWT, django-cors-headers |
| Database | SQLite (local dev) / PostgreSQL (production) |
| Auth | JWT (access + refresh tokens) |
| Language | TypeScript (frontend), Python 3.13 (backend) |

---

## Folder Structure

```
ptrack-platform/
├── README.md
├── .gitignore
├── frontend/                   React + Vite app
│   ├── src/
│   │   ├── api/client.ts       Axios instance with JWT interceptor
│   │   ├── context/            AuthContext (login, register, logout)
│   │   ├── components/         Navbar, BottomNav, Sidebar, ProtectedRoute, ui/
│   │   ├── pages/              All screens (citizen + admin)
│   │   └── types/              Shared domain types
│   └── ...
└── backend/                    Django project
    ├── accounts/               Custom User model + auth endpoints
    ├── reports/                WasteReport, Reward, RecyclingActivity models + API
    └── ptrack/                 Django settings, URLs
```

---

## Prerequisites

- **Python 3.11+** (tested on 3.13)
- **Node.js 18+** and **npm**
- **Git**

No PostgreSQL setup is required for local development — SQLite is the default.

---

## Setup Instructions

### 1. Clone

```bash
git clone https://github.com/Darlington6/ptrack-platform.git
cd ptrack-platform
```

### 2. Backend

```bash
cd backend

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy env file
cp .env.example .env

# Run migrations
python manage.py migrate

# Seed demo data (creates admin + 8 citizens + reports)
python manage.py seed_demo

# Start the development server
python manage.py runserver
```

Backend runs at **http://localhost:8000**

### 3. Frontend

```bash
cd frontend

# Install dependencies
npm install
npm install --save-dev typescript @types/react @types/react-dom @types/node

# Start the dev server
npm run dev
```

Frontend runs at **http://localhost:5173**

> The Vite dev server proxies `/api` → `http://localhost:8000`, so no CORS config is needed during development.

> The frontend was migrated from JavaScript to TypeScript. Entry points now use `src/main.tsx`, `src/App.tsx`, and `vite.config.ts`.

---

## Default Login Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@ptrack.rw | admin1234 |
| Citizen | amahoro.uwimana@example.rw | citizen1234 |

---

## API Endpoints Summary

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register/` | Public | Register new user |
| POST | `/api/auth/login/` | Public | Login, returns JWT |
| POST | `/api/auth/refresh/` | Public | Refresh access token |
| GET | `/api/auth/me/` | JWT | Current user profile |
| GET | `/api/reports/` | JWT | List reports (filters: `?status=&user=me`) |
| POST | `/api/reports/` | JWT | Submit report (+10 pts) |
| GET | `/api/reports/<id>/` | JWT | Single report |
| PATCH | `/api/reports/<id>/verify/` | Admin | Verify report (+5 pts to citizen) |
| GET | `/api/recycling/` | JWT | Current user's recycling activities |
| POST | `/api/recycling/` | JWT | Log recycling activity (+15 pts) |
| GET | `/api/leaderboard/` | JWT | Top 20 users by points |
| GET | `/api/rewards/me/` | JWT | Current user's rewards + total points |

---

## Switching to PostgreSQL

1. Install PostgreSQL and create a database.
2. Open `backend/.env` and replace the `DATABASE_URL` line:

```env
# SQLite (default — remove this line)
DATABASE_URL=sqlite:///db.sqlite3

# PostgreSQL (uncomment and fill in your credentials)
DATABASE_URL=postgres://USER:PASSWORD@HOST:PORT/DBNAME
```

3. Install the psycopg2 driver: `pip install psycopg2-binary`
4. Run `python manage.py migrate` again.

---

## Deployment Plan

### Backend — Railway

1. Push code to GitHub.
2. Create a new **Railway** project → "Deploy from GitHub".
3. Add a **PostgreSQL** plugin — Railway auto-sets `DATABASE_URL`.
4. Set environment variables on Railway:
   - `SECRET_KEY` — generate with `python -c "import secrets; print(secrets.token_urlsafe(50))"`
   - `DEBUG=False`
   - `ALLOWED_HOSTS=your-app.up.railway.app`
   - `CORS_ALLOWED_ORIGINS=https://your-frontend.vercel.app`
5. Add build command: `pip install -r requirements.txt && python manage.py migrate && python manage.py collectstatic --noinput`
6. Start command: `gunicorn ptrack.wsgi --workers 2`

> Add `gunicorn` and `whitenoise` to `requirements.txt` for production.

### Frontend — Vercel / Render

**Vercel (recommended):**
1. Import the GitHub repo → set root directory to `frontend`.
2. Build command: `npm run build` | Output directory: `dist`
3. Set environment variable: `VITE_API_BASE_URL=https://your-backend.up.railway.app`
4. Update `vite.config.js` proxy or use the env variable in `src/api/client.js` for production.

**Render (alternative):**
1. Create a "Static Site" → root: `frontend`, build: `npm run build`, publish: `dist`.

### Domain

- Initial: free subdomains from Railway (`*.up.railway.app`) and Vercel (`*.vercel.app`).
- Production: custom domain (e.g. `ptrack.rw`) — configure via DNS CNAME to Vercel/Railway.

### Monitoring

- Railway built-in logs (real-time via dashboard or `railway logs`).
- Add Sentry for error tracking in a later sprint.

### CI/CD

See [Development Workflow](#development-workflow) below for details.

---

## Development Workflow

### Branch Naming

```
feat/   — new features
fix/    — bug fixes
chore/  — maintenance / deps
docs/   — documentation only
ci/     — CI/CD changes
```

### Commit Convention

pTrack uses [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(reports): add image upload to waste report form
fix(auth): redirect admin to /admin on login
chore(deps): upgrade axios to 1.7.x
```

### Pre-commit Hooks (optional but recommended)

```bash
pip install pre-commit
pre-commit install
```

The hooks run Prettier, ESLint, tsc, Black, Ruff, and mypy on staged files.

---

## Code Quality

### Frontend

```bash
cd frontend
npm run typecheck      # tsc --noEmit
npm run lint           # ESLint
npm run lint:fix       # ESLint with auto-fix
npm run format         # Prettier (write)
npm run format:check   # Prettier (check only)
npm run build          # Production build
```

**Tools:**
- **ESLint** — typescript-eslint, react, react-hooks, jsx-a11y, import plugins
- **Prettier** — single quotes, 2-space indent, trailing commas es5, 100-char line
- **TypeScript** — strict mode (`strict`, `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`, `exactOptionalPropertyTypes`)

### Backend

```bash
cd backend
source venv/bin/activate

ruff check .           # lint (replaces flake8 + isort)
ruff check . --fix     # auto-fix
black .                # format
black --check .        # format check only
mypy . --exclude venv  # type checking
pytest                 # run tests with coverage
```

**Tools:**
- **Ruff** — linting + import sorting (replaces flake8 + isort)
- **Black** — opinionated formatter, line-length 100
- **mypy** — static type checking with django-stubs and djangorestframework-stubs

All tool configuration lives in [`backend/pyproject.toml`](backend/pyproject.toml).

---

## CI/CD

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| [`ci.yml`](.github/workflows/ci.yml) | Push / PR to `main`, `develop` | Typecheck, lint, format-check, build, tests, secrets scan |
| [`codeql.yml`](.github/workflows/codeql.yml) | Weekly + PR to `main` | GitHub CodeQL security analysis |
| [`deploy.yml`](.github/workflows/deploy.yml) | Push to `main` | Deploy backend (Railway) + frontend (Vercel) |
| [`lighthouse.yml`](.github/workflows/lighthouse.yml) | PR to `main` | Lighthouse perf / a11y audit on Vercel preview |

### Required Secrets

Set these in **GitHub → Settings → Secrets and Variables → Actions**:

| Secret | Used by |
|--------|---------|
| `RAILWAY_TOKEN` | `deploy.yml` — Railway CLI deploy |
| `VERCEL_TOKEN` | `deploy.yml` — Vercel deploy |
| `VERCEL_ORG_ID` | `deploy.yml` — Vercel org |
| `VERCEL_PROJECT_ID` | `deploy.yml` — Vercel project |
| `NOTIFY_WEBHOOK_URL` | `deploy.yml` — Slack/Discord webhook (optional) |

Deploy jobs are skipped gracefully if secrets are not set.

---

## Screenshots

### Design Mockups (Figma)

| Screen | Preview |
|---|---|
| Landing | ![Landing Mockup](docs/screenshots/figma-landing.png) |
| Register/Login| ![Register/Login Mockup](docs/screenshots/figma-signup-login.png)|
| Citizen Dashboard | ![Dashboard Mockup](docs/screenshots/figma-dashboard.png) |
| Map | ![Map Mockup](docs/screenshots/figma-map.png) |
| Report Waste | ![Report 1 Mockup](docs/screenshots/figma-report1.png) |
| Report Waste | ![Report 2 Mockup](docs/screenshots/figma-report2.png) |
| Rewards | ![Rewards 1 Mockup](docs/screenshots/figma-rewards1.png) |
| Rewards | ![Rewards 2 Mockup](docs/screenshots/figma-rewards2.png) |
| Profile | ![Profile 1 Mockup](docs/screenshots/figma-profile1.png) |
| Profile | ![Profile 2 Mockup](docs/screenshots/figma-profile2.png) |
| Admin Dashboard | ![Admin Dashboard 1 Mockup](docs/screenshots/figma-admin1.png) |
| Admin Dashboard | ![Admin Dashboard 2 Mockup](docs/screenshots/figma-admin2.png) |
| Leaderboard | ![Leaderboard Mockup](docs/screenshots/figma-leaderboard.png) |
---

## Licence

MIT © 2026 Desmond Tunyinko
---

## Acknowledgements

- **African Leadership University (ALU)** — institutional support
- **Supervisor: Mr. Neza David Tuyishimire** — guidance and feedback throughout the capstone
- React, Django, Tailwind CSS, and the wider open-source community
