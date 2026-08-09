# Discussion - pTrack

## 1. Overview

This document discusses the significance of the milestones reached during the pTrack capstone, the technical and behavioural impact of the results, and the lessons learned from building and deploying a production-grade civic technology platform as a solo student project.

---

## 2. Milestone Discussion

### Milestone 1: Requirements and Design

The first milestone established the scope of the platform through research into plastic waste management challenges in the world, Africa, and the Kimironko Sector of Kigal, Rwanda, and a review of existing digital behaviour-change interventions. The result was a proposal grounded in the specific context of a peri-urban Kigali neighbourhood, rather than a generic gamification application.

A key design decision made at this stage was to place all incentive parameters - point values, badge thresholds, weekly goal defaults - under administrator control rather than hardcoding them. This decision proved correct: the ability to tune incentives in real time, without a code deployment, is essential for a research pilot where the optimal values are not known in advance.

Figma designs for all major screens (dashboard, report form, leaderboard, admin analytics, profile) were completed before any code was written. Adherence to the design during implementation was high, with the main deviation being the addition of features not originally mocked (education hub, recycling centre finder, nudges) rather than departures from what was mocked.

### Milestone 2: Core Backend and Authentication

The backend was architected as a set of focused Django apps: `accounts` (users and auth), `reports` (waste reporting and gamification), `core` (notifications and admin analytics), `recycling_centres`, `nudges`, `education`, and `push` (Web Push / VAPID). This modular structure meant that each domain could be developed, tested, and deployed independently.

Authentication was implemented with JWT (SimpleJWT), Argon2 password hashing, and Google OAuth as an alternative sign-in path. The decision to include Google OAuth from the start, rather than adding it later, was driven by the observation that most Kigali residents with smartphones use Google accounts - reducing the barrier to registration is directly relevant to adoption.

The custom soft-delete pattern (overriding `Model.delete()` to set `is_deleted=True`) was introduced here. In retrospect, while the pattern provides data recovery capability, it created edge cases in the registration flow (soft-deleted emails blocking re-registration) and in JWT token validation (tokens referencing soft-deleted users). The self-service account deletion endpoint was subsequently changed to perform a hard delete to avoid these issues for users who chose to leave the platform.

### Milestone 3: Citizen-Facing Features and Gamification

This milestone was the most directly tied to the research hypothesis. The gamification engine (points, badges, streaks, leaderboard) was built to be entirely event-driven. When a user submits a report or logs a recycling activity, a chain of service calls fires: points are awarded, streak dates are updated, badges are checked, and a notification is created. This design keeps the gamification logic co-located with the user action that triggers it, rather than in a background job, which means feedback is immediate.

The weekly goal progress ring on the dashboard was an addition that emerged from thinking about user motivation: a badge tells a user they have achieved something past; a progress ring tells them how close they are to achieving something now. The combination of lagging indicators (badges) and leading indicators (weekly goal) gives users both a sense of history and a reason to act today.

Offline support was the most technically demanding feature of this milestone. The Workbox `injectManifest` strategy requires a custom service worker (`sw.ts`) that intercepts fetch events and routes them through cache strategies. The background sync for report submissions required careful handling of the retry queue, ensuring that a report submitted offline is replayed only once and that the user is notified of its eventual submission.

### Milestone 4: Admin Dashboard and Analytics

The admin dashboard evolved beyond the original proposal to include an engagement funnel. The funnel visualises the drop-off between registration, onboarding completion, first report submission, and recurring reporting. This is the metric most directly relevant to evaluating the effectiveness of the platform: it shows not just how many people registered but how many actually changed their behaviour.

The audit log was added as a governance feature: every admin action (verify, reject, bulk verify, point configuration change) is recorded immutably with a timestamp and IP address. This is important for accountability in a context where the platform interacts with citizens' contributions.

The CSV export feature for reports and users was a practical response to the supervisor's expectation that data collected during the pilot would need to be analysed externally (e.g., in Excel or R) - the platform should make data accessible, not lock it in.

