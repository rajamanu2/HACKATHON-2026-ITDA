# Live hackathon care server

Website: https://aarogya-drishti-care-hackathon.dodavidokolo.chatgpt.site

Cloud APK: https://github.com/rajamanu2/HACKATHON-2026-ITDA/raw/refs/heads/main/downloads/Aarogya-Drishti-cloud.apk

Cloudflare Workers and D1 are hosted through Sites. This does not require the author's PC, local SQLite, n8n process, LAN address or tunnel. It is a Sites-managed Cloudflare deployment, not a deployment inside the user's separately authenticated personal Cloudflare account. No paid hosting was purchased.

The public app login and health endpoint are accessible. Patient APIs require an authenticated care-team account; authorization is checked server-side. Live checks confirmed anonymous patient access returns 401. All fifty new cloud accounts passed actual HTTPS login: 35 health workers, 14 doctors and one administrator. Worker-created synthetic records and doctor updates were visible across accounts, and stale writes were rejected. Sessions use Secure HttpOnly SameSite cookies and CSRF checks. New cloud account passwords differ from the old local accounts.

Private credentials are in `.local/Cloudflare-Care-50-Accounts.csv` and `.local/cloudflare-care-accounts.json`, outside the app bundle, public download and source repositories. Distribute each person only their assigned account. The hosting service receives password hashes as secret runtime values; plaintext passwords are never in the APK or website assets. No local patient database was migrated.

## Android 0.3.5 / code 8

- Package `in.itda.drishti`, same signer as the preceding APK. Install over the existing app; do not uninstall or clear app data.
- The built default is the public HTTPS website above. On upgrade, use **Use latest address → Test & connect** if the app asks to replace its saved old address. Sign in using a new cloud account.
- SHA-256: `a699b2395d95826421bd73a4b4660c5210b962fb12ac66f9de622bca3b86e835`.
- Build, lint, signature, version and embedded HTTPS address verified. Real handset installation is still a user check; no claim of successful handset receipt or a completed two-person video call is made.

## Cloud profile

Registration/history, image capture/upload, shared patient registry, medical review, referral, diagnostic/treatment/follow-up entries, district dashboard, English/Telugu UI and device offline capture are supported. Data persists in D1 across deployments. Individual cloud records are capped below D1 cell limits; use compressed photos/report images.

Consultation links are prepared directly in the cloud profile and use Jitsi; a prepared room link does not mean participants connected. The cloud UI labels this as Cloud automation. Python research inference and local n8n are not hosted in Workers. Paid Bolna calling remains disabled as requested. Unavailable services are not simulated as live results. This is for synthetic or authorized hackathon demonstration data, not a clinically validated cancer diagnosis service.

Source and deployment identity are retained in the separate `care-cloudflare` checkout and its `.openai/hosting.json`. It is intentionally excluded from the parent Git checkout to avoid accidentally committing a nested Git repository. Use the Sites workflow for updates. Keep D1 migrations immutable and append-only; do not recreate the database or regenerate passwords during redeployment.
