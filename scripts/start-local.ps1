$ErrorActionPreference = 'Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)
$workspacePath = (Get-Location).Path
$runtimeScript = Join-Path $workspacePath 'scripts\local-n8n.mjs'
if (-not (Test-Path -LiteralPath '.local/n8n-runtime/node_modules/n8n/bin/n8n')) {
  throw 'Run npm run install:n8n first.'
}
$nodePath = (Get-Command node).Source
Start-Process -FilePath $nodePath -ArgumentList ('"' + $runtimeScript + '"') -WorkingDirectory $workspacePath -WindowStyle Hidden -RedirectStandardOutput '.local/n8n.log' -RedirectStandardError '.local/n8n-error.log'
Write-Output 'n8n launcher started in the background. App: http://127.0.0.1:4173'
node server.mjs
