# Android app - Aarogya Drishti 0.3.0

The Android app packages the glass interface and offline intake workflow inside an Android application, with native camera/gallery capture, native speech intent, haptic feedback, a server connection dialog and an in-app video consultation activity. It is a hybrid application, not a Jetpack Compose implementation or a shortcut that only opens a hosted website.

## Build and package

```powershell
npm run build:android
```

Requires JDK 17 or newer, Android SDK platform 35/build tools and Gradle compatible with Android Gradle Plugin 8.9.2. The helper can use an installed Gradle 8.14.3 distribution. For other paths, use the script's `SdkDirectory` and `GradleCommand` parameters. Android Studio can also open the `android` project.

Output: `dist/android/Aarogya-Drishti-0.3.0-debug.apk`. This is a debug-signed demonstration build, not a Play Store release. The signature is handled by the standard Android debug build; no release signing key is included in the project. Generated assets, local SDK paths, build directories and APKs are excluded from Git.

The web login page includes a **Download Android app** link when the local server has a built package. The APK contains UI files only. It does not contain patient records, passwords, n8n credentials or Cloudflare certificates.

## Connect to shared records

Open the APK and choose **Connect care server** on the login screen. This build defaults to the current temporary HTTPS Cloudflare test address. You can enter another reachable HTTPS app address when the test link changes. No Cloudflare account was linked for this temporary tunnel. `127.0.0.1` on a handset is the handset itself, not this PC.

The debug build also permits explicit private-network HTTP endpoints. Android emulators can use `http://10.0.2.2:4173`. A real handset needs a reachable server address; the default server is bound to PC loopback, so prefer the HTTPS Cloudflare address. Release-mode configuration requires HTTPS.

Native API calls are restricted to this app's routes and configured server. Session cookies are encrypted with an Android Keystore key. The web UI cannot read the session cookie. App pages are bundled under a fixed local HTTPS origin; arbitrary web pages cannot access the native bridge. Server-side login, CSRF, role permissions and version checks still apply.

## Saathi conversational registration

Open **Register with Saathi** or **Open intake assistant**. Saathi asks for name, age, village, optional phone, symptoms, duration and tobacco history in English or Telugu. Validated answers fill the registration fields. Replies can be edited; unfinished conversation drafts survive reload in the current session.

The assistant is an offline guided intake state machine, not a medical language model. It does not diagnose, invent answers, check consent automatically, submit the form or create a patient until the worker explicitly saves. Voice results are placed in the answer box for review before sending. Speech availability and offline speech support depend on the installed Android recognizer; the offline preference does not guarantee that every provider works without network access.

Patient drafts/records use the existing account-specific IndexedDB cache. Camera images are resized/re-encoded by the app before saving. The native API session is encrypted, but patient browser caches and raw camera cache files are not application-encrypted; use synthetic data only. Camera cache files older than a day are removed on app startup.

## Video consultation

The doctor opens a shared patient and schedules a consultation. The server commits an appointment and `consultation.requested` event. The local n8n workflow `n8n/drishti-consultations.json` prepares a unique Jitsi link and calls the app back with a separate authentication credential. Only after that callback does the appointment show a Join button. Workers and doctors see it in the same patient record.

Android opens the room in a separate in-app activity. That activity has no patient-data JavaScript bridge. Camera and microphone follow Android runtime permissions. Browsers open a video dialog. The demo provider is public Jitsi Meet; host authentication may be required. Scheduling, link preparation and a ready status do not prove a two-person video/audio connection, and public Jitsi has not been approved here for clinical patient data.

## Verification boundaries

Verified: Android debug compilation, compatibility lint and package signature, browser UI, offline Telugu chat-to-form flow, explicit consent, shared worker/doctor records, rejected stale reviews, role-protected bulk provisioning and a real local n8n consultation callback.

Not verified on a real handset: camera capture, recognition provider, microphone/video permissions, in-app media connection or two-person call quality. No test application was installed on an unrelated phone or existing emulator. A temporary HTTPS link and anonymous APK download were verified. Account-backed custom-domain activation still needs the actual domain and account authorization. Public credential-based login verification was blocked by automatic approval review; local worker/doctor authentication passed.
