#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
VENDOR_JAR="$ROOT/vendor/cache.jar"
RUNELITE_HOME="${RUNELITE_HOME:-}"

if [[ -z "$RUNELITE_HOME" && -d "$HOME/IdeaProjects/runelite" ]]; then
  RUNELITE_HOME="$HOME/IdeaProjects/runelite"
fi

if [[ -z "$RUNELITE_HOME" || ! -d "$RUNELITE_HOME" ]]; then
  echo "RuneLite source tree not found. Clone RuneLite, build :cache:jar, or copy the jar to vendor/cache.jar" >&2
  exit 1
fi

echo "Building RuneLite cache module in $RUNELITE_HOME ..."
(cd "$RUNELITE_HOME" && ./gradlew :cache:jar -x test)

BUILT="$(ls -t "$RUNELITE_HOME"/cache/build/libs/cache-*.jar 2>/dev/null | head -1)"
if [[ -z "$BUILT" ]]; then
  echo "Could not find built cache jar" >&2
  exit 1
fi

mkdir -p "$ROOT/vendor"
cp "$BUILT" "$VENDOR_JAR"
echo "Installed $BUILT -> $VENDOR_JAR"
