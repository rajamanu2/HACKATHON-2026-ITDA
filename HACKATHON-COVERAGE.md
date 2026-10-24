# AAROHAN 2026 acceptance checklist

This checklist maps the supplied Aarogya Drishti poster to implemented behavior and evidence. The poster is the brief, not proof of organizer approval or clinical validation. Only synthetic or authorized demonstration data may be used for the hackathon.

## Nine-step care pathway

| Poster step | Implementation | Verification / remaining acceptance |
|---|---|---|
| 1. Registration and history | Worker account, validated registration, Saathi guided intake and explicit consent | English/Telugu browser and offline intake tests passed |
| 2. Mobile oral screening | Android camera/gallery, browser photo capture, basic image-quality feedback, offline storage | Browser/native-bridge tests and APK build passed; physical-phone camera acceptance remains |
| 3. AI-assisted assessment | Actual local Umlomo research inference; checksum and strict architecture checks; model/image provenance; doctor acknowledgement | Actual inference on generated synthetic noise passed. This checks plumbing, not medical accuracy. No clinical validation established |
| 4. Medical officer review | Doctor-only notes, care-stage updates, facility/date requirements, version conflicts | API and separate worker/doctor browser tests passed |
| 5. Telemedicine | Doctor schedules; local n8n prepares an event-specific Jitsi room link; authenticated callback; web/native join | Local n8n callback tested. A successful two-device video/audio call remains unverified; Jitsi host login may be required |
| 6. Referrals and appointments | Facility, next appointment date, referral registry, overdue tasks and consultation appointments | Required-field, access-control and shared-record checks passed |
| 7. Diagnostics / biopsy / reports | Structured diagnostic entries, planned/completed/missed state, date, facility, clinician findings and scanned-image report | Care API and browser tests passed. Scanned JPEG/PNG/WebP reports under 750 KB; no lab-system integration or PDF parser claimed |
| 8. Treatment and follow-up | Structured treatment/follow-up entries, immutable entry history, status and timeline, separate clinician-controlled stage | Role/version/persistence tests passed; no automated prescribing |
| 9. District dashboard | Village counts, care pipeline, overdue records, completed/planned/missed diagnostic/treatment/follow-up totals | Uses shared records plus the current worker's pending captures; counts are not disease prevalence or population coverage |

## Required cross-cutting features

| Requirement | Coverage and boundary |
|---|---|
| Health-worker mobile app | Buildable native Android shell with bundled UI, native camera/voice and encrypted native session cookie; debug APK downloadable from app |
| Doctor / specialist portal | Doctor role supports clinical review, video scheduling and structured care entries. Specialist currently uses the doctor role; no separate credential-verification service |
| Telugu and English | Navigation, intake, registration, review, AI warnings and care forms switch languages. Clinician-entered reports retain their original language; model-card class labels are shown verbatim |
| Offline capability | Account-scoped local cache, photos, intake drafts and queued screening upload. First login, AI, doctor writes and video require a connection |
| Security and privacy | Password hashing, opaque HttpOnly sessions, CSRF/origin checks, role enforcement, audit records, version checks, protected static root, private n8n callbacks, image-free event payloads |
| Production security boundary | Browser/SQLite patient storage is not encrypted at rest, no independently verified backup/restore, retention/consent governance or clinical authorization. Temporary Cloudflare link and debug APK are development distribution; no mass-load claim |
| Easy-to-use UI | Responsive glass interface, large actions, shared-record status and explicit pending/offline/error states; browser mobile overflow checks passed |

## Scoring categories: 100 marks

| Category | Marks | Review evidence |
|---|---:|---|
| Complete workflow and integration | 20 | Nine-step mapping above; shared database; event outbox; local n8n callback |
| AI engineering and safe integration | 15 | RESEARCH-AI.md; pinned/checksummed weights; safe load; no fabricated predictions; clinician-only explicit research use |
| Medical review, teleconsultation and appointments | 15 | Versioned doctor review; referrals; consultation workflow; actual two-device call acceptance pending |
| Records, diagnostics and navigation | 15 | Shared registry, timeline, structured care entries and report images |
| Security, privacy and governance | 15 | Implemented controls above; explicit production gaps instead of unsupported compliance claims |
| Telugu usability and offline capability | 10 | Automated Telugu/offline intake, draft recovery and shared sync checks; physical handset acceptance pending |
| Deployment, code quality and documentation | 10 | Source repository, reproducible app/APK/model setup, architecture, tests and submission guide |

## Submission package

- Source: repository with app, Android source, n8n workflows, tests and documentation.
- Deployed application: current temporary tunnel stored in private `.local/cloudflare/quick-tunnel.json`; the host PC and services must remain running.
- Test accounts: private `.local/demo-accounts.json`; share directly with authorized judges, never commit credentials or embed them in a public video.
- Architecture: ARCHITECTURE.md, ANDROID.md, CLOUDFLARE.md and RESEARCH-AI.md.
- Test report: TEST-REPORT.md.
- Five-minute product video: SUBMISSION-GUIDE.md provides the timed walkthrough. A final narrated recording is still a submission task; screenshots or passing tests are not a completed video.
- Live presentation on 4 November 2026: team responsibility; use the rehearsal checklist and disclose AI assistance and research-model limitations.

The poster also requires a team of 2–5 currently enrolled AAROHAN students, one team per student and AI-tool disclosure. These are organizer/team obligations rather than app features. Confirm registration and submission arrangements directly with the organizers.
