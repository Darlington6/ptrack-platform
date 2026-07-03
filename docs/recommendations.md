# Recommendations - pTrack

## 1. Recommendations to the Community

### 1.1 Adopt the Platform for Sector-Wide Reporting

pTrack is designed to work at the scale of a single sector. The Kimironko pilot demonstrates that digital waste reporting can be made accessible via a mobile browser - no app store, no installation fee, no data plan beyond what a typical smartphone user already has. Community leaders in Kimironko Sector are encouraged to promote the platform at the cell and village level, specifically to residents who already use smartphones for mobile money or social media.

The leaderboard and badge system are most effective when participation is dense enough to create social comparison. A critical mass of active reporters within a single cell (approximately 20-30 active users) is sufficient to make the leaderboard feel competitive. Community champions - residents who are already active in local cleanliness initiatives - are the most effective advocates for early adoption.

### 1.2 Use the Analytics to Drive Action

The admin dashboard is a monitoring tool, not a passive record. Administrators should review the engagement funnel weekly to identify where residents disengage. If most registered users do not submit a first report, the barrier is in the reporting flow and should be addressed through in-person demonstrations. If users submit one report and stop, the barrier is in the reward experience and may require adjusting point values or badge thresholds.

The sector-level breakdown shows which cells generate the most reports. Cells with very low activity are candidates for targeted outreach, not just algorithmic nudges.

### 1.3 Configure Point Values Based on Observed Behaviour

The default point values (5 points for submission, 10 bonus points for verification, 5 points for recycling) are starting estimates. Administrators should observe the reporting frequency in the first month and adjust point values if behaviour is lower or higher than expected. Setting the verification bonus too low relative to the submission award reduces the incentive to submit quality, verifiable reports. Setting it too high may incentivise gaming.

### 1.4 Keep the Verification Cycle Short

The gamification loop depends on timely admin verification. If a citizen submits a report on Monday and it is not verified until the following week, the bonus points arrive too late to reinforce the behaviour. Administrators should aim to verify or reject reports within 24–48 hours. The admin dashboard's pending report count and the bulk-verify action are designed to make this efficient even at high volumes.

---

## 2. Recommendations for Future Technical Work

### 2.1 Complete the Kinyarwanda Translation

The i18n infrastructure is in place and English is fully translated. Completing the Kinyarwanda translation requires populating the remaining string keys in `frontend/src/i18n/rw.json`. This is the highest-priority technical task before scaling the pilot, as language is the primary accessibility barrier for Kinyarwanda-dominant residents.

A community translator or a native Kinyarwanda speaker with technical literacy can contribute the translations without needing to understand the codebase - the string keys and English equivalents make the task self-explanatory.

### 2.2 Integrate SMS Notifications

Push notifications are unavailable on iOS Safari and are only effective when users have installed the PWA. SMS reaches all mobile users regardless of browser or installation status. Brevo (the current email provider) also provides an SMS API under the same account, which makes integration low-effort from an infrastructure standpoint.

**Recommended implementation:** Add an optional phone number field (already present in the user model) to the onboarding flow, send an OTP to verify ownership, and use the Brevo SMS API to deliver streak warnings and report verification notifications to users who have opted in.

### 2.3 Build a Native Android Application

A React Native or Capacitor-based Android application would resolve the PWA limitations on iOS and provide a more reliable installation and push notification experience across both platforms. The existing Django REST API does not need to change - a native app would consume the same endpoints.

An Android APK distributed via Google Play (or as a direct download linked from the platform) would also eliminate the cold-start latency issue for users who access the platform primarily via the app rather than the browser.

### 2.4 Integrate AI-Driven Submission Validation and Priority Scoring

At scale, a single administrator cannot realistically review hundreds of reports manually. Two AI-driven enhancements would address this:

**Submission-time validation:** Before a report is accepted, a multimodal language model (e.g., Google Gemini Flash, which has a generous free tier) can analyse the uploaded image and description together. If the image does not appear to contain plastic waste, the submission is flagged or blocked with an explanation. A prompt-and-fallback strategy — where one model answers and an open-source alternative (e.g., LLaVA) takes over if the primary is unavailable — balances cost against reliability.

**Priority scoring:** Each accepted report receives an AI-generated severity score (1–5) based on factors such as waste density, proximity to water, and report frequency in the same location. Admins see the score in the report table and can sort by it, allowing them to dispatch collectors to the highest-priority locations first without reviewing every submission.

This was specifically recommended during supervisor consultation (July 3, 2026) as a necessary feature before scaling beyond a single-admin workflow. Implementation requires:
1. A call to the Gemini API (or open-source equivalent) in the report submission endpoint, after image upload to Cloudinary
2. A `priority_score` integer field on the `WasteReport` model
3. A UI column in the admin report table for the score, with sort/filter support

