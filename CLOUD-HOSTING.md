# Permanent website and Android hosting

Prepared deployment package; **not deployed**. No cloud account, paid server, domain, DNS record, cloud database or replacement APK has been created by this package. The current live app still depends on the local PC. Docker is unavailable on this authoring machine, so the container build/runtime is not yet verified.

## What runs remotely

The root Dockerfile packages Node 24, Python 3.12, pinned CPU PyTorch/torchvision and n8n 2.44.6. The existing API, UI, SQLite records, offline sync and n8n workflows are retained. `cloud/start.mjs` generates private integration configuration on the persistent volume, starts n8n and the app, and stops/restarts the service if either child exits. Model weights are fetched separately into private persistent storage with the pinned checksum; no local data or credentials enter the image.

Attach a persistent volume at **`/app/.local`**. Linux startup refuses to run without this separate mount. It contains SQLite/WAL, generated account credentials, n8n's database, encryption key and workflow credentials, and the research model. Back up the complete volume securely; never delete it during a redeploy. Do not copy the author's `.local` into a public build context. Importing existing local accounts/data is a separate, target-specific migration requiring verified backup/restore.

Use one app instance with SQLite. Horizontal replicas need a database migration and shared-session strategy first. Size RAM for Node, the Python model and n8n running together; 4 GB is a reasonable starting configuration to validate, not a load-test result. The model remains research-only; hosting does not establish clinical validation.

## Railway route

1. Sign in to your own Railway account and connect `rajamanu2/HACKATHON-2026-ITDA`. No account password or API token should be pasted into chat.
2. Deploy the root Dockerfile. `railway.json` sets the startup and health endpoint. Before starting, attach a persistent volume at `/app/.local` and confirm sufficient memory.
3. Set `DATA_DIR=/app/.local`, `COOKIE_SECURE=true`; retain the Python/n8n environment defaults in the Dockerfile. Generate the service's public HTTPS domain and expose only the app port (`PORT`, supplied by Railway). Do not expose n8n's 5678 as a public service.
4. Complete the private n8n setup and workflow import below through the provider's authenticated shell. Check an actual callback; health alone is not workflow readiness.
5. Build the Android update for the returned permanent HTTPS origin, add its verified artifact to `cloud/releases/Aarogya-Drishti-cloud.apk`, and redeploy that artifact with the image. The placeholder folder contains no APK today. Confirm both website and APK work while the PC app/tunnels are stopped.

Railway's subscription and resource usage are billed separately; see [official pricing](https://docs.railway.com/pricing) and [volumes](https://docs.railway.com/volumes/reference). Do not enable paid hosting until the account owner accepts the plan and resource budget. No fixed total is promised.

## Existing Linux VPS route

Requires your own Linux server with Docker Compose, a domain's DNS pointing to it, and inbound HTTPS/HTTP for Caddy's certificate issuance. No server credentials are included.

```sh
cp cloud/.env.example cloud/.env
# Set PUBLIC_DOMAIN to the actual domain, then build/deploy:
docker compose --env-file cloud/.env -f cloud/compose.yaml up -d --build
```

Only Caddy exposes public 80/443. n8n's editor is bound to the host loopback port 5678 for an authenticated SSH tunnel. Example from the operator's computer: `ssh -L 5678:127.0.0.1:5678 user@your-server`. Open localhost:5678 to set up the owner; generated owner details remain in the server's private `.local/n8n-owner.json`. App account details remain in `.local/demo-accounts.json`. Do not print either file into public build logs or recordings.

## First n8n setup

The supervisor configures the webhook/callback credentials but does not claim workflows are imported or activated. Finish owner setup privately. Stop the app container before offline imports to avoid conflicting workflow versions; run these commands in one-off containers sharing its data volume:

```sh
docker compose --env-file cloud/.env -f cloud/compose.yaml stop app
docker compose --env-file cloud/.env -f cloud/compose.yaml run --rm app node scripts/local-n8n.mjs import:credentials --input=.local/n8n-credentials.json
docker compose --env-file cloud/.env -f cloud/compose.yaml run --rm app node scripts/local-n8n.mjs import:workflow --input=n8n/drishti-events.json
docker compose --env-file cloud/.env -f cloud/compose.yaml run --rm app node scripts/local-n8n.mjs import:workflow --input=n8n/drishti-consultations.json
docker compose --env-file cloud/.env -f cloud/compose.yaml run --rm app node scripts/local-n8n.mjs publish:workflow --id=drishtiLocalEvents
docker compose --env-file cloud/.env -f cloud/compose.yaml run --rm app node scripts/local-n8n.mjs publish:workflow --id=drishtiVideoConsultations
docker compose --env-file cloud/.env -f cloud/compose.yaml up -d app
```

For Railway, use its authenticated service shell and a controlled maintenance window to perform equivalent imports/publishing, then restart the service. Never expose the n8n editor to bypass setup. See [n8n's backup guidance](https://docs.n8n.io/deploy/host-n8n/keep-n8n-running/backup-and-restore); database and encryption key must be preserved together.

## Android finalization

The APK must contain the permanent origin, not `192.168.*`, an emulator address or `trycloudflare.com`. Once that origin is assigned, set ignored `.local/android-server.json` to `{"url":"https://actual-host.example"}` and build a higher-version same-signer update. Do not uninstall or clear app data. Changing server instances does not migrate existing pending captures automatically; inspect account-scoped queues before switching.

Use the existing build helper, verify its certificate against the installed version, copy the resulting APK to `cloud/releases/Aarogya-Drishti-cloud.apk` for the deployment build, and verify SHA-256 against the public `/downloads/android` response. `ANDROID_APK_PATH` selects that fixed server-side file; visitors cannot choose filesystem paths. Do not label an old LAN APK a hosted release.

## Required go-live evidence

- Independent public HTTPS health and expected instance ID, without a PC tunnel.
- Worker/doctor sign-in, shared synthetic record, offline capture/reconnect, clinician review and conflict handling.
- Actual cloud n8n receipt and consultation callback; test a physical two-device call separately.
- Actual cloud research inference and accurate unavailable/error states; no clinical accuracy claim.
- Hosted APK hash, expected permanent origin, original signing certificate and real handset acceptance.
- Restart/redeploy preserves account/record history; backup and restore are tested.

Until these pass, status is **deployment prepared, hosting/account connection required**. No production-ready or always-on claim follows merely from a Dockerfile.
