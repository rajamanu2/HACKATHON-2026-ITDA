$ErrorActionPreference='Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)
$cloudflareDirectory = Join-Path (Get-Location).Path '.local\cloudflare'
New-Item -ItemType Directory -Path $cloudflareDirectory -Force | Out-Null
$cloudflared = Join-Path $cloudflareDirectory 'cloudflared.exe'
if (-not (Test-Path -LiteralPath $cloudflared)) {
  $release = Invoke-RestMethod -Uri 'https://api.github.com/repos/cloudflare/cloudflared/releases/latest'
  $asset = $release.assets | Where-Object { $_.name -eq 'cloudflared-windows-amd64.exe' } | Select-Object -First 1
  if (-not $asset -or -not $asset.digest -or $asset.digest -notlike 'sha256:*') { throw 'Official release digest unavailable.' }
  Invoke-WebRequest -Uri $asset.browser_download_url -OutFile $cloudflared
  if ((Get-FileHash -LiteralPath $cloudflared -Algorithm SHA256).Hash -ne $asset.digest.Substring(7).ToUpperInvariant()) { Remove-Item -LiteralPath $cloudflared; throw 'Cloudflared digest mismatch.' }
}
& $cloudflared --version
