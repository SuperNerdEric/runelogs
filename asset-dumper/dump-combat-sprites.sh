#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

CACHE_DIR="${1:-${OSRS_CACHE_DIR:-}}"
OUTPUT="${OUTPUT:-../src/assets/combat}"

if [[ -z "$CACHE_DIR" ]]; then
  echo "Cache directory required. Usage: ./dump-combat-sprites.sh <cacheDir>  or set OSRS_CACHE_DIR" >&2
  exit 1
fi

if [[ -x "./gradlew" ]]; then
  GRADLE="./gradlew"
else
  GRADLE="gradle"
fi

if [[ ! -f "$ROOT/vendor/cache.jar" ]]; then
  echo "vendor/cache.jar not found - running setup.sh ..."
  "$ROOT/setup.sh"
fi

echo "Building asset-dumper..."
$GRADLE shadowJar

JAR="$ROOT/build/libs/asset-dumper.jar"
if [[ ! -f "$JAR" ]]; then
  echo "Build failed: $JAR not found" >&2
  exit 1
fi

echo "Dumping combat sprites from $CACHE_DIR ..."
java -cp "$JAR" org.runelogs.assetdumper.CombatSpriteDumper --cache "$CACHE_DIR" --output "$OUTPUT"

echo "Done."
