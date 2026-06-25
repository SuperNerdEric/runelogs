#!/usr/bin/env python3
"""Update graphicObjectIdMap.ts frame imports for animated spotanims in config/assets.json."""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
CONFIG = ROOT / "config" / "assets.json"
METADATA = ROOT / "config" / "last-dump.json"
MAP_FILE = ROOT.parent / "src" / "lib" / "graphicObjectIdMap.ts"
ASSETS = ROOT.parent / "src" / "assets" / "graphicObjects"


def load_json(path: Path) -> dict:
    if not path.is_file():
        return {}
    return json.loads(path.read_text(encoding="utf-8"))


def frame_files(spot_id: int) -> list[Path]:
    single = ASSETS / f"{spot_id}.png"
    if single.is_file():
        return [single]
    frames = sorted(ASSETS.glob(f"{spot_id}_*.png"), key=lambda p: int(p.stem.split("_", 1)[1]))
    return frames


def main() -> None:
    config = load_json(CONFIG)
    metadata = load_json(METADATA)
    graphic_entries = config.get("graphicObjects", [])
    animated_ids = [e["id"] for e in graphic_entries if e.get("animated")]

    if not animated_ids:
        print("No animated graphicObjects in config; nothing to update.")
        return

    if not MAP_FILE.is_file():
        raise SystemExit(f"Missing {MAP_FILE}")

    text = MAP_FILE.read_text(encoding="utf-8")

    # Remove existing imports and map entries for animated ids we're managing
    for spot_id in animated_ids:
        text = re.sub(rf"^import o{spot_id}(?:_\d+)? from .*;\n", "", text, flags=re.M)

    # Remove map entries for these ids (simple block match)
    for spot_id in animated_ids:
        text = re.sub(
            rf"\n\s*{spot_id}: \{{[^}}]*\}},?",
            "",
            text,
            count=1,
        )

    # Build new imports (insert before export interface)
    new_imports: list[str] = []
    new_entries: list[str] = []

    for spot_id in animated_ids:
        frames = frame_files(spot_id)
        if not frames:
            print(f"Warning: no PNGs for spotanim {spot_id} in {ASSETS}")
            continue

        import_names = []
        for frame in frames:
            var = f"o{frame.stem.replace('-', '_')}"
            import_names.append(var)
            new_imports.append(f"import {var} from '../assets/graphicObjects/{frame.name}';")

        meta = metadata.get("graphicObjects", {}).get(str(spot_id), {})
        frame_lengths = meta.get("frameLengths")
        comment = next((e.get("comment", "") for e in graphic_entries if e["id"] == spot_id), "")
        name = comment or f"Graphic object {spot_id}"

        entry_lines = [f"    {spot_id}: {{"]
        entry_lines.append(f'        name: "{name}",')
        if frame_lengths:
            entry_lines.append("        frameLengths: [" + ", ".join(str(x) for x in frame_lengths) + "],")
        entry_lines.append(f"        frames: [{', '.join(import_names)}],")
        entry_lines.append("    },")
        new_entries.append("\n".join(entry_lines))

    if not new_imports:
        print("No frame files found; graphicObjectIdMap unchanged.")
        return

    insert_imports_at = text.find("export interface GraphicObject")
    if insert_imports_at == -1:
        raise SystemExit("Could not find export interface GraphicObject in map file")

    text = text[:insert_imports_at] + "\n".join(new_imports) + "\n\n" + text[insert_imports_at:]

    # Insert entries before closing };
    marker = "\n};\n"
    idx = text.rfind(marker)
    if idx == -1:
        raise SystemExit("Could not find end of graphicObjectIdMap")

    text = text[:idx] + "\n" + "\n".join(new_entries) + text[idx:]

    MAP_FILE.write_text(text, encoding="utf-8")
    print(f"Updated {MAP_FILE} for spotanims: {', '.join(str(i) for i in animated_ids)}")


if __name__ == "__main__":
    main()
