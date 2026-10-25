# Android update 0.3.3 (code 6)

[Download Aarogya Drishti 0.3.3](https://github.com/rajamanu2/HACKATHON-2026-ITDA/raw/refs/heads/main/downloads/Aarogya-Drishti-0.3.3.apk)

- 612,020 bytes (about 598 KiB), increased from the prior 100,733-byte APK through bundled Telugu/English fonts, licenses, phone-intake interface and offline guide.
- SHA-256: `b831b38110f9ec5f183c6c513b3db05a11a769956599b92900842215f9495a78`.
- Existing package identity and signing certificate retained. Install as an update; do not uninstall or clear data.
- The app contains the phone-intake screen, n8n request/status API integration and a bundled Telugu/English guide. Paid calling remains disabled until Bolna agents, credentials and calling-budget approval are configured.
- APK hosting on GitHub is independent of the PC. The shared care backend is NOT permanently hosted yet. This build retains the current configurable LAN server default (`http://192.168.1.3:4174`); the phone previously could not reach it. Downloading this APK does not solve that server connectivity issue. Connect a verified reachable care-server address when cloud hosting is ready. Existing offline queues and accounts should be preserved before changing server instances.
- Build and Android lint passed; signature matches the previous APK. Browser checks passed with offline fonts. Real handset installation and actual phone calls remain unverified.

Open font sources and licenses are included under public/fonts. Fonts are from the official google/fonts repository: Noto Sans Telugu and Outfit, licensed under SIL Open Font License 1.1. No passwords, signing keys, provider keys, database files, patient photographs or voice recordings are included in this APK.
