param([string]$SdkDirectory = "$env:LOCALAPPDATA\Android\Sdk", [string]$GradleCommand = '')
$ErrorActionPreference = 'Stop'
$workspaceDirectory = Split-Path $PSScriptRoot -Parent
Set-Location $workspaceDirectory
if (-not (Test-Path -LiteralPath (Join-Path $SdkDirectory 'platforms/android-35/android.jar'))) { throw 'Android SDK platform 35 is required.' }
if (-not $GradleCommand) {
  $gradleMatch = Get-ChildItem -LiteralPath "$env:USERPROFILE\.gradle\wrapper" -Recurse -Filter gradle.bat -ErrorAction SilentlyContinue | Where-Object { $_.FullName -match 'gradle-8\.14\.3' } | Select-Object -First 1
  if ($gradleMatch) { $GradleCommand = $gradleMatch.FullName } else { $GradleCommand = 'gradle' }
}
$sdkProperty = 'sdk.dir=' + $SdkDirectory.Replace('\','/')
Set-Content -LiteralPath 'android/local.properties' -Value $sdkProperty -Encoding ascii
& $GradleCommand -p android --no-daemon assembleDebug lintDebug
if ($LASTEXITCODE -ne 0) { throw 'Android build failed.' }
New-Item -ItemType Directory -Path 'dist/android' -Force | Out-Null
Copy-Item -LiteralPath 'android/app/build/outputs/apk/debug/app-debug.apk' -Destination 'dist/android/Aarogya-Drishti-0.3.1-debug.apk' -Force
Get-FileHash -LiteralPath 'dist/android/Aarogya-Drishti-0.3.1-debug.apk' -Algorithm SHA256 | Select-Object Hash,Path
