param([string]$LanAddress='192.168.1.3')
$ErrorActionPreference='Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)
if (-not (Get-NetIPAddress -AddressFamily IPv4 -IPAddress $LanAddress -ErrorAction SilentlyContinue)) { throw 'The configured Wi-Fi address is not assigned to this PC. Check its current private IP.' }
$env:LAN_HOST=$LanAddress
$env:LAN_PORT='4174'
$env:TRUST_CLOUDFLARE='true'
node server.mjs
