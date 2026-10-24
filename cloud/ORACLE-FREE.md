# Oracle Always Free: selected hosting route

Status: account connection and VM provisioning pending. This preserves the full Node + n8n + Python application; it is not the cloud-worker replacement. No paid service is authorized.

## Account and eligibility

Use your own [Oracle Cloud account](https://www.oracle.com/cloud/free/). Oracle may require identity/card verification and a temporary authorization hold during signup. Enter that only on Oracle's site; do not send card details, passwords or private keys through chat. Do not create duplicate accounts or upgrade to a paid plan to get capacity.

Oracle's [Always Free documentation](https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm) currently describes A1 ARM allowance equivalent to **2 OCPUs and 12 GB memory**, and **200 GB combined boot/block storage**, in the account's home region. Check remaining account allocations and the Console's actual Always Free eligibility before creating anything. Existing resources consume these allowances. Stop on a cost estimate above zero or unavailable free capacity; do not substitute a paid resource. Idle free instances may be reclaimed, so backups and actual availability remain necessary.

## VM selection to review before creating

- Home region of the account; use an Always Free-eligible Ubuntu ARM image.
- Shape `VM.Standard.A1.Flex`; a starting request of 1 OCPU / 6 GB RAM and a 50 GB boot volume must fit the account's remaining free allowance. Final settings depend on verified account inventory and capacity.
- Public IPv4 and a public subnet for HTTPS, with SSH limited to the operator's actual source address. Expose only web ports 80/443 publicly. Keep n8n private; no public 5678/4173 listeners.
- Use a securely held SSH key. Never commit it, paste it into chat, or put it in an APK.
- Review image licensing, storage, networking and the displayed cost before the final create action. This document does not provision a VM.

The pinned PyTorch/torchvision versions have official CPython 3.12 ARM CPU wheels. The GitHub container matrix additionally checks real ARM builds/runtime; wait for that result rather than treating package availability as compatibility proof.

## After a verified VM exists

1. Connect securely, install Docker/Compose using their official installation instructions, and clone the repository. Preserve existing host data; use a dedicated checkout for this project.
2. Assign a real HTTPS hostname to the VM's public IP. A Cloudflare account can manage DNS if the user supplies a real domain; Cloudflare Tunnel from the PC is not required for this route. Do not invent a domain or label a temporary tunnel permanent.
3. Use `cloud/compose.yaml` and the named persistent `care-data` volume as described in CLOUD-HOSTING.md. Caddy handles HTTPS. Stop if the persistent mount is missing; startup guards against an ephemeral database.
4. Complete owner setup and import/publish both n8n workflows through the private SSH-forwarded editor or controlled offline CLI commands. Verify actual receipts after startup, not only health.
5. Retrieve the generated cloud app accounts privately. The existing PC database and accounts stay untouched unless a separately reviewed migration is performed. Test with synthetic data first.
6. Run `scripts/prepare-cloud-android.ps1` with the actual permanent HTTPS origin, then include its APK in the deployment artifact and verify the hosted download hash and original signer. The old LAN APK is not a hosted release.
7. Verify the website and installed APK while the PC app and tunnels are stopped. Complete shared worker/doctor, offline sync, model inference and n8n/video-link checks. Confirm a physical two-device call separately.

Only after those checks should a permanent website/APK link be reported as live. The research model remains unvalidated for clinical decisions.
