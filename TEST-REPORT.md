# Verification report — 25 October 2026

Scope: local development build, synthetic data and isolated temporary databases. No clinical performance claim or real-patient trial.

| Check | Result |
|---|---|
| `npm test` | 7 passed: bilingual intake, input handling, image-quality checks, privacy-conscious events, login/roles/CSRF, durable shared records, versions, structured care and research acknowledgement/concurrency |
| `node tests/care-browser.mjs` | Passed actual local model inference using generated noise; model availability; doctor acknowledgement; shared result persistence; care entry; Telugu screen; mobile width |
| Model integrity and architecture | Pinned SHA-256 matched; `weights_only=True`; strict MobileNetV2 two-class load passed |
| Android `assembleDebug lintDebug` | Passed. Debug distribution; known lint/deprecation warnings remain documented in build reports |

Earlier local verification covered English/Telugu worker/doctor workflows, offline photo storage, queued sync, stale review drafts, Saathi auto-fill/recovery, the native transport contract, n8n receipts and consultation callbacks. Those results do not establish physical handset camera/voice acceptance, video connection or clinical accuracy.

No local credentials or patient records were submitted through the public tunnel for authenticated tests. Public anonymous asset checks can verify reachability and APK integrity without that transfer.

## Rehearsal acceptance still needed

1. Install the rebuilt APK on the target Android phone without clearing existing data. Verify camera, gallery, English/Telugu voice availability and app reopen.
2. Capture synthetic data offline, reconnect, and verify the same record appears in a separately signed-in doctor session.
3. Host and join one scheduled video appointment from two physical devices. Confirm audio/video and return to the patient record.
4. Add a sample scanned diagnostic report; check legibility on the phone and the doctor's screen.
5. Verify host availability, a fresh tunnel address, private test-account handoff and the five-minute recording before submission.

Use the exact research model revision and checksum in RESEARCH-AI.md. Generated-noise inference proves execution only: it cannot test diagnostic sensitivity, specificity, calibration, anatomy recognition or safety for patient decisions.
