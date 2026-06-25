param(
    [string]$CacheDir = $env:OSRS_CACHE_DIR,
    [string]$Config = "config/assets.json"
)

$ErrorActionPreference = "Stop"
$Root = $PSScriptRoot
Set-Location $Root

if (-not $CacheDir) {
    Write-Error "Cache directory required. Pass -CacheDir <path> or set OSRS_CACHE_DIR."
}

$Gradle = if (Test-Path "$Root\gradlew.bat") { "$Root\gradlew.bat" } else { "gradle" }

if (-not (Test-Path "$Root\vendor\cache.jar")) {
    Write-Host "vendor/cache.jar not found - running setup.ps1 ..."
    & "$Root\setup.ps1"
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

Write-Host "Building asset-dumper..."
& $Gradle shadowJar
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$Jar = "$Root\build\libs\asset-dumper.jar"
if (-not (Test-Path $Jar)) {
    Write-Error "Build failed: $Jar not found"
}

Write-Host "Dumping assets from $CacheDir ..."
java -jar $Jar --cache $CacheDir --config $Config
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

if (Get-Command python -ErrorAction SilentlyContinue) {
    Write-Host "Updating graphicObjectIdMap.ts ..."
    python "$Root\update-graphic-object-map.py"
}

Write-Host "Done."
