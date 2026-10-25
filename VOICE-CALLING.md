# Telugu and English phone intake

Implemented locally; paid calling is DISABLED at the user's request. No real calls were placed. A Bolna account, approved outbound caller/telephony setup, configured agents, provider credit and deployment are still required for live operation. Free VM hosting does not supply free telephone calls.

Flow: signed-in worker/doctor requests call with recorded patient contact permission → durable voice.requested event → authenticated n8n webhook → private app dispatch → Bolna voice agent calls the saved +91 mobile → n8n checks authenticated execution data every minute → confirmed answers automatically fill a separate voice intake form inside the same shared patient record. The app refreshes call status every 15 seconds while the record is open. Provider completion/extraction can take additional time after hangup.

Existing registration, history and doctor decisions are preserved. Phone intake fields are patient-reported, not clinically verified. Unconfirmed or incompatible results appear as needs_review and do not enter the confirmed patient intake form. The app does not store provider audio, full transcripts or recording URLs. Provider-side retention still needs account configuration. Calling requires connectivity; it does not execute offline or silently queue an offline button click.

## Connect when ready

1. In Bolna, configure approved outbound telephony and two dedicated agents using [VOICE-AGENT-PROMPT.md](n8n/VOICE-AGENT-PROMPT.md). Configure Telugu/English speech services, voices, permitted calling hours, 300-second timeout and no provider retries. Use the current Extractions category and field names in that file. Do not use deprecated extraction_prompt setup.
2. Keep API keys server-side. Set BOLNA_API_KEY, BOLNA_AGENT_TE and BOLNA_AGENT_EN in the private server environment (cloud/.env for Compose). VOICE_CALLING_ENABLED defaults false. VOICE_DAILY_LIMIT defaults 5 and is capped at 100; this limits requests, not a guaranteed currency spend cap. Configure provider-side duration/budget controls too. Do not enable until the owner approves calling costs and data processing.
3. Import and publish n8n/drishti-voice-intake.json, using the existing drishtiWebhookAuth and drishtiCallbackAuth credentials. Both already belong to the existing integration. App/n8n run together; private callbacks use 127.0.0.1:4173. Nothing requires making the n8n editor public.

```powershell
node scripts/local-n8n.mjs import:workflow --input=n8n/drishti-voice-intake.json
node scripts/local-n8n.mjs publish:workflow --id=drishtiVoiceIntake
```

For Compose, run these through the same app container/volume and private environment, following CLOUD-HOSTING.md. Restart n8n after CLI publishing if it is already running. The workflow uses the existing drishti-events base URL with path drishti-voice-intake; optional settings.n8nVoiceUrl overrides it. Provider secrets never go through workflow items, frontend, APK or Git.

4. Restart the app with the private configuration, then open a synced adult patient's record. Save a +91 mobile number during registration, select Telugu or English, record permission, and request a call. First use your own explicitly permitted test number and synthetic answers. Confirm actual handset ringing, language quality, readback and shared-record receipt before patient use.

## Delivery and recovery

- One patient call request per 24 hours; daily request cap; worker/doctor authentication and CSRF required.
- n8n retries events safely: an atomic app claim occurs BEFORE provider POST. An ambiguous network error becomes dispatch_uncertain and is never automatically redialed. Check provider history manually before any recovery. A crash during dispatch can remain dispatching; inspect it before changing anything.
- Polling reads only known execution IDs from the authenticated provider API; checks execution, agent and recipient identity. Public callback bodies cannot inject answers. Repeated completion checks cannot duplicate a saved intake.
- Only confirmed, bounded name/age/village/history are accepted; no arbitrary patient patching, stage changes or clinician-note overwrites. Category `Patient Intake` and legacy flat result objects are supported. Unknown/low-confidence or malformed fields require review.
- Nine automated tests currently cover the app and this integration with synthetic provider responses. Live provider setup, phone quality and actual billing are not tested by mocks.
- Local n8n import/publish and the authenticated webhook → private app dispatch → acknowledgement path passed with `node tests/voice-n8n.mjs`. Its temporary fixture is explicitly non-dialing and is removed after the test. Browser checks verified the disabled call panel; Android Java compilation passed. The installed/downloadable APK has not been replaced; rebuild it with the final reachable cloud address when hosting is ready.

Provider references: [Make call](https://www.bolna.ai/docs/api-reference/calls/make), [Retrieve execution](https://www.bolna.ai/docs/api-reference/executions/get_execution), [Extractions](https://www.bolna.ai/docs/prompting/using-extractions), [Telugu/English STT](https://www.bolna.ai/docs/sarvam-transcriber). Verify configuration against your account's current API payload before enabling calls.