**Demo caveat:** During a live demo without a trained or connected model, the feature should be demonstrated in a caveated mode (mock scores shown) with a clear statement that the production model will be swapped in before full deployment.

### 2.5 Add Offline Map Support (Manual Location Fallback)

Testing revealed that Google Maps tiles fail to load when the device is offline, which means the map cannot be rendered during an offline report submission. Two approaches address this:

**Option A — Manual location input:** Add a text input field for the street address or landmark as a fallback when the map cannot load. The coordinates are derived when the device reconnects. This is the lower-cost option and was recommended during the supervisor meeting as a practical near-term solution.

**Option B — Offline tile caching:** Replace the Google Maps layer with Mapbox or OpenStreetMap (via `react-leaflet`) and pre-cache map tiles for the Kimironko Sector area using a tile caching strategy. This provides a fully offline map experience but requires a feasibility analysis of tile storage size and the licensing terms of the chosen tile provider.

Option A is recommended as the immediate fix; Option B as the longer-term enhancement.

### 2.6 Add Distributed Admin and Triage Workflow

As the report volume grows, relying on a single administrator is a structural bottleneck. The platform should support:
- **Role-based geographic assignment:** Admins assigned to specific cells or villages only see reports from their area
- **Triage queue:** Reports sorted by AI priority score (see 2.4) so reviewers work the highest-impact items first
- **Response SLA tracking:** A flag on reports older than 48 hours without admin action, visible on the admin dashboard KPI cards

### 2.7 Add Load Testing

The platform has been unit-tested and E2E-tested but not load-tested. Before expansion, a load test should be performed simulating the concurrent submission of reports from hundreds of users. Tools such as Locust (Python) or k6 are appropriate. The primary bottleneck is expected to be the Gunicorn worker pool (2 workers on the current Render free tier) and the Neon database connection pool.

If the load test reveals throughput constraints, the first remediation should be increasing the Gunicorn worker count (via the `--workers` flag in `render.yaml`) and enabling database connection pooling via PgBouncer (available on Neon).

### 2.8 Implement Report Content Moderation

Currently, any JPEG or PNG uploaded as a report photo is accepted and stored on Cloudinary. As the user base grows, the absence of automated moderation creates a risk of inappropriate content. Cloudinary's AI moderation API can flag images for review before they are publicly visible on the map. This is a single API call change to the report upload endpoint.

### 2.9 Extend the Analytics Export

The current CSV exports (reports, users, audit log) are sufficient for manual analysis. As the pilot matures, the research team will benefit from richer exports - time-series data per user, cohort retention analysis, and geographic clustering. A dedicated `/api/v1/admin/export/` endpoint accepting a date range and format parameter (CSV, JSON) would make these analyses possible without direct database access.

### 2.10 Address the Free-Tier Cold-Start Limitation

The current workaround (UptimeRobot pings every 5 minutes) keeps the backend warm during daytime but does not guarantee instant response at all hours. If the pilot proceeds to a funded phase, upgrading the Render web service to a paid `Starter` plan ($7/month) eliminates cold starts entirely. Alternatively, migrating the backend to Fly.io or Railway's hobby plan may offer always-on execution at a similar price point.

---

## 3. Scaling Beyond Kimironko

The platform is sector-scoped by design but not technically limited to one sector. The data model includes a `sector` field on the user model and on waste reports, which means sector-level filtering and analytics already work for any sector name. Expanding to additional sectors requires only:

1. Onboarding administrators for the new sectors
2. Adding the sector names to the sector dropdown in the frontend configuration
3. No database migrations or backend changes

A Kigali-wide rollout would require:
- A decision on whether to maintain a single deployment shared across sectors or to deploy sector-isolated instances (the former is recommended for aggregate analytics and leaderboard comparison)
- A formal partnership with the Kigali City Council for report routing and resolution workflows
- Community leader training on the admin dashboard across all sectors

A Rwanda-wide rollout (beyond Kigali) would require adding a district or province dimension to the data model and potentially localising the reward catalogue to align with district-specific incentive programmes.

---

## 4. Research Continuation

The data collected during the Kimironko pilot - report frequency per user over time, streak maintenance rates, badge unlock rates, leaderboard participation - constitutes a dataset suitable for a quantitative evaluation of the research hypothesis.

**Recommended analytical approach for follow-up research:**
- Use a pre/post comparison of self-reported waste disposal behaviour (via a simple survey at registration and after 60 days) combined with platform-measured activity data
- Segment users by engagement level (one-time reporters, occasional reporters, recurring reporters) and compare point accumulation, badge ownership, and streak length across segments
- Use the engagement funnel data to identify the bottleneck that most reduces programme effectiveness

The platform is designed so that this data is already being collected. No additional instrumentation is required for a follow-up study.