### Milestone 5: Deployment, Testing, and Hardening

The deployment stack - Vercel (CDN) + Render (compute) + Neon (database) + Redis + Cloudinary - was chosen to keep infrastructure cost at or near zero during the pilot phase while providing production-grade reliability. The trade-off is that the free-tier Render web service cold-starts after 15 minutes of inactivity, adding a delay of up to 50 seconds on the first request. This was mitigated by configuring UptimeRobot to ping the health endpoint every 5 minutes, which keeps the service warm during the day.

The CI/CD pipeline was built before the tests were written, which enforced a discipline of writing tests that actually passed the automated checks rather than tests that were written after the fact to achieve coverage numbers. All 6 CI jobs (frontend quality, frontend tests, backend quality, backend tests, E2E, secrets scan) have been green on every commit to `main` since the test suite was completed.

The switch from SendGrid to Brevo during this milestone was a disruption, but the design choice of using `django-anymail` as an abstraction layer meant the code change was confined to three lines in settings - only the backend identifier and API key changed; the rest of the email infrastructure was unaffected.

Following the panel defence, two further features were implemented and deployed in direct response to panel feedback: AI-powered image analysis via Google Gemini (`backend/reports/ai_service.py`), which classifies waste type, assigns an environmental priority score (P1–P5), rejects invalid images before form submission, and generates bilingual descriptions in English and Kinyarwanda; and algorithmic fraud detection (`backend/reports/fraud_detector.py`), which checks for duplicate image hash, location proximity (Haversine 50 m within a 24-hour window), and high-velocity submission patterns (>5 reports/hr). Both run as part of the `POST /api/v1/reports/analyse-image/` pre-submission endpoint, and all three fraud checks also run post-save to set `is_flagged` and `flag_reasons` on the stored report. Dedicated test files (`test_ai_service.py`, 22 tests; `test_fraud_detector.py`, 19 tests) were added, bringing the total pytest suite to 106 tests.

---

## 3. Impact of the Results

### On the Research Hypothesis

pTrack provides a functional, deployed, and tested platform capable of generating the data needed to evaluate the research hypothesis. The hypothesis - that digital incentives can drive measurable behavioural change in plastic waste reporting - cannot be confirmed or rejected from a technical pilot alone; it requires longitudinal engagement data. However, the platform has:

1. Demonstrated that citizens can report plastic waste via a mobile web app in under two minutes, including photo capture and GPS tagging.
2. Demonstrated that gamification mechanics (points, badges, streaks, leaderboard) are technically functional and visible to users on their first session.
3. Deployed an analytics layer capable of measuring the exact metrics the hypothesis requires: report frequency per user, recycling activity rate, streak maintenance, and engagement funnel conversion.

The platform is ready for the field evaluation phase.

### On the Community

The public community stats page, accessible without authentication, shows aggregate impact figures (total reports, total recycling activities, estimated plastic diverted) to anyone who visits the platform. Making impact visible - even to non-registered visitors - is itself a behaviour-change mechanism, creating social proof and encouraging participation.

The recycling centre finder provides a practical utility that is independent of the gamification layer: a resident who does not want to earn points can still use it to find the nearest drop-off location. This lowers the barrier for recycling behaviour among residents who are not motivated by digital rewards.

### On Software Engineering Practice

Building pTrack as a solo capstone project across the full stack - backend, frontend, infrastructure, CI/CD, testing, monitoring - demonstrates the application of software engineering principles at professional scale. Key practices applied throughout:

- **Separation of concerns:** Django apps are domain-isolated; frontend components and pages are separated from API calls and state management.
- **Automated quality gates:** No code reaches `main` without passing type checking, linting, formatting, tests, and security scanning.
- **Infrastructure as code:** `render.yaml` and `docker-compose.yml` make the deployment reproducible from a fresh checkout.
- **Observability:** Sentry captures runtime errors in production; structured JSON logging enables log filtering; UptimeRobot provides external uptime verification.

