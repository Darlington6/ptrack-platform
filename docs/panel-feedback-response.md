# Response to Panel Feedback

**Project:** Leveraging Technology to Drive Behavioural Change in Plastic Waste Management: A Pilot Digital Incentive Platform (pTrack) in Kigali, Rwanda

**Student:** Desmond Tunyinko
**Supervisor:** Neza David Tuyishimire
**Institution:** African Leadership University (ALU)
**Panel Reviewer:** Pelin Mutanguha [Panel 3]
---

This document describes the revisions made to the capstone report and platform in direct response to the areas of feedback raised during the oral defence.

---

## Feedback 1: Outdated Literature Base

**Panel observation:** A few references dated from 2017 and 2022 were considered outdated. The panel requested an updated literature base drawing on scholarship from the last two to three years (2023–2025).

**Response:** The literature review has been revised to incorporate recent empirical studies and policy documents from 2023 to 2025. New sources address: (i) advances in digital waste management systems and citizen reporting platforms in sub-Saharan Africa; (ii) updated statistics on plastic waste generation and recycling rates in Rwanda and the East African region; (iii) recent gamification research applied to pro-environmental behaviour, including meta-analyses published after 2022; and (iv) current national and regional policy frameworks, including Rwanda's updated plastic waste regulations post-2022. Sources predating 2022 have been retained only where they represent foundational theoretical works (e.g., Theory of Planned Behaviour, Circular Economy framework) that are not superseded by more recent publications.

---

## Feedback 2: AI Component Brought into Current Scope

**Panel observation:** Waste-type classification and fraud detection were described as "future work" in the initial submission. The panel recommended that these features be implemented and demonstrated as part of the current platform rather than deferred.

**Response:** Both features have been fully implemented, integrated, and deployed as part of the live pTrack platform. The implementation is described below.

### 3.1 AI-Powered Waste Image Analysis

Google Gemini (`gemini-flash-latest`) has been integrated into the report submission workflow via the Google AI Studio API. The AI analysis runs at the moment a citizen selects a photo — before the rest of the submission form is available — providing real-time feedback as follows:

- **Image validation:** The model determines whether the photo actually shows plastic waste. Images classified as invalid (selfies, food, scenery, blank frames, or non-waste objects) are rejected with an explanation before the citizen can proceed. This prevents junk data from entering the system.
- **Waste type classification:** The model classifies the waste into one of four categories: plastic bottles, plastic bags, mixed plastic, or other. The classification is returned with a confidence score (0–100 %) and pre-fills the waste type selector on the submission form.
- **Environmental priority scoring:** Each valid image is assigned a priority score from P1 (highest urgency: large volume near a waterway or drainage channel) to P5 (minimal concern: small amount in a low-risk location). The score and its reasoning are stored on the report and displayed in the admin dashboard.
- **AI-generated description:** The model generates a one-to-two sentence contextual description of the visible waste in both English and Kinyarwanda. This text pre-fills the description field on the form, lowering the effort required from the citizen and improving the quality of report data.

All AI analysis results (waste type, confidence, priority, priority reason, validity status) are stored on every report record and are visible in the admin Report Management table. A per-report AI Analysis card is also displayed on the report detail view.

An LRU in-process cache (keyed by MD5 image hash, maximum 100 entries) prevents repeated Gemini API calls for the same image within a single server process, preserving API quota during testing and high-load periods.

### 3.2 Algorithmic Fraud Detection

Three rule-based fraud checks have been implemented in `backend/reports/fraud_detector.py` and run on every submission:

| Rule | Condition | Detection method |
|---|---|---|
| Duplicate image | Same image submitted in a prior report | MD5 hash comparison against all stored report hashes |
| Duplicate location | Report submitted within 50 m of another report from the same user in the last 24 hours | Haversine distance calculation against recent GPS coordinates |
| High velocity | More than 5 reports submitted by the same user in the last hour | Count query against `created_at` timestamps |

**Citizen-facing (pre-submission):** When a citizen selects a photo, all three checks run immediately using the available data (image hash, current GPS coordinates, authenticated user identity). If any rule is triggered, an amber warning banner is displayed on the submission form in both English and Kinyarwanda. The warnings are non-blocking: the citizen is informed but can still proceed with the submission.

**Admin-facing (post-submission):** After a report is saved, the same three checks run again against the completed record. If any rule is triggered, the report is marked `is_flagged = True` with a `flag_reasons` list. In the admin Report Management table, flagged reports display a warning icon with a hover tooltip identifying which specific rules were triggered, allowing administrators to prioritise review of suspicious or duplicate submissions.

### 3.3 Deployment

All new features are live on the deployed platform:

- **Frontend:** https://ptrack-platform.vercel.app
- **Backend API:** https://ptrack-platform.onrender.com/api/v1/
- **Source code:** https://github.com/Darlington6/ptrack-platform

Key implementation files:
- `backend/reports/ai_service.py` — Gemini API client, LRU cache, model fallback logic
- `backend/reports/fraud_detector.py` — Fraud detection rules (both `pre_check` and post-save `check`)
- `backend/reports/views.py` — `analyse_image_view` (pre-submission endpoint) and report submission view
- `frontend/src/pages/ReportWaste.tsx` — AI validation UI, fraud warning banners, description pre-fill
- `frontend/src/pages/ReportDetail.tsx` — AI Analysis card on the report detail view
- `frontend/src/pages/admin/AdminReports.tsx` — Priority badges, collapsible priority reasons, fraud flag tooltips

---

*All revisions listed above are reflected in the final submitted version of this report and in the live platform codebase as of 4 August 2026.*