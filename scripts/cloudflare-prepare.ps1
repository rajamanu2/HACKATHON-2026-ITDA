param([Parameter(Mandatory=$true)][string]$Hostname, [string]$TunnelName='aarogya-drishti')
$ErrorActionPreference='Stop'
if ($Hostname -notmatch '^(?=.{1,253}$)([a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,63}$') { throw 'Provide the actual hostname, such as care.example.com.' }
Set-Location (Split-Path $PSScriptRoot -Parent)
$cloudflareDirectory = Join-Path (Get-Location).Path '.local\cloudflare'
New-Item -ItemType Directory -Path $cloudflareDirectory -Force | Out-Null
$cloudflared = Join-Path $cloudflareDirectory 'cloudflared.exe'
if (-not (Test-Path -LiteralPath $cloudflared)) {
  $release = Invoke-RestMethod -Uri 'https://api.github.com/repos/cloudflare/cloudflared/releases/latest'
  $asset = $release.assets | Where-Object { $_.name -eq 'cloudflared-windows-amd64.exe' } | Select-Object -First 1
  if (-not $asset -or -not $asset.digest -or $asset.digest -notlike 'sha256:*') { throw 'Official release digest unavailable. Verify the download manually before continuing.' }
  Invoke-WebRequest -Uri $asset.browser_download_url -OutFile $cloudflared
  $expected = $asset.digest.Substring(7).ToUpperInvariant()
  if ((Get-FileHash -LiteralPath $cloudflared -Algorithm SHA256).Hash -ne $expected) { Remove-Item -LiteralPath $cloudflared; throw 'Cloudflared digest mismatch.' }
}
$certificate = Join-Path $cloudflareDirectory 'cert.pem'
$credentials = Join-Path $cloudflareDirectory 'tunnel.json'
Write-Output 'Authorize your existing Cloudflare account in the browser and choose the domain you control.'
if (-not (Test-Path -LiteralPath $certificate)) {
  & $cloudflared tunnel --origincert $certificate login
  if ($LASTEXITCODE -ne 0) { throw 'Cloudflare account authorization did not complete.' }
}
$tunnelsJson = & $cloudflared tunnel --origincert $certificate list --output json
if ($LASTEXITCODE -ne 0) { throw 'Unable to inspect existing tunnels.' }
$tunnel = ($tunnelsJson | ConvertFrom-Json) | Where-Object { $_.name -eq $TunnelName } | Select-Object -First 1
if (-not $tunnel) {
  & $cloudflared tunnel --origincert $certificate --credentials-file $credentials create $TunnelName
  if ($LASTEXITCODE -ne 0) { throw 'Tunnel creation failed.' }
  $tunnelsJson = & $cloudflared tunnel --origincert $certificate list --output json
  $tunnel = ($tunnelsJson | ConvertFrom-Json) | Where-Object { $_.name -eq $TunnelName } | Select-Object -First 1
}
if (-not $tunnel -or -not (Test-Path -LiteralPath $credentials)) { throw 'Tunnel credentials are unavailable. Existing tunnels are not replaced; select a new name or provide the existing tunnel credentials privately.' }
$config = @{tunnel=$tunnel.id;'credentials-file'=$credentials;ingress=@(@{hostname=$Hostname;service='http://127.0.0.1:4173'},@{service='http_status:404'})}
$configPath = Join-Path $cloudflareDirectory 'config.json'
$config | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $configPath -Encoding ascii
& $cloudflared tunnel --origincert $certificate route dns $tunnel.id $Hostname
if ($LASTEXITCODE -ne 0) { throw 'DNS route was not created. Existing DNS records are not overwritten.' }
Write-Output ('Configured HTTPS hostname: https://' + $Hostname)
Write-Output 'Start the app with COOKIE_SECURE=true and TRUST_CLOUDFLARE=true, then run the saved tunnel configuration. Keep n8n private.'
Write-Output ('Tunnel command: & "' + $cloudflared + '" tunnel --config "' + $configPath + '" run')
