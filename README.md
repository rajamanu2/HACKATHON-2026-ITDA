# Aarogya Drishti / ఆరోగ్య దృష్టి

English/Telugu, offline-capable hackathon application with a glass interface, Saathi conversational intake, Android packaging, authenticated accounts, shared SQLite records and local n8n workflows. Requires Node.js 24 or newer. An optional local research image model is connected separately; it is not clinically validated. See [research AI setup and limitations](RESEARCH-AI.md).

## Permanent hosting

[Live Cloudflare care server and APK](CLOUDFLARE-LIVE.md). The hackathon cloud profile is deployed with 50 care-team accounts and shared D1 records. The full Node/n8n/Python VM package remains separate and undeployed.

## Android, conversational intake and video

- [Poster requirements and acceptance checklist](HACKATHON-COVERAGE.md)
- [Android build and device connection](ANDROID.md)
- [Telugu/English patient phone intake with n8n](VOICE-CALLING.md) — Bolna adapter and shared intake forms; paid calling disabled until provider setup and budget approval.
- [Cloudflare and bulk team access](CLOUDFLARE.md)
- `n8n/drishti-consultations.json`: doctor scheduling → meeting link preparation → authenticated callback → shared patient record.
- Saathi asks questions offline and fills the registration form; the worker still reviews consent and saves.
- The administrator’s Care team screen provisions worker/doctor accounts in batches of up to 100, with one-time credential download.

## Start

```powershell
npm start
```

Open http://127.0.0.1:4173. Three role-specific accounts are generated on first startup. Their emails and random passwords are in `.local/demo-accounts.json`. This file is private and excluded from Git. There is no public signup or role selector.

| Account | Permission |
| --- | --- |
| worker@drishti.local | Register screenings and view shared patient records |
| doctor@drishti.local | View shared records and save clinical reviews/referrals |
| admin@drishti.local | View shared records, dashboard and audit API |

All accounts belong to the same local demonstration care team. This is not a multi-tenant/facility deployment. Open separate browser profiles or an incognito window to test worker and doctor simultaneously. Tabs in the same browser profile share a login cookie.

## Local n8n

```powershell
npm run install:n8n
node scripts/configure-local-n8n.mjs
npm run n8n
```

The project pins n8n 2.44.6 in `.local/n8n-runtime`, and keeps its database/encryption key in `.local`. This JavaScript workflow does not require a Python task runner. The editor listens only on http://127.0.0.1:5678. Set up the local owner with the credentials in `.local/n8n-owner.json`, then import the credentials and workflow into this isolated n8n instance. Secrets are not in the workflow JSON or frontend.

```powershell
node scripts/local-n8n.mjs import:credentials --input=.local/n8n-credentials.json
node scripts/local-n8n.mjs import:workflow --input=n8n/drishti-events.json
node scripts/local-n8n.mjs import:workflow --input=n8n/drishti-consultations.json
node scripts/local-n8n.mjs import:workflow --input=n8n/drishti-voice-intake.json
```

Then publish the workflow using:

```powershell
node scripts/local-n8n.mjs publish:workflow --id=drishtiLocalEvents
node scripts/local-n8n.mjs publish:workflow --id=drishtiVideoConsultations
node scripts/local-n8n.mjs publish:workflow --id=drishtiVoiceIntake
```

Restart the local n8n service after CLI publishing. You can also publish/activate the imported **Aarogya Drishti - shared care event receipts** workflow. See the actual local setup receipt in `test-results/verification.md` after setup is verified. Once configured, `npm run start:local` launches n8n in a hidden background process and runs the application in the current terminal. Do not start a second copy if the ports are already in use.

The app writes events in the same transaction as patient changes. Every 15 seconds, or when Sync records & n8n is clicked, it sends pending events through the authenticated n8n webhook. n8n calls the app with a different credential to store a receipt. Event IDs are deduplicated at receipt storage. Repeated executions do not create duplicate receipts. This is intake verification, not notification delivery; no real email, SMS or patient message is sent. New external side effects need their own idempotency controls.

## Worker-to-doctor demonstration

1. Sign in as the health worker. Use synthetic data only.
2. Add a screening, optional photograph, history and consent.
3. A screening saved online is uploaded to the shared database. Offline captures remain in an account-specific IndexedDB queue.
4. After reconnecting, the app uploads queued records. Sync records & n8n also offers an explicit retry.
5. Sign in as the doctor in a separate browser profile. Shared listings refresh every 20 seconds; the Sync screen offers an immediate refresh.
6. Open the shared patient, record a review, and choose a referral/follow-up date. A worker can see the same updated record after refresh.
7. The doctor must be online to save reviews. Version checks reject stale edits instead of overwriting another review. Refresh shared record before retrying, preserving the draft elsewhere if needed.
8. Sync & integrations shows device uploads separately from n8n events and callback receipts.

## Offline and data handling

Open the app online once so its service worker caches the UI. First sign-in requires the server. An already signed-in tab can reopen its account cache offline until its cached 12-hour session expires. This is cached access, not offline credential verification. Reconnect to sign out and revoke the server session.

Patient caches are separated by server instance ID and account ID. Other accounts do not automatically display a previous account's queue. Local administrators/browser users with device access can inspect unencrypted browser storage, so use synthetic data only. The SQLite database is shared by all signed-in accounts in this local team and persists across app restarts.

Uploads use stable patient IDs and are idempotent for the originating worker. Clinical decisions supplied during a worker upload are discarded; only authenticated doctors can save them. Every clinical write creates a server-authored timeline and audit entry. The server uses scrypt password hashes, opaque HttpOnly SameSite session cookies, CSRF verification, origin checks, login throttling, parameterized SQL and server-side role checks. API responses are not cached by the service worker.

Device backup export/import remains available. Imported new records become unreviewed screenings; existing record IDs are preserved. Previous v0.1 IndexedDB data is not deleted; export an old backup before upgrading or use the legacy import button on the Sync screen. Clearing browser data removes unsent device records. Back up `.local/drishti.sqlite` using SQLite backup tooling; the database uses WAL, so copying only a live main database file is insufficient.

The server binds to loopback. Separate browser sessions on this PC can share records now. Real phones on different devices need a reachable HTTPS deployment; localhost on a phone refers to the phone itself. The app's image quality checks only measure basic pixel characteristics. They do not validate oral anatomy or diagnose lesions. Telugu speech depends on an installed device voice.

## Tests

```powershell
npm test
npm run test:browser
node tests/n8n-roundtrip.mjs
node tests/intake-browser.mjs
node tests/video-roundtrip.mjs
```

Browser checks require Playwright and Edge, with `PLAYWRIGHT_MODULE` / `BROWSER_PATH` overrides for other installations. The live n8n roundtrip check requires both local servers and creates a clearly named synthetic test patient; it verifies a cross-account review and duplicate receipt handling.

## Still outside scope

Clinical AI, verified two-person video/audio, actual notification delivery, diagnostic report uploads, encrypted managed-device patient storage, facility-level tenant scopes, password recovery and public production deployment remain future work. Consultation scheduling, n8n link preparation and join interfaces are implemented; the actual call is not yet verified. A temporary Cloudflare HTTPS test tunnel is running; a permanent account-backed hostname awaits the real domain and authorization. Public login was not verified because automatic approval review blocked transmitting account credentials through the tunnel; local login and shared records passed. This application is not approved for clinical patient data.
