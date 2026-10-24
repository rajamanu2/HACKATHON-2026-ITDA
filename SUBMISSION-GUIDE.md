# Five-minute walkthrough and presentation

Use synthetic or authorized demonstration data only. Do not show passwords, tokens, private configuration files or real patient images. Disclose AI-assisted development and the GPL-3.0 research model. Rehearse the actual APK camera and two-device video connection before recording.

| Time | Demonstration | Explain |
|---|---|---|
| 0:00–0:30 | Login and overview | One shared patient journey for village workers, medical officers and district administrators |
| 0:30–1:15 | Switch Telugu; use Saathi to fill registration | Guided questions, validated age/phone, explicit worker review and consent; no chatbot diagnosis |
| 1:15–1:50 | Capture a synthetic image offline, reload and reconnect | Device persistence, pending-upload state, idempotent sync; AI/video require connectivity |
| 1:50–2:30 | Open the same record as doctor; run research AI | Actual local inference, checksum/revision provenance, research-only output, no clinical performance claim |
| 2:30–3:10 | Save review, referral facility and appointment | Human decision ownership, stage/date validation, shared record update |
| 3:10–3:45 | Schedule consultation; show n8n-confirmed ready link and join | Local authenticated workflow and retry/receipt handling. Show actual connected call only after verifying two-device audio/video |
| 3:45–4:25 | Add diagnostic report, treatment and follow-up entries | Facility/date/status, scanned-image report, clinician notes, preserved timeline and missed follow-ups |
| 4:25–4:50 | District dashboard | Village activity, care pipeline, overdue records and structured-care totals; counts do not imply prevalence |
| 4:50–5:00 | Close with architecture and limits | Android/web + local shared API/SQLite + n8n; research AI, temporary hosting and handset/clinical acceptance boundaries |

## Live presentation outline

1. Problem: distance, connectivity and gaps between screening and treatment.
2. Product: show one complete patient journey instead of unrelated screens.
3. Engineering: account-scoped offline queue, versioned shared records, transactional n8n outbox and private local model inference.
4. Safety and limitations: research output does not diagnose; all care decisions are clinician controlled; show real error/unavailable states.
5. Evidence: test report, APK build, model checksum, verified callback and handset demonstration.
6. Next steps for clinical use: validated screening SDK access, local clinical evaluation, governance, encrypted storage, backups, permanent hosting and capacity testing.

Keep source and test accounts ready for judges. The final live presentation and recording cannot be replaced by documentation or an untested promise.
