param([Parameter(Mandatory=$true)][string]$ServerUrl,[string]$SdkDirectory="$env:LOCALAPPDATA\Android\Sdk",[string]$GradleCommand='',[int]$VersionCode=8,[string]$VersionName='0.3.5',[string]$WebDirectory='')
$ErrorActionPreference='Stop'
$workspaceDirectory=Split-Path $PSScriptRoot -Parent
Set-Location $workspaceDirectory
$address=[Uri]$ServerUrl
if ($address.Scheme -ne 'https' -or -not $address.Host -or $address.UserInfo -or $address.Query -or $address.Fragment -or $address.AbsolutePath -ne '/' -or $address.Host.EndsWith('.trycloudflare.com') -or $address.Host.EndsWith('.lhr.life')) { throw 'Use the permanent public HTTPS origin, without a path or temporary tunnel.' }
if ($VersionCode -lt 5) { throw 'Cloud APK must be a higher-version update.' }
$origin=$address.GetLeftPart([System.UriPartial]::Authority)
New-Item -ItemType Directory -Force .local | Out-Null
@{url=$origin;mode='cloud'} | ConvertTo-Json | Set-Content -LiteralPath .local/android-server.json -Encoding ascii
& "$PSScriptRoot/build-android.ps1" -SdkDirectory $SdkDirectory -GradleCommand $GradleCommand -VersionCode $VersionCode -VersionName $VersionName -WebDirectory $WebDirectory
New-Item -ItemType Directory -Force cloud/releases | Out-Null
Copy-Item -LiteralPath "dist/android/Aarogya-Drishti-$VersionName-debug.apk" -Destination cloud/releases/Aarogya-Drishti-cloud.apk -Force
Get-FileHash -LiteralPath cloud/releases/Aarogya-Drishti-cloud.apk -Algorithm SHA256 | Select-Object Hash,Path
