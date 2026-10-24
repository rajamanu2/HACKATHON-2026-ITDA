# Cloudflare deployment and team access

A temporary account-less HTTPS Quick Tunnel was created at the user's request. The live URL is stored in `.local/cloudflare/quick-tunnel.json`. Anonymous HTML/health and APK download were verified, and anonymous patient access returned 401. Public login testing was not performed: automatic approval review rejected transmitting local account passwords and records through the external tunnel. No Cloudflare account was linked and no custom DNS record was changed.

The test link works while this PC, app server and tunnel process are running. It can change when restarted. It is not a production or mass-load deployment. See [Cloudflare's Quick Tunnel documentation](https://developers.cloudflare.com/tunnel/get-started/quick-tunnels/).

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/cloudflare-download.ps1
node scripts/cloudflare-quick.mjs
```

The Android build helper includes the current temporary HTTPS URL as its default server when the local quick-tunnel JSON exists. Users can change the address in Connect care server. An account-backed permanent hostname still needs the full domain and browser authorization.

The prepared deployment uses a Cloudflare Tunnel to the existing authenticated app at `127.0.0.1:4173`. SQLite and n8n remain on the host. This provides a reachable HTTPS address for Android and browsers; it does not migrate the backend to Workers/D1 or prove high-volume production capacity.

## Connect the existing account

Choose a new app subdomain on a domain you control, for example `care.example.com`. Do not overwrite an existing production site.

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/cloudflare-prepare.ps1 -Hostname care.example.com
```

The helper downloads the official Cloudflare Windows binary, checks its release SHA-256 digest, opens account authorization, creates an isolated named tunnel, and routes the selected hostname. Local credentials remain in `.local/cloudflare`, outside Git and static assets. Existing DNS records are not overwritten. If the account's existing tunnel credentials are missing, the script stops rather than replacing the tunnel.

Before exposing the app, restart its server with:

```powershell
$env:COOKIE_SECURE='true'
$env:TRUST_CLOUDFLARE='true'
npm start
```

Then run the tunnel command printed by the helper. Keep the origin bound to loopback, and expose only the app. Do not publish n8n, private files, or the SQLite database. Put the resulting HTTPS address into the Android app's **Connect care server** dialog. With TRUST_CLOUDFLARE=true, trusted loopback proxy requests marked HTTPS receive Secure session cookies. Setting COOKIE_SECURE=true forces Secure cookies on every login and then requires HTTPS for browser sessions.

## Bulk onboarding

Sign into the app's administrator account and open **Care team**. Paste `email,name,worker` or `email,name,doctor`, one row per account (up to 100). New passwords are generated, stored as hashes, and returned once for secure download. No invitation messages are sent automatically. Each person signs in with their own account; browser sessions and offline caches remain separate.

The login limiter now separates account/IP buckets, so unrelated workers sharing a network do not consume the same ten-attempt allowance. Trusted Cloudflare client addresses are accepted only when explicitly enabled and the direct connection comes from loopback. Password hashing runs asynchronously. Capacity/load testing, facility scopes, password reset, MFA, managed encrypted device storage, and operational monitoring are still needed before a clinical rollout.

Cloudflare Turnstile/Access can be added with the organization's settings; neither is silently claimed as configured here. Cloudflare does not replace the application's worker/doctor authorization.
