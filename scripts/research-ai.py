"""Local-only research inference. Never execute model repository code or unsafe pickle."""
import base64
import hashlib
import io
import json
from pathlib import Path
import sys
import warnings

ROOT = Path(__file__).resolve().parent.parent
WEIGHTS = ROOT / '.local/ai/UmlomoV1.pth'
SHA = 'dbc1b9e513ff9bffdf57b34978278a257bda483d8fdc944b6e957c5c097cf6e6'
REVISION = '45d1ff9aad923f7b9685e531a275ca454d3cc58f'

def main():
    import torch
    from torchvision import models, transforms
    from PIL import Image, ImageOps
    torch.set_num_threads(2)
    if hashlib.sha256(WEIGHTS.read_bytes()).hexdigest() != SHA:
        raise ValueError('Model checksum mismatch')
    state = torch.load(WEIGHTS, map_location='cpu', weights_only=True)
    model = models.mobilenet_v2(weights=None)
    # Only the documented two-class MobileNetV2 is supported; reject other heads.
    model.classifier[1] = torch.nn.Linear(model.last_channel, 2)
    model.load_state_dict(state, strict=True)
    model.eval()
    metadata = {'model': 'Al04ni/Umlomo', 'revision': REVISION, 'sha256': SHA,
                'researchOnly': True, 'clinicallyValidated': False, 'license': 'GPL-3.0'}
    if '--check' in sys.argv:
        print(json.dumps({'available': True, **metadata}))
        return
    data = json.loads(sys.stdin.read(3_000_001))
    photo = data['photo']
    raw = base64.b64decode(photo.split(',', 1)[1], validate=True)
    Image.MAX_IMAGE_PIXELS = 16_000_000
    warnings.simplefilter('error', Image.DecompressionBombWarning)
    with Image.open(io.BytesIO(raw)) as source:
        if source.width < 224 or source.height < 224:
            raise ValueError('Image too small')
        image = ImageOps.exif_transpose(source).convert('RGB')
        transform = transforms.Compose([transforms.Resize((224, 224)), transforms.ToTensor(),
            transforms.Normalize([.485, .456, .406], [.229, .224, .225])])
        with torch.inference_mode():
            output = model(transform(image).unsqueeze(0))
            if output.shape != (1, 2) or not torch.isfinite(output).all():
                raise ValueError('Invalid model output')
            index = int(output.argmax(dim=1).item())
    # These are model-card class labels, never a clinical diagnosis or probability.
    print(json.dumps({**metadata, 'modelClass': ['Normal', 'Oral Cancer'][index],
                      'imageSha256': hashlib.sha256(raw).hexdigest()}))

if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        print(json.dumps({'error': type(error).__name__}), file=sys.stderr)
        sys.exit(1)