---

## 4. Technical Challenges and How They Were Resolved

| Challenge | Resolution |
|---|---|
| Offline report submission (mobile with intermittent data) | Workbox background sync via IndexedDB; implemented in custom service worker (`sw.ts`) |
| Email provider failure (SendGrid credits exhausted) | Migrated to Brevo via `django-anymail`; code change was three lines |
| UptimeRobot returning 405 (HEAD not allowed) | Added `HEAD` to `@api_view(["GET", "HEAD"])` on the health endpoint |
| PWA not showing app icon (browser preferring SVG over PNG) | Removed SVG favicon link; left only PNG in `index.html` |
| Playwright HTML report not generated locally | Changed local reporter from `'list'` to `[['list'], ['html', { open: 'never' }]]` |
| Soft-delete blocking re-registration with same email | Self-service "Delete Account" changed to hard delete; email freed immediately |
| Gemini API quota consumption during testing and development | LRU in-process cache (max 100 entries, keyed by MD5 image hash) prevents repeated API calls for the same image within a single server process; model fallback list tries `gemini-1.5-flash` → `gemini-1.5-flash-latest` → `gemini-flash-latest` on quota exhaustion |
| Fraud pre-check needs GPS coordinates before the report is saved | `pre_check()` accepts `lat`/`lng` as arguments; the frontend passes the device's Geolocation API coordinates alongside the image hash at the time of photo selection, before the form is available |
| Gemini SDK converting PIL images to lossless WebP (OOM on Render free tier) | Images are downscaled to 1024 px and JPEG-encoded locally before being passed as a typed blob `{mime_type, data}` to the API, bypassing the SDK's internal lossless conversion |

---

## 5. Limitations

1. **SMS notifications are not implemented.** The proposal considered SMS as a fallback for users without consistent internet access. The Brevo SMS API was evaluated but not integrated within the project timeline. This is a meaningful gap for the target population.

2. **No native mobile application.** pTrack is a PWA, not a native Android or iOS application. While PWAs have good support on Android Chrome, the iOS experience is slightly degraded (no push notifications, manual home screen installation). A future React Native port would resolve this.

3. **Free-tier cold starts.** The Render free tier cold-starts the backend after 15 minutes of inactivity. UptimeRobot pings mitigate this during daytime, but early-morning cold starts remain a latency issue.

4. **Scale not yet tested at full capacity.** Load testing has been initiated using Locust. A headless run at 10 concurrent users over 60 seconds produced 0 failures across 62 requests. A browser-UI run at the same concurrency showed 13/76 (17%) failures, but these were diagnosed as an artefact of the test setup rather than a platform defect: all 10 simulated users authenticate as the *same* single test account, so the per-IP login throttle (5/min) and per-user report-submit throttle (10/hr) — both legitimate anti-abuse controls — were exercised by the whole swarm instead of per simulated user. See [testing-report.md §11](testing-report.md#11-load-testing-locust) for the full failure breakdown. True high-concurrency behaviour (hundreds of *distinct* citizen accounts submitting reports simultaneously) has not yet been tested.

5. **Google Maps tiles fail in offline mode.** When the device is offline the Google Maps CDN is unavailable, so the map preview cannot render during an offline report submission. The GPS coordinates are still captured from the device's Geolocation API, so the report is queued and submitted correctly on reconnect - but the citizen sees a blank map during the offline session. A manual location fallback (text input for a landmark or street address) is the recommended near-term fix; see [recommendations.md](recommendations.md) section 2.5.

6. **Gemini API quota dependency.** The AI image analysis feature depends on Google Gemini API availability and the free-tier quota. If the quota is exhausted or the API is unavailable across all three model candidates, the `analyse-image/` endpoint returns gracefully and the citizen can still submit the report without pre-filled AI data — but the image validity gate and priority scoring are bypassed. The LRU in-process cache (100-entry maximum) mitigates repeated identical-image calls but does not persist across server restarts.