param([Parameter(Mandatory=$true)][string]$PythonCommand)
$ErrorActionPreference='Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)
& $PythonCommand -m venv .local/ai-venv
if ($LASTEXITCODE -ne 0) { throw 'Python 3.12 virtual environment failed.' }
& '.local/ai-venv/Scripts/python.exe' -m pip install 'torch==2.14.1+cpu' 'torchvision==0.29.1+cpu' 'pillow==12.3.0' --index-url https://download.pytorch.org/whl/cpu
if ($LASTEXITCODE -ne 0) { throw 'Local inference dependencies failed.' }
New-Item -ItemType Directory -Force .local/ai | Out-Null
$revision='45d1ff9aad923f7b9685e531a275ca454d3cc58f'
Invoke-WebRequest "https://huggingface.co/Al04ni/Umlomo/resolve/$revision/UmlomoV1.pth" -OutFile .local/ai/UmlomoV1.pth
if ((Get-FileHash .local/ai/UmlomoV1.pth -Algorithm SHA256).Hash -ne 'DBC1B9E513FF9BFFDF57B34978278A257BDA483D8FDC944B6E957C5C097CF6E6') { throw 'Model checksum mismatch. Do not use this file.' }
Invoke-WebRequest "https://huggingface.co/Al04ni/Umlomo/raw/$revision/README.md" -OutFile .local/ai/MODEL-CARD.md
& '.local/ai-venv/Scripts/python.exe' scripts/research-ai.py --check
if ($LASTEXITCODE -ne 0) { throw 'Model architecture check failed.' }
