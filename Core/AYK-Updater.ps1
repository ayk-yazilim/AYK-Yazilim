param(
    [Parameter(Mandatory = $true)]
    [string]$AppDir
)

$ErrorActionPreference = 'Stop'
$repoApi = 'https://api.github.com/repos/ayk-yazilim/AYK-Yazilim/releases/latest'
$iniPath = Join-Path $AppDir 'update.ini'
$logDir = Join-Path $AppDir 'Logs'
$logPath = Join-Path $logDir 'updater.log'
$appPath = Join-Path $AppDir 'AYK-Muhasebe-Yardimcisi.hta'

function Write-UpdateLog([string]$Message) {
    try {
        if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir -Force | Out-Null }
        Add-Content -LiteralPath $logPath -Value ("{0} | {1}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $Message) -Encoding UTF8
    } catch { }
}

function Get-LocalVersion {
    if (-not (Test-Path $iniPath)) { return [version]'0.0.0' }
    $line = Get-Content -LiteralPath $iniPath | Where-Object { $_ -match '^version\s*=' } | Select-Object -First 1
    if (-not $line) { return [version]'0.0.0' }
    $text = (($line -split '=', 2)[1]).Trim().TrimStart('v','V')
    try { return [version]$text } catch { return [version]'0.0.0' }
}

function Show-Question([string]$Text, [string]$Title) {
    Add-Type -AssemblyName System.Windows.Forms
    return [System.Windows.Forms.MessageBox]::Show(
        $Text,
        $Title,
        [System.Windows.Forms.MessageBoxButtons]::YesNo,
        [System.Windows.Forms.MessageBoxIcon]::Information
    )
}

function Show-Error([string]$Text) {
    Add-Type -AssemblyName System.Windows.Forms
    [void][System.Windows.Forms.MessageBox]::Show(
        $Text,
        'AYK Güncelleme',
        [System.Windows.Forms.MessageBoxButtons]::OK,
        [System.Windows.Forms.MessageBoxIcon]::Warning
    )
}

try {
    $localVersion = Get-LocalVersion
    Write-UpdateLog "Kontrol basladi. Yerel surum: $localVersion"

    $headers = @{
        'User-Agent' = 'AYK-Muhasebe-Yardimcisi-Updater'
        'Accept' = 'application/vnd.github+json'
    }
    $release = Invoke-RestMethod -Uri $repoApi -Headers $headers -UseBasicParsing -TimeoutSec 12
    $tagText = ([string]$release.tag_name).Trim().TrimStart('v','V')
    $remoteVersion = [version]$tagText

    if ($remoteVersion -le $localVersion) {
        Write-UpdateLog "Guncel. GitHub surumu: $remoteVersion"
        exit 0
    }

    $asset = $release.assets | Where-Object { $_.name -eq 'AYK-Muhasebe-Yardimcisi-Guncelleme.zip' } | Select-Object -First 1
    if (-not $asset) {
        $asset = $release.assets | Where-Object { $_.name -like '*.zip' } | Select-Object -First 1
    }
    if (-not $asset) {
        Write-UpdateLog "Yeni surum var ancak ZIP asset bulunamadi."
        Show-Error "V$remoteVersion bulundu ancak Release içine güncelleme ZIP'i eklenmemiş."
        exit 0
    }

    $notes = [string]$release.body
    if ([string]::IsNullOrWhiteSpace($notes)) { $notes = 'Yeni özellikler ve iyileştirmeler içeriyor.' }
    if ($notes.Length -gt 900) { $notes = $notes.Substring(0,900) + '...' }

    $answer = Show-Question ("Yeni sürüm bulundu!`r`n`r`nMevcut: V$localVersion`r`nYeni: V$remoteVersion`r`n`r`n$notes`r`n`r`nŞimdi indirip kurulsun mu?") 'AYK Muhasebe Yardımcısı'
    if ($answer -ne [System.Windows.Forms.DialogResult]::Yes) {
        Write-UpdateLog "Kullanici guncellemeyi erteledi."
        exit 0
    }

    $tempRoot = Join-Path $env:TEMP ("AYK-Update-" + [guid]::NewGuid().ToString('N'))
    $zipPath = Join-Path $tempRoot 'update.zip'
    $extractPath = Join-Path $tempRoot 'extract'
    New-Item -ItemType Directory -Path $extractPath -Force | Out-Null

    Write-UpdateLog "Indiriliyor: $($asset.browser_download_url)"
    Invoke-WebRequest -Uri $asset.browser_download_url -Headers $headers -UseBasicParsing -OutFile $zipPath -TimeoutSec 120
    Expand-Archive -LiteralPath $zipPath -DestinationPath $extractPath -Force

    $sourceRoot = $extractPath
    $topItems = @(Get-ChildItem -LiteralPath $extractPath -Force)
    if ($topItems.Count -eq 1 -and $topItems[0].PSIsContainer) {
        $sourceRoot = $topItems[0].FullName
    }

    $files = Get-ChildItem -LiteralPath $sourceRoot -Recurse -File -Force
    foreach ($file in $files) {
        $relative = $file.FullName.Substring($sourceRoot.Length).TrimStart('\')
        if ($relative -like 'Logs\*' -or $relative -like 'Backup\*') { continue }
        $target = Join-Path $AppDir $relative
        $targetDir = Split-Path -Parent $target
        if (-not (Test-Path $targetDir)) { New-Item -ItemType Directory -Path $targetDir -Force | Out-Null }
        Copy-Item -LiteralPath $file.FullName -Destination $target -Force
    }

    Write-UpdateLog "Guncelleme tamamlandi: V$remoteVersion"
    Remove-Item -LiteralPath $tempRoot -Recurse -Force -ErrorAction SilentlyContinue
    Start-Process -FilePath 'mshta.exe' -ArgumentList ('"' + $appPath + '"')
    exit 10
}
catch {
    Write-UpdateLog ("Kontrol atlandi: " + $_.Exception.Message)
    exit 0
}
