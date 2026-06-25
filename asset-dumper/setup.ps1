param(
    [string]$RuneLiteHome = $env:RUNELITE_HOME
)

$ErrorActionPreference = "Stop"
$Root = $PSScriptRoot
$VendorJar = "$Root\vendor\cache.jar"

if (-not $RuneLiteHome) {
    $default = "C:\Users\Eric\IdeaProjects\runelite"
    if (Test-Path $default) {
        $RuneLiteHome = $default
    }
}

if (-not $RuneLiteHome -or -not (Test-Path $RuneLiteHome)) {
    Write-Error @"
RuneLite source tree not found.

Clone RuneLite and build the cache module, then re-run setup:

  git clone https://github.com/runelite/runelite.git
  cd runelite
  .\gradlew.bat :cache:jar

Or set RUNELITE_HOME to your runelite checkout and run setup.ps1 again.
Alternatively, copy cache/build/libs/cache-*-SNAPSHOT.jar to asset-dumper/vendor/cache.jar
"@
}

Write-Host "Building RuneLite cache module in $RuneLiteHome ..."
Push-Location $RuneLiteHome
& .\gradlew.bat :cache:jar -x test
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Pop-Location

$built = Get-ChildItem "$RuneLiteHome\cache\build\libs\cache-*.jar" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if (-not $built) {
    Write-Error "Could not find built cache jar under $RuneLiteHome\cache\build\libs"
}

New-Item -ItemType Directory -Force -Path "$Root\vendor" | Out-Null
Copy-Item $built.FullName $VendorJar -Force
Write-Host "Installed $($built.Name) -> $VendorJar"
