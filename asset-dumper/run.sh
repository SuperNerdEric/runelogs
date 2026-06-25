#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

CACHE_DIR="${1:-${OSRS_CACHE_DIR:-}}"
CONFIG="${CONFIG:-config/assets.json}"

if [[ -z "$CACHE_DIR" ]]; then
  echo "Cache directory required. Usage: ./run.sh <cacheDir>  or set OSRS_CACHE_DIR" >&2
  exit 1
fi

if [[ -x "./gradlew" ]]; then
  GRADLE="./gradlew"
else
  GRADLE="gradle"
fi

echo "Building asset-dumper..."
$GRADLE shadowJar

JAR="$ROOT/build/libs/asset-dumper.jar"
if [[ ! -f "$JAR" ]]; then
  echo "Build failed: $JAR not found" >&2
  exit 1
fi

echo "Dumping assets from $CACHE_DIR ..."
java -jar "$JAR" --cache "$CACHE_DIR" --config "$CONFIG"

if command -v python3 >/dev/null 2>&1; then
  echo "Updating graphicObjectIdMap.ts ..."
  python3 "$ROOT/update-graphic-object-map.py"
elif command -v python >/dev/null 2>&1; then
  echo "Updating graphicObjectIdMap.ts ..."
  python "$ROOT/update-graphic-object-map.py"
fi

echo "Done."
