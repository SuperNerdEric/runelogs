# Generic Maya pose / camera picker for any NPC with Maya animations.
# Usage:
#   powershell -File runelogs/asset-dumper/tools/pose-viewer/start.ps1
#
# Opens http://127.0.0.1:8765/
#
# Env overrides:
#   OSRS_CACHE_DIR      cache path
#   MAYA_VERTS_ROOT     folder of {seqId}/verts_*.json (or a single seq folder)
#   POSE_VIEWER_PORT    port (default 8765)
#   NODE_BINARY         node executable (default: node)

$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$cacheDefault = "C:\Users\Eric\.qodat\downloads\2026-06-30-rev239-2\cache"
$vertsDefault = "C:\Users\Eric\AppData\Local\Temp\maya-pose-verts"
$hereditVerts = "C:\Users\Eric\AppData\Local\Temp\heredit-maya\verts"

$cache = if ($env:OSRS_CACHE_DIR) { $env:OSRS_CACHE_DIR } else { $cacheDefault }
$verts = if ($env:MAYA_VERTS_ROOT) { $env:MAYA_VERTS_ROOT } elseif ($env:HEREDIT_VERTS_DIR) { $env:HEREDIT_VERTS_DIR } else { $vertsDefault }
$port = if ($env:POSE_VIEWER_PORT) { [int]$env:POSE_VIEWER_PORT } else { 8765 }
$ui = Join-Path $PSScriptRoot "index.html"
$exportScript = Join-Path $PSScriptRoot "export-npc-maya.mjs"

if (-not (Test-Path $cache)) { throw "Cache not found: $cache (set OSRS_CACHE_DIR)" }
if (-not (Test-Path $ui)) { throw "Missing UI: $ui" }
if (-not (Test-Path $exportScript)) { throw "Missing export script: $exportScript" }

if (-not (Test-Path $verts)) {
  New-Item -ItemType Directory -Force -Path $verts | Out-Null
}

# Seed shared verts root from existing Heredit exports if empty.
$existingSeq = Get-ChildItem $verts -Directory -ErrorAction SilentlyContinue |
  Where-Object { Test-Path (Join-Path $_.FullName "verts_0.json") }
if (-not $existingSeq -and (Test-Path $hereditVerts)) {
  Write-Host "Seeding verts from $hereditVerts → $verts"
  Copy-Item -Path (Join-Path $hereditVerts "*") -Destination $verts -Recurse -Force
}

# Ensure osrscachereader is available for on-demand export.
Push-Location $PSScriptRoot
try {
  if (-not (Test-Path "node_modules\osrscachereader")) {
    $hereditNm = "C:\Users\Eric\AppData\Local\Temp\heredit-maya\node_modules"
    if (Test-Path (Join-Path $hereditNm "osrscachereader")) {
      Write-Host "Using osrscachereader from heredit-maya node_modules…"
      New-Item -ItemType Directory -Force -Path "node_modules" | Out-Null
      cmd /c mklink /J "node_modules\osrscachereader" "$(Join-Path $hereditNm 'osrscachereader')"
      if ($LASTEXITCODE -ne 0) {
        Write-Host "Junction failed; npm install…"
        npm install --silent
        if ($LASTEXITCODE -ne 0) { throw "npm install failed" }
      }
    } else {
      Write-Host "npm install (osrscachereader)…"
      npm install --silent
      if ($LASTEXITCODE -ne 0) { throw "npm install failed" }
    }
  }
}
finally {
  Pop-Location
}

$nodeModules = Join-Path $PSScriptRoot "node_modules"

Push-Location $root
try {
  Write-Host "Compiling asset-dumper…"
  & .\gradlew.bat compileJava --quiet
  if ($LASTEXITCODE -ne 0) { throw "gradle compileJava failed" }

  $cp = "build\classes\java\main;build\libs\asset-dumper.jar"

  Write-Host "Starting Maya pose viewer on http://127.0.0.1:$port/"
  Write-Host "Verts root: $verts"
  Start-Process "http://127.0.0.1:$port/"

  & java `
    "-Dpose.exportScript=$exportScript" `
    "-Dpose.nodeModules=$nodeModules" `
    -cp $cp org.runelogs.assetdumper.PoseViewerServer `
    $cache $verts $port $ui
}
finally {
  Pop-Location
}
