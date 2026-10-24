# Verification report — 25 October 2026

Scope: local development build, synthetic data and isolated temporary databases. No clinical performance claim or real-patient trial.

| Check | Result |
|---|---|
| `npm test` | 7 passed: bilingual intake, input handling, image-quality checks, privacy-conscious events, login/roles/CSRF, durable shared records, versions, structured care and research acknowledgement/concurrency |
| `node tests/care-browser.mjs` | Passed actual local model inference using generated noise; model availability; doctor acknowledgement; shared result persistence; care entry; Telugu screen; mobile width |
| Model integrity and architecture | Pinned SHA-256 matched; `weights_only=True`; strict MobileNetV2 two-class load passed |
| Android `assembleDebug lintDebug` | Passed. Debug distribution; known lint/deprecation warnings remain documented in build reports |
| Shared browser regression | Passed English/Telugu login, offline photo/reload, isolated worker/doctor sessions, shared review visibility, stale draft protection, mobile layout and logout |
| Native bridge regression | Passed simulated Android protocol, cookie isolation, offline cached identity and queued capture/upload; not a handset test |
| `node tests/care-n8n.mjs` | Passed actual local diagnostic event acknowledgement, worker visibility and zero pending events after n8n startup completed |
| `node tests/video-roundtrip.mjs` | Passed n8n-confirmed room preparation and worker link access; actual call not tested |
| Anonymous public assets | HTTPS page and health passed; anonymous patient access denied; downloaded APK matches local SHA-256 |

Rebuilt APK: `dist/android/Aarogya-Drishti-0.3.0-debug.apk`. SHA-256: `8915379d29d08bb6b731723f89f3b612cd706c010c1f4cf3840eed6bc6467635`.

After a cold n8n restart, `/healthz` became ready before workflow/JS-runner startup completed. The first care-event check timed out; queued events subsequently delivered and the fresh care/video checks above passed. Service health alone is not workflow readiness. n8n's optional Python task runner is unavailable; these workflows use the JavaScript runner, and research inference uses its separate project Python environment.

Earlier local verification covered English/Telugu worker/doctor workflows, offline photo storage, queued sync, stale review drafts, Saathi auto-fill/recovery, the native transport contract, n8n receipts and consultation callbacks. Those results do not establish physical handset camera/voice acceptance, video connection or clinical accuracy.

No local credentials or patient records were submitted through the public tunnel for authenticated tests. Public anonymous asset checks can verify reachability and APK integrity without that transfer.

## Rehearsal acceptance still needed

1. Install the rebuilt APK on the target Android phone without clearing existing data. Verify camera, gallery, English/Telugu voice availability and app reopen.
2. Capture synthetic data offline, reconnect, and verify the same record appears in a separately signed-in doctor session.
3. Host and join one scheduled video appointment from two physical devices. Confirm audio/video and return to the patient record.
4. Add a sample scanned diagnostic report; check legibility on the phone and the doctor's screen.
5. Verify host availability, a fresh tunnel address, private test-account handoff and the five-minute recording before submission.

Use the exact research model revision and checksum in RESEARCH-AI.md. Generated-noise inference proves execution only: it cannot test diagnostic sensitivity, specificity, calibration, anatomy recognition or safety for patient decisions.


## Android 0.3.1 connection repair

- Actual Java transport tests passed: UTF-8 POST, HTTP 401 preserved as authentication failure, cookie/CSRF headers, PATCH alias, gzip decode, HTML and redirect rejection, URL normalization and error classification. No actual account credentials were sent through a public tunnel.
- Anonymous public health passed via the same Java class on the desktop JVM; this is not Android handset proof.
- Extended native-bridge browser test passed saved-address/version display, successful and failed anonymous connection tests, offline session recovery and queued upload.
- Seven API/domain tests passed after the shared handler/LAN addition. `node tests/lan-check.mjs` passed private-only bind validation, common instance/database, anonymous access denial and a synthetic shared record across Wi-Fi and loopback.
- Android assembleDebug/lintDebug passed. Version 0.3.1, code 4, same signer as 0.3.0. Wi-Fi download SHA-256: `4a57785d220d9fa46d76ff9de5f2b76f74105632cdd9927e95ae35e5e039cf16`.
- PC-side health and exact APK download passed at `http://192.168.1.3:4174`. Windows accepted the subnet-scoped app firewall rule. Physical-phone health and login acceptance remain pending user confirmation.
