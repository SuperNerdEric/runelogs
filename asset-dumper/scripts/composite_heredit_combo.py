"""Composite Sol Heredit triple-parry body + telegraph sparkles (spotanim 2668).

Body: Maya 10887 VertexOverrideRender square PNG.
Sparkles: NPC_COLOSSI_COLOSSI_TRIPLEATTACK_01_TELEGRAPH_SHORTER (2668)
  — yellow diamond/ball islands + burst/teardrop rays from hi-zoom dumps.
"""
from __future__ import annotations

import collections
import math
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
DEFAULT_BODY = (
    ROOT / "src" / "assets" / "_heredit_combo_match" / "f65_pose_viewer.png"
)
SPARK_HI = ROOT / "src" / "assets" / "_heredit_combo_spark_hi"
SPARK_Z500 = ROOT / "src" / "assets" / "_heredit_combo_sparkles"
OUT_DIR = ROOT / "src" / "assets" / "_heredit_combo_composite"
SHIP = ROOT / "public" / "images" / "npc-attacks" / "colosseum" / "heredit-combo.png"


def near_black_to_alpha(im: Image.Image, thresh: int = 12) -> Image.Image:
    im = im.convert("RGBA")
    px = im.load()
    assert px is not None
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if a and r <= thresh and g <= thresh and b <= thresh:
                px[x, y] = (0, 0, 0, 0)
    return im


def extract_islands(
    im: Image.Image, min_area: int = 20, max_area: int = 20000
) -> list[Image.Image]:
    w, h = im.size
    px = im.load()
    assert px is not None
    seen = [[False] * w for _ in range(h)]
    islands: list[Image.Image] = []

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
            if not (min_area <= len(cells) <= max_area):
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
            islands.append(crop)

    islands.sort(key=lambda c: c.width * c.height, reverse=True)
    return islands


def load_bursts() -> list[Image.Image]:
    frames: list[Image.Image] = []
    for name in (
        "hi52.png",
        "hi13.png",
        "hi33.png",
        "hi37.png",
        "hi14.png",
        "hi53.png",
    ):
        path = SPARK_HI / name
        if not path.exists():
            continue
        im = near_black_to_alpha(Image.open(path))
        bb = im.getbbox()
        if bb:
            frames.append(im.crop(bb))
    return frames


def brighten_sparkle(im: Image.Image, gain: float = 1.55) -> Image.Image:
    """Lift dull dump yellows so they read on gold armor."""
    out = im.copy()
    px = out.load()
    assert px is not None
    for y in range(out.height):
        for x in range(out.width):
            r, g, b, a = px[x, y]
            if a < 20:
                continue
            r = min(255, int(r * gain + 20))
            g = min(255, int(g * gain + 10))
            b = min(255, int(b * gain))
            px[x, y] = (r, g, b, a)
    return out


def load_diamonds() -> list[Image.Image]:
    """Yellow diamond/circle particles (skip tall triangle shards).

    Prefers hi-zoom dumps for small native diamonds so near-face sparks
    stay diamond-shaped instead of collapsing into triangles when scaled down.
    """
    gems: list[Image.Image] = []
    roots = [p for p in (SPARK_HI, SPARK_Z500) if p.exists()]
    patterns = ("hi*.png", "t2668_z500_*.png")
    for root in roots:
        for pattern in patterns:
            for path in root.glob(pattern):
                im = near_black_to_alpha(Image.open(path))
                bb = im.getbbox()
                if not bb:
                    continue
                for isl in extract_islands(im.crop(bb), min_area=20, max_area=3500):
                    area = isl.width * isl.height
                    aspect = isl.width / max(1, isl.height)
                    if not (0.78 <= aspect <= 1.40):
                        continue
                    if not (80 <= area <= 2800):
                        continue
                    px = isl.load()
                    opaque = sum(
                        1
                        for yy in range(isl.height)
                        for xx in range(isl.width)
                        if px[xx, yy][3] > 20
                    )
                    fill = opaque / max(1, area)
                    if fill < 0.40:
                        continue
                    gems.append(brighten_sparkle(isl))
    gems.sort(key=lambda c: c.width * c.height)
    uniq: list[Image.Image] = []
    seen: set[tuple[int, int]] = set()
    for d in gems:
        key = (d.width, d.height)
        if key in seen:
            continue
        seen.add(key)
        uniq.append(d)
    return uniq


