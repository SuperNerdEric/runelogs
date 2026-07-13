"""Composite Doom face + charge diamonds placed on face (3412)."""
from __future__ import annotations

import collections
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
FACE_BASE = ROOT / "src" / "assets" / "_charge_face_halves" / "face_sealed.png"
PART_DIRS = [
    ROOT / "src" / "assets" / "_charge_particles_zoom",
    ROOT / "src" / "assets" / "_charge_particles",
]
OUT_DIR = ROOT / "src" / "assets" / "_charge_composite"
SHIP = ROOT / "public" / "images" / "npc-attacks" / "mokhaiotl" / "charge.png"

PREFERRED_FRAMES = {8, 9, 12, 13, 16}
MIN_ISLAND_AREA = 350
MAX_ISLAND_AREA = 1200


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


def extract_diamonds(im: Image.Image) -> list[Image.Image]:
    w, h = im.size
    px = im.load()
    assert px is not None
    seen = [[False] * w for _ in range(h)]
    islands: list[tuple[int, Image.Image]] = []

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
            if not (MIN_ISLAND_AREA <= area <= MAX_ISLAND_AREA):
                continue

            xs = [c[0] for c in cells]
            ys = [c[1] for c in cells]
            left, right = min(xs), max(xs)
            top, bottom = min(ys), max(ys)
            crop = Image.new("RGBA", (right - left + 1, bottom - top + 1), (0, 0, 0, 0))
            cp = crop.load()
            assert cp is not None
            for cx, cy in cells:
                cp[cx - left, cy - top] = px[cx, cy]

            aspect = crop.width / max(1, crop.height)
            if not (0.65 <= aspect <= 1.5):
                continue
            if max(crop.width, crop.height) > 55:
                continue
            compact = area / max(1, crop.width * crop.height)
            if compact < 0.28:
                continue

            islands.append((area, crop))

    islands.sort(key=lambda t: t[0], reverse=True)
    return [crop for _, crop in islands]


def frame_index(path: Path) -> int:
    return int(path.stem.rsplit("_", 1)[-1])


def collect_diamonds() -> list[Image.Image]:
    seen: set[tuple[int, int, int]] = set()
    ranked: list[tuple[int, Image.Image]] = []

    for part_dir in PART_DIRS:
        if not part_dir.exists():
            continue
        zoom_bonus = 500 if "zoom" in part_dir.name else 0
        for path in sorted(part_dir.glob("*.png")):
            fi = frame_index(path)
            frame_bonus = 300 if fi in PREFERRED_FRAMES else 0
            im = near_black_to_alpha(Image.open(path))
            bbox = im.getbbox()
            if bbox:
                im = im.crop(bbox)
            for crop in extract_diamonds(im):
                key = (crop.width, crop.height, crop.size[0] * crop.size[1])
                if key in seen:
                    continue
                seen.add(key)
                area = crop.width * crop.height
                ranked.append((area + zoom_bonus + frame_bonus, crop))

    ranked.sort(key=lambda t: t[0], reverse=True)
    return [crop for _, crop in ranked]


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    face = Image.open(FACE_BASE).convert("RGBA")
    diamonds = collect_diamonds()
    print(f"candidate diamonds: {len(diamonds)}")
    if len(diamonds) < 3:
        raise SystemExit("not enough diamond islands")

    # Anchors on 448×448 face_sealed canvas.
    placements = [
        (0, 142, 232, 0.92),  # left cheek
        (1, 334, 122, 0.86),  # right horn
        (2, 226, 362, 0.92),  # chin
        (3, 218, 288, 0.56),  # mouth left
        (4, 252, 282, 0.50),  # mouth right
    ]

    base = face.copy()
    for di, cx, cy, scale in placements:
        d = diamonds[min(di, len(diamonds) - 1)]
        nw = max(1, int(d.width * scale))
        nh = max(1, int(d.height * scale))
        dd = d.resize((nw, nh), Image.Resampling.LANCZOS)
        base.alpha_composite(dd, (cx - nw // 2, cy - nh // 2))

    out_probe = OUT_DIR / "charge_face_diamonds_placed.png"
    base.save(out_probe)
    base.save(SHIP)
    print(f"shipped {SHIP}")


if __name__ == "__main__":
    main()
