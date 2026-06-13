# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| Latest (`main`) | ✅ |
| Older branches | ❌ |

Only the latest version of the `main` branch receives security fixes.

---

## Reporting a Vulnerability

**Please do not open a public GitHub issue for security vulnerabilities.**

To report a vulnerability, email **d.tunyinko@alustudent.com** with:

- A description of the vulnerability and its potential impact
- Steps to reproduce (proof-of-concept code or screenshots if applicable)
- Any suggested mitigation or fix

**What to expect:**

| Timeframe | Action |
|-----------|--------|
| Within 48 hours | Acknowledgement of your report |
| Within 7 days | Initial assessment and severity classification |
| Within 30 days | Fix deployed or a clear timeline if more time is needed |

We follow [responsible disclosure](https://en.wikipedia.org/wiki/Responsible_disclosure): please give us a reasonable window to fix the issue before any public disclosure.

---

## Scope

The following are **in scope**:

- Authentication/authorisation bypass (JWT, role checks)
- SQL injection or ORM misuse in the Django backend
- Sensitive data exposure via the REST API
- Cross-Site Scripting (XSS) in the React frontend
- Insecure direct object reference (IDOR) on reports/rewards endpoints

The following are **out of scope** (but still appreciated):

- Issues requiring physical access to the device
- Denial of service attacks
- Social engineering / phishing

---

## Security Practices

- JWT tokens use short-lived access tokens (8 h) and rotating refresh tokens (7 d).
- Passwords are hashed by Django's default PBKDF2 hasher.
- CORS is restricted to `CORS_ALLOWED_ORIGINS` in settings.
- Sensitive configuration is never committed — see `.env.example`.