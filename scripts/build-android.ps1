param([string]$SdkDirectory = "$env:LOCALAPPDATA\Android\Sdk", [string]$GradleCommand = '', [int]$VersionCode=7, [string]$VersionName='0.3.4', [string]$WebDirectory='')
$ErrorActionPreference = 'Stop'
if ($VersionCode -lt 4 -or $VersionName -notmatch '^\d+\.\d+\.\d+$') { throw 'Invalid APK version.' }
$workspaceDirectory = Split-Path $PSScriptRoot -Parent
Set-Location $workspaceDirectory
if (-not (Test-Path -LiteralPath (Join-Path $SdkDirectory 'platforms/android-35/android.jar'))) { throw 'Android SDK platform 35 is required.' }
if (-not $GradleCommand) {
  $gradleMatch = Get-ChildItem -LiteralPath "$env:USERPROFILE\.gradle\wrapper" -Recurse -Filter gradle.bat -ErrorAction SilentlyContinue | Where-Object { $_.FullName -match 'gradle-8\.14\.3' } | Select-Object -First 1
  if ($gradleMatch) { $GradleCommand = $gradleMatch.FullName } else { $GradleCommand = 'gradle' }
}
$sdkProperty = 'sdk.dir=' + $SdkDirectory.Replace('\','/')
Set-Content -LiteralPath 'android/local.properties' -Value $sdkProperty -Encoding ascii
$buildArguments=@("-p","android","--no-daemon","-PcareVersionCode=$VersionCode","-PcareVersionName=$VersionName")
if ($WebDirectory) { $buildArguments += "-PcareWebDirectory=$WebDirectory" }
$buildArguments += @("assembleDebug","lintDebug")
& $GradleCommand @buildArguments
if ($LASTEXITCODE -ne 0) { throw 'Android build failed.' }
New-Item -ItemType Directory -Path 'dist/android' -Force | Out-Null
$apkOutput=Join-Path $workspaceDirectory "dist/android/Aarogya-Drishti-$VersionName-debug.apk"
Copy-Item -LiteralPath 'android/app/build/outputs/apk/debug/app-debug.apk' -Destination $apkOutput -Force
Get-FileHash -LiteralPath $apkOutput -Algorithm SHA256 | Select-Object Hash,Path
