# OSRS Asset Dumper

Renders game object and spotanim (graphics object) models from an OSRS cache into PNGs for the runelogs replay map. Output goes directly to `runelogs/src/assets/`.

## Requirements

- **Java 11+**
- **Gradle** (or use the Gradle wrapper after first setup — see below)
- An OSRS **cache** in disk or OpenRS2 flat-file format (see below)

## Quick start

```powershell
# From runelogs/asset-dumper/

# 1. One-time: build vendor/cache.jar from a RuneLite checkout (see setup.ps1)
.\setup.ps1

# 2. Dump assets (writes directly to ../src/assets/)
$env:OSRS_CACHE_DIR = "C:\Users\YourName\.qodat\downloads\2026-06-17-rev238\cache"
.\run.ps1
```

```bash
# From runelogs/asset-dumper/
export OSRS_CACHE_DIR="$HOME/.qodat/downloads/2026-06-17-rev238/cache"
./run.sh
```

Or pass the cache path explicitly:

```powershell
.\run.ps1 -CacheDir "C:\path\to\cache"
```

This builds the tool (first run only), dumps all IDs listed in `config/assets.json`, and writes:

| Output | Default path |
|--------|----------------|
| Game objects | `../src/assets/gameObjects/{id}.png` |
| Graphic objects | `../src/assets/graphicObjects/{id}_{frame}.png` |

After dumping animated spotanims, update `src/lib/graphicObjectIdMap.ts` — see [Updating graphicObjectIdMap](#updating-graphicobjectidmap).

---

## Getting a cache

The dumper reads the same cache data RuneLite uses. Caches are archived on [OpenRS2](https://archive.openrs2.org/caches) (runestats). **qodat** downloads from this archive.

### Cache formats

OpenRS2 offers two layouts. This tool supports **both**:

| Format | OpenRS2 download | How to recognize |
|--------|------------------|------------------|
| **Disk (`.dat2` / `.idx`)** | **Cache (.dat2/.idx)** / `disk.zip` | Folder contains `main_file_cache.dat2` and `main_file_cache.idx0` … `idx255` |
| **Flat file** | **Cache (Flat file)** / `flat-file.tar.gz` | Folder contains many `*.flatcache` text files |

**qodat** uses the **disk** layout. Example:

```
2026-06-17-rev238/
  gamepack.jar
  params.txt
  cache/
    main_file_cache.dat2
    main_file_cache.idx0
    main_file_cache.idx1
    ...
    main_file_cache.idx255
```

Pass the inner **`cache/`** directory (the one with `main_file_cache.dat2`), not the qodat download root:

```powershell
$env:OSRS_CACHE_DIR = "C:\Users\YourName\.qodat\downloads\2026-06-17-rev238\cache"
```

### Option A: qodat

1. Install [qodat](https://github.com/dglynch/qodat) (or your usual qodat build).
2. Download a cache revision from the app (e.g. `2026-06-17-rev238`).
3. Point `OSRS_CACHE_DIR` at the `cache` subfolder inside the download.

### Option B: OpenRS2 direct download

1. Open [archive.openrs2.org/caches](https://archive.openrs2.org/caches).
2. Filter **oldschool** / **live** and pick a revision close to your target date.
3. Download **Cache (.dat2/.idx)** (`disk.zip`).
4. Extract so `main_file_cache.dat2` and the `.idx` files are in one folder.
5. Set `OSRS_CACHE_DIR` to that folder.

For flat-file archives, extract the tarball and point `OSRS_CACHE_DIR` at the extracted directory (must contain `*.flatcache` files).

### Revision notes

Use a cache revision **at or after** the content you are dumping was added. For Doom of Mokhaiotl objects (57283+, spotanims 3405+), a mid-2025+ live revision is appropriate (e.g. rev 238, June 2025).

---

## Configuration

Edit `config/assets.json`:

```json
{
  "output": {
    "gameObjects": "../src/assets/gameObjects",
    "graphicObjects": "../src/assets/graphicObjects"
  },
  "gameObjects": [
    { "id": 57283, "comment": "DOM_ACIDPOOL" }
  ],
  "graphicObjects": [
    { "id": 3405, "animated": true, "comment": "VFX_AREA_SLAM_01" }
  ],
  "render": {
    "gameObject": { "width": 512, "height": 384, "zoom": 900, "xan": 512, "yan": 512 },
    "graphicObject": { "width": 384, "height": 384, "zoom": 700, "xan": 512, "yan": 512 }
  }
}
```

- **`gameObjects`**: static object renders → `{id}.png`
- **`graphicObjects`**: spotanims; with `"animated": true`, dumps every sequence frame as `{id}_{frame}.png`
- **`render`**: camera/size defaults (angles use Jagex units, 2048 = full circle)

Per-entry `"overrides"` can override render settings for a single ID.

---

## Updating graphicObjectIdMap

Animated spotanims need frame imports in `src/lib/graphicObjectIdMap.ts`. After a dump:

```powershell
python update-graphic-object-map.py
```

This reads `config/assets.json` and `config/last-dump.json`, then rewrites the doom shockwave entries (3405–3408) in `graphicObjectIdMap.ts`. Bloat entries (1570–1573) are left unchanged.

For new IDs, add imports and a `frames` array manually (see existing 3405 entry). Use `frameLengths` from `config/last-dump.json` for replay timing (~30 client cycles per game tick).

---

## Manual build / run

```powershell
cd runelogs/asset-dumper
gradle shadowJar
java -jar build/libs/asset-dumper.jar --cache "C:\path\to\cache"
```

### Gradle wrapper (optional)

If the wrapper is not committed, generate it once:

```powershell
gradle wrapper --gradle-version 8.5
```

Then use `.\gradlew.bat shadowJar` instead of `gradle`.

---

## Project layout

```
asset-dumper/
  README.md
  build.gradle
  config/
    assets.json          # IDs to dump + output paths
    hiscore-sprites.json # Hiscore panel sprite archive IDs
    last-dump.json       # written after each run (frame counts, lengths)
  run.ps1 / run.sh
  dump-hiscore-sprites.ps1 / dump-hiscore-sprites.sh
  update-graphic-object-map.py
  src/main/java/
    org/runelogs/assetdumper/   # CLI + config
    net/runelite/cache/item/    # Model renderer + animation helpers
    net/runelite/cache/index/   # Patched IndexData for rev 238+ caches
```

The patched `IndexData` (in this repo) ignores unknown index flags found in newer caches. It overrides the copy from the `net.runelite:cache` dependency in the fat jar.

Hiscore sprites: see `dump-hiscore-sprites.ps1` and the `/update-hiscore-sprites` skill.

---

## Troubleshooting

| Error | Fix |
|-------|-----|
| `Unrecognized cache layout` | Point at the folder with `main_file_cache.dat2` or `*.flatcache`, not the qodat parent folder |
| `Unknown flags` / index load failure | Rebuild the jar so the patched `IndexData` is included |
| Grey models | Rebuild; renderer applies HSL colors via `ModelRenderUtil` |
| Missing object/spotanim | Cache revision is too old — download a newer OpenRS2 cache |
