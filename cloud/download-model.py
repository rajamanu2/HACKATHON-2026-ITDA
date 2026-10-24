"""Download the optional research weights privately at runtime; never bundle credentials."""
import hashlib
from pathlib import Path
import urllib.request

root = Path('.local/ai')
root.mkdir(parents=True, exist_ok=True)
target = root / 'UmlomoV1.pth'
expected = 'dbc1b9e513ff9bffdf57b34978278a257bda483d8fdc944b6e957c5c097cf6e6'
revision = '45d1ff9aad923f7b9685e531a275ca454d3cc58f'
if target.exists() and hashlib.sha256(target.read_bytes()).hexdigest() != expected:
    raise RuntimeError('Existing model checksum mismatch; refusing to overwrite it.')
if not target.exists():
    temporary = root / 'UmlomoV1.download'
    with urllib.request.urlopen(f'https://huggingface.co/Al04ni/Umlomo/resolve/{revision}/UmlomoV1.pth', timeout=45) as response:
        data = response.read(10_000_001)
    if len(data) > 10_000_000 or hashlib.sha256(data).hexdigest() != expected:
        raise RuntimeError('Downloaded model checksum mismatch.')
    temporary.write_bytes(data)
    temporary.replace(target)
if not (root / 'MODEL-CARD.md').exists():
    with urllib.request.urlopen(f'https://huggingface.co/Al04ni/Umlomo/raw/{revision}/README.md', timeout=30) as response:
        card = response.read(100_001)
    if len(card) > 100_000:
        raise RuntimeError('Invalid model-card size.')
    (root / 'MODEL-CARD.md').write_bytes(card)
print('Pinned research model is present; clinical validation is not established.')
