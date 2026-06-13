# Contributing to pTrack

Thank you for your interest in contributing to pTrack! This document covers how to set up a local development environment, the branch and commit conventions, and the PR process.

---

## Prerequisites

- **Python 3.11+** (tested on 3.13)
- **Node.js 18+** and **npm**
- **Git**

---

## Local Setup

Follow the [README](README.md) Setup Instructions to get both the backend and frontend running.

---

## Branch Naming

Use the following prefixes:

| Prefix | When to use |
|--------|------------|
| `feat/` | New features or enhancements |
| `fix/` | Bug fixes |
| `chore/` | Maintenance, tooling, dependencies |
| `docs/` | Documentation only changes |
| `refactor/` | Code refactors with no behaviour change |
| `ci/` | Changes to CI/CD workflows |

Examples: `feat/badge-system`, `fix/login-redirect`, `chore/update-deps`

---

## Commit Convention

pTrack uses [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/):

```
<type>(<scope>): <short summary>

[optional body]

[optional footer]
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `ci`

**Examples:**

```
feat(reports): add image upload to waste report form
fix(auth): redirect admin users to /admin on login
chore(deps): upgrade axios to 1.7.x
docs(readme): add PostgreSQL switching instructions
```

- Keep the subject line under 72 characters
- Use the imperative mood ("add" not "added")
- Reference the issue number in the footer: `Closes #42`

---

## Development Workflow

1. **Create a branch** from `main`:
   ```bash
   git checkout -b feat/my-feature main
   ```

2. **Make your changes.** Keep commits small and focused.

3. **Verify locally before pushing:**
   ```bash
   # Frontend
   cd frontend
   npm run typecheck
   npm run lint
   npm run format:check
   npm run build

   # Backend
   cd ../backend
   source venv/bin/activate
   ruff check .
   black --check .
   mypy . --exclude venv
   ```

4. **Push and open a PR** targeting `main`.

5. **Fill in the PR template** — checklist, screenshots, and notes for the reviewer.

6. **Address review comments** and push fixup commits. Squash before merge if needed.

---

## Code Quality Tools

See [README.md — Code Quality](README.md#code-quality) for setup instructions.

---

## Pull Request Rules

- All CI checks must pass before merging.
- At least one review from `@Darlington6` is required (enforced via CODEOWNERS).
- Prefer squash-and-merge to keep `main` history linear.
- Update `CHANGELOG.md` under `[Unreleased]` before marking the PR as ready for review.

---

## Reporting Bugs

Open a [Bug Report issue](.github/ISSUE_TEMPLATE/bug_report.md) or email d.tunyinko@alustudent.com.

## Security Vulnerabilities

See [SECURITY.md](SECURITY.md) for responsible disclosure instructions.