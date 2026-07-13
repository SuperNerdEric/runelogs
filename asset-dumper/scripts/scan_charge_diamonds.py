"""Scan spotanim 3412 frames for largest clean diamond islands."""
from __future__ import annotations

import collections
import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]


def near_black_to_alpha(im: Image.Image, thresh: int = 8) -> Image.Image:
    im = im.convert("RGBA")
    px = im.load()
    assert px is not None
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if a and r <= thresh and g <= thresh and b <= thresh:
                px[x, y] = (0, 0, 0, 0)
    return im


def components(
    im: Image.Image,
    min_area: int = 20,
    max_area: int = 8000,
    min_aspect: float = 0.45,
    max_aspect: float = 2.2,
) -> list[tuple[int, Image.Image]]:
    w, h = im.size
    px = im.load()
    assert px is not None
    seen = [[False] * w for _ in range(h)]
    out: list[tuple[int, Image.Image]] = []
    for y in range(h):
        for x in range(w):
            if seen[y][x] or px[x, y][3] < 20:
                continue
            q = collections.deque([(x, y)])
            seen[y][x] = True
            cells: list[tuple[int, int]] = []
            while q:
                cx, cy = q.popleft()
                cells.append((cx, cy))
                for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
                    if (
                        0 <= nx < w
                        and 0 <= ny < h
                        and not seen[ny][nx]
                        and px[nx, ny][3] >= 20
                    ):
                        seen[ny][nx] = True
                        q.append((nx, ny))
            area = len(cells)
            if not (min_area <= area <= max_area):
                continue
            xs = [c[0] for c in cells]
            ys = [c[1] for c in cells]
            l, r, t, b = min(xs), max(xs), min(ys), max(ys)
            crop = Image.new("RGBA", (r - l + 1, b - t + 1), (0, 0, 0, 0))
            cp = crop.load()
            assert cp is not None
            for cx, cy in cells:
                cp[cx - l, cy - t] = px[cx, cy]
            aspect = crop.width / max(1, crop.height)
            if min_aspect <= aspect <= max_aspect:
                out.append((area, crop))
    out.sort(key=lambda t: t[0], reverse=True)
    return out


def scan_dir(label: str, part_dir: Path) -> list[dict]:
    rows: list[dict] = []
    for path in sorted(part_dir.glob("*.png")):
        stem = path.stem
        if stem.endswith("_meta"):
            continue
        frame = int(stem.rsplit("_", 1)[-1]) if "_" in stem else 0
        im = near_black_to_alpha(Image.open(path))
        bbox = im.getbbox()
        if bbox:
            im = im.crop(bbox)
        for rank, (area, crop) in enumerate(components(im)[:6]):
            rows.append(
                {
                    "label": label,
                    "frame": frame,
                    "file": path.name,
                    "rank": rank,
                    "area": area,
                    "w": crop.width,
                    "h": crop.height,
                }
            )
    rows.sort(key=lambda r: r["area"], reverse=True)
    return rows


def main() -> None:
    dirs = [
        ("base450", ROOT / "src" / "assets" / "_charge_particles"),
        ("z900", ROOT / "src" / "assets" / "_charge_particles_zoom"),
    ]
    all_rows: list[dict] = []
    for label, d in dirs:
        if not d.exists():
            continue
        all_rows.extend(scan_dir(label, d))

    all_rows.sort(key=lambda r: r["area"], reverse=True)
    out = ROOT / "src" / "assets" / "_charge_composite" / "diamond_scan.json"
    out.write_text(json.dumps(all_rows[:40], indent=2), encoding="utf-8")
    print(f"top diamonds written to {out}")
    for row in all_rows[:15]:
        print(row)


if __name__ == "__main__":
    main()
