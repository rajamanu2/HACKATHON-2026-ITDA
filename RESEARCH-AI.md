# Local research inference

The optional local model is [Al04ni/Umlomo](https://huggingface.co/Al04ni/Umlomo), revision `45d1ff9aad923f7b9685e531a275ca454d3cc58f`. Its model card identifies GPL-3.0, MobileNetV2, 224x224 RGB inputs and class order Normal / Oral Cancer. This model is intended for research and education. The publisher's metric claims are not independent clinical validation and are not shown as app accuracy.

Weights are downloaded separately to ignored `.local/ai`, not included in Git or the APK. Review the model's GPL-3.0 obligations before redistributing weights or a combined product. Preserve source, license notices and corresponding-source obligations as applicable. PyTorch/torchvision/Pillow have separate licenses in the private Python environment. No proprietary screening SDK is bundled.

Install on Windows with Python 3.12:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/install-research-ai.ps1 -PythonCommand C:/path/to/python.exe
```

The app finds `.local/ai-venv/Scripts/python.exe` automatically. `DRISHTI_AI_PYTHON` can select another local Python environment. Linux uses `.local/ai-venv/bin/python`; install the same dependencies and pinned weights there manually.

Every invocation verifies SHA-256 `dbc1b9e513ff9bffdf57b34978278a257bda483d8fdc944b6e957c5c097cf6e6`, loads weights with `weights_only=True`, and requires an exact two-class MobileNetV2 state dictionary. No model repository code, torch.hub or arbitrary pickle is executed. Images travel from the authenticated app to its care server and a local Python subprocess over stdin; they are not sent to Hugging Face or an external AI API. The public app still uses the Cloudflare tunnel for phone-to-server transport.

Open an uploaded adult synthetic/authorized research record as a doctor. A live model check must pass. Explicitly acknowledge research use, then choose Run local research AI. The model-card class is stored with model revision, weight hash, image hash, timestamp and requesting user. No confidence percentage, lesion localization, automatic referral or treatment is fabricated. All classes require clinical review; Normal does not rule out disease. Research output never advances the care stage.

AI requires a server connection. Offline intake, photos and queued record upload remain available; inference does not run on the phone. A missing model or failed image produces an unavailable/error state, never a fallback prediction. A concurrent record update discards the stale inference result. One inference runs at a time to bound CPU load.

For a clinical integration, [BerryCare's Atom360-Proton SDK](https://www.berry.care/instructions-for-use.html) offers embedding via vendor access (`discover@atom360.ai`). IISc/TANUH is another organizer-relevant route. Neither SDK/API access nor deployment-specific clinical validation is available in this project. Do not label this research integration a validated clinical screening service. Keep hackathon use synthetic or explicitly authorized demonstration data, as required by the supplied poster.