def face_anchor(body: Image.Image) -> tuple[int, int]:
    """Center of the helmet faceplate (not the crest above it)."""
    px = body.load()
    assert px is not None
    # Crest is the wide mass above; face is the narrower gold mask lower down.
    y0 = int(body.height * 0.30)
    y1 = int(body.height * 0.36)
    best = None  # (score, x, y) — prefer narrower rows (face vs crest/shoulders)
    for y in range(y0, y1):
        row = [x for x in range(body.width) if px[x, y][3] > 40]
        if len(row) < 25:
            continue
        left, right = row[0], row[-1]
        span = right - left
        if span < 40 or span > 120:
            continue
        mid = (left + right) // 2
        # Score: prefer moderately narrow gold face rows.
        score = -abs(span - 75)
        if best is None or score > best[0]:
            best = (score, mid, y)
    if best is None:
        return body.width // 2, int(body.height * 0.33)
    return best[1], best[2] + 6


def composite(body_path: Path, out_path: Path) -> Path:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    body = near_black_to_alpha(Image.open(body_path))
    diamonds = load_diamonds()
    if len(diamonds) < 3:
        raise SystemExit(f"need diamond/circle sparkle dumps (got {len(diamonds)})")

    hx, hy = face_anchor(body)
    base = body.copy()
    body_px = body.load()
    assert body_px is not None
    near_src = [d for d in diamonds if max(d.width, d.height) <= 28] or diamonds[: max(2, len(diamonds) // 2)]
    far_src = [d for d in diamonds if max(d.width, d.height) >= 22] or diamonds
    print(f"face anchor ({hx}, {hy}) diamonds={len(diamonds)} near={len(near_src)} far={len(far_src)}")

    def on_opaque(cx: int, cy: int) -> bool:
        if cx < 0 or cy < 0 or cx >= body.width or cy >= body.height:
            return False
        return body_px[cx, cy][3] > 40

    # Burst from face: ~4–5 small near face, then sparse larger farther out.
    places = (
        # near face — just a few small diamonds around the faceplate
        (25, 38, 12),
        (155, 40, 11),
        (70, 48, 14),
        (120, 52, 10),
        (-15, 44, 12),
        # mid — fewer, growing
        (40, 105, 22),
        (150, 110, 20),
        (90, 125, 26),
        (0, 118, 18),
        # outer — sparse, larger, lopsided
        (30, 170, 38),
        (160, 175, 44),
        (70, 195, 48),
        (200, 155, 34),
        (110, 200, 40),
    )
    crest_y_cap = hy - 18  # keep near sparks at/below brow line
    for i, (angle_deg, radius, target) in enumerate(places):
        pool = near_src if target <= 16 else far_src
        src = pool[(i * 3 + (i % 2)) % len(pool)]
        rad = math.radians(angle_deg)
        r = float(radius)
        if target <= 16:
            for _ in range(20):
                tx = hx + int(round(math.cos(rad) * r))
                ty = hy + int(round(math.sin(rad) * r))
                if ty < crest_y_cap:
                    break
                if not on_opaque(tx, ty):
                    break
                r += 2.5
        dx = int(round(math.cos(rad) * r))
        dy = int(round(math.sin(rad) * r))
        if target <= 16:
            scale = max(0.85, min(1.35, target / max(src.width, src.height)))
        else:
            scale = target / max(src.width, src.height)
        nw = max(5, int(src.width * scale))
        nh = max(5, int(src.height * scale))
        dd = src.resize((nw, nh), Image.Resampling.NEAREST)
        if target <= 16:
            dd = brighten_sparkle(dd, gain=1.25)
        x = hx + dx - dd.width // 2
        y = hy + dy - dd.height // 2
        # Keep near sparks from drifting onto the crest.
        if target <= 16 and y + dd.height // 2 < crest_y_cap:
            y = crest_y_cap - dd.height // 2
        if x < -dd.width or y < -dd.height or x >= base.width or y >= base.height:
            continue
        base.alpha_composite(dd, (x, y))

    out_path.parent.mkdir(parents=True, exist_ok=True)
    base.save(out_path)
    print(f"wrote {out_path} size={base.size}")
    return out_path


if __name__ == "__main__":
    body = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_BODY
    out = Path(sys.argv[2]) if len(sys.argv) > 2 else SHIP
    composite(body, out)
    if out.resolve() != SHIP.resolve():
        composite(body, SHIP)
