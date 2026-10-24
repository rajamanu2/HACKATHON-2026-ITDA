$ErrorActionPreference='Stop'
$workspaceDirectory=Split-Path $PSScriptRoot -Parent
$receipt=Join-Path $workspaceDirectory '.local/lan-firewall-result.json'
try {
 $name='Drishti-Local-WiFi-4174'
 if (-not (Get-NetFirewallRule -Name $name -ErrorAction SilentlyContinue)) {
  New-NetFirewallRule -Name $name -DisplayName 'Aarogya Drishti same Wi-Fi care server' -Direction Inbound -Action Allow -Protocol TCP -LocalAddress 192.168.1.3 -LocalPort 4174 -RemoteAddress 192.168.1.0/24 -Profile Any -Program 'C:\Program Files\nodejs\node.exe' | Out-Null
 }
 @{ok=$true;localAddress='192.168.1.3';port=4174;remoteSubnet='192.168.1.0/24';at=(Get-Date).ToUniversalTime().ToString('o')} | ConvertTo-Json | Set-Content -LiteralPath $receipt -Encoding UTF8
} catch {
 @{ok=$false;error=$_.Exception.Message;at=(Get-Date).ToUniversalTime().ToString('o')} | ConvertTo-Json | Set-Content -LiteralPath $receipt -Encoding UTF8
 exit 1
}
