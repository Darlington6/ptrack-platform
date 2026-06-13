# Changelog

All notable changes to pTrack will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- CI/CD pipeline with GitHub Actions (ci, codeql, deploy, lighthouse workflows)
- ESLint + typescript-eslint + eslint-plugin-react + jsx-a11y + import plugin
- Prettier formatting config (single quotes, 100-char lines, trailing commas es5)
- Strict TypeScript config (`strict`, `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`, `exactOptionalPropertyTypes`)
- Backend linting with Ruff (replaces flake8 + isort)
- Black formatting for backend (line-length 100)
- mypy type checking with django-stubs and djangorestframework-stubs
- `backend/pyproject.toml` with all tool configurations
- `.pre-commit-config.yaml` for local pre-commit hooks
- `.editorconfig` for consistent editor settings
- `dependabot.yml` for automated dependency updates (npm, pip, GitHub Actions)
- `CODEOWNERS` assigning all paths to @Darlington6
- Issue templates (bug report, feature request)
- Pull request template with quality checklist
- `CONTRIBUTING.md` — branch naming, commit convention, PR process
- `SECURITY.md` — responsible disclosure policy
- `CHANGELOG.md` — this file

### Changed
- TypeScript source files updated with explicit type annotations for strict mode compatibility
- `tsconfig.json` updated to strict mode
- `.gitignore` expanded with tooling cache directories

---

## [1.0.0] — 2026-06-13

### Added
- Citizen dashboard with points summary and recent activity
- Waste report submission with geolocation and image upload
- Interactive map of waste reports (Google Maps integration)
- Recycling activity logging (+15 pts per activity)
- Leaderboard (top 20 users by points)
- Badge system with four tiers (Sprout, Recycler, Eco-Warrior, Champion)
- Rewards history page
- Admin dashboard with report verification and user management
- JWT authentication (access + refresh token rotation)
- Sentry error tracking (frontend and backend)
- Cloudinary media storage (optional, toggled via `USE_CLOUDINARY`)
- OpenAPI schema with Swagger UI via drf-spectacular
- Demo seed command (`python manage.py seed_demo`)

[Unreleased]: https://github.com/Darlington6/ptrack-platform/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/Darlington6/ptrack-platform/releases/tag/v1.0.0