"""Build per-tile Yama shadow wall PNGs — corner-to-corner diagonals for seamless tiling."""
from __future__ import annotations

import math
import os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = os.path.join(ROOT, "src", "assets", "graphicObjects", "yamaWall")
PURPLE_SRC = r"C:\Users\Eric\.cursor\projects\c-Users-Eric-Runelogs\assets\c__Users_Eric_AppData_Roaming_Cursor_User_workspaceStorage_c6b5037e5cb9c2e20e409586d0a19fad_images_image-e0f01b02-5b29-4368-970b-a0594b8225e3.png"
SHADOW_SRC = r"C:\Users\Eric\.cursor\projects\c-Users-Eric-Runelogs\assets\c__Users_Eric_AppData_Roaming_Cursor_User_workspaceStorage_c6b5037e5cb9c2e20e409586d0a19fad_images_image-ccebdde6-f8d3-4959-b808-df26aa045a08.png"

SIZE = 96
DIAGONAL_LEN = int(round(math.hypot(SIZE - 1, SIZE - 1))) + 1
TILE_OVERFLOW_PX = int(round(SIZE * 0.22))
STRIP_LENGTH = DIAGONAL_LEN + TILE_OVERFLOW_PX * 2


def is_purple_pixel(r: int, g: int, b: int, a: int = 255) -> bool:
    if a < 10:
        return False
    if max(r, g, b) < 95:
        return False
    return b > 95 and r > 75 and b >= g - 25


def is_shadow_pixel(r: int, g: int, b: int, a: int = 255) -> bool:
    if a < 10:
        return False
    return 10 < max(r, g, b) < 100


def extract_crest(path: str) -> Image.Image:
    src = Image.open(path).convert("RGBA")
    w, h = src.size
    crest = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    spx = src.load()
    cpx = crest.load()
    for y in range(h):
        for x in range(w):
            r, g, b, a = spx[x, y]
            if is_purple_pixel(r, g, b, a):
                cpx[x, y] = (r, g, b, a)
    bbox = crest.getbbox()
    return crest.crop(bbox) if bbox else crest


def extract_shadow(path: str) -> Image.Image:
    src = Image.open(path).convert("RGBA")
    w, h = src.size
    shadow = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    spx = src.load()
    dpx = shadow.load()
    for y in range(h):
        for x in range(w):
            r, g, b, a = spx[x, y]
            if is_shadow_pixel(r, g, b, a):
                dpx[x, y] = (r, g, b, min(255, a + 40))
    bbox = shadow.getbbox()
    return shadow.crop(bbox) if bbox else shadow


def tile_strip_to_length(strip: Image.Image, length: int) -> Image.Image:
    if strip.width == 0:
        return Image.new("RGBA", (length, max(1, strip.height)), (0, 0, 0, 0))
    if strip.width >= length:
        return strip.crop((0, 0, length, strip.height))
    out = Image.new("RGBA", (length, strip.height), (0, 0, 0, 0))
    x = 0
    while x < length:
        out.paste(strip, (x, 0))
        x += strip.width
    return out


def jagged_profile(strip: Image.Image, alpha_min: int = 16) -> tuple[list[float], list[float]]:
    """Per-column crest-line offset and thickness from reference silhouette."""
    sw, sh = strip.size
    spx = strip.load()
    tops: list[int] = []
    heights: list[int] = []

    for x in range(sw):
        top = sh
        bottom = -1
        for y in range(sh):
            if spx[x, y][3] >= alpha_min:
                top = min(top, y)
                bottom = max(bottom, y)
        if bottom < 0:
            tops.append(sh // 2)
            heights.append(1)
        else:
            tops.append(top)
            heights.append(max(1, bottom - top + 1))

    baseline = sum(tops) / len(tops)
    max_dev = max(abs(t - baseline) for t in tops) or 1.0
    offsets = [(baseline - t) / max_dev for t in tops]

    max_h = max(heights) or 1
    widths = [h / max_h for h in heights]
    return offsets, widths


def diagonal_endpoints(diagonal: str) -> tuple[tuple[float, float], tuple[float, float]]:
    o = TILE_OVERFLOW_PX
    if diagonal == "ne-sw":
        return (-o, SIZE - 1 + o), (SIZE - 1 + o, -o)
    return (-o, -o), (SIZE - 1 + o, SIZE - 1 + o)


def sample_strip_at(strip: Image.Image, sx: int, sy: int) -> tuple[int, int, int, int]:
    sx = max(0, min(strip.width - 1, sx))
    sy = max(0, min(strip.height - 1, sy))
    return strip.load()[sx, sy]


def draw_diagonal_band(
    strip: Image.Image,
    diagonal: str,
    half_width: float,
    *,
    jagged_amplitude: float = 0.0,
    width_variation: float = 0.0,
    alpha_scale: float = 1.0,
    fallback_rgba: tuple[int, int, int, int] | None = None,
    core_fraction: float = 0.5,
    tint_rgba: tuple[int, int, int] | None = None,
) -> Image.Image:
    """Paint a 2D reference strip along the tile diagonal with jagged crest offsets."""
    tile = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    (x0, y0), (x1, y1) = diagonal_endpoints(diagonal)
    dx, dy = x1 - x0, y1 - y0
    diag_len = math.hypot(dx, dy)
    if diag_len < 1:
        return tile

    perp_x, perp_y = -dy / diag_len, dx / diag_len
    offsets, widths = jagged_profile(strip)
    sw, sh = strip.size
    spx = strip.load()
    tpx = tile.load()
    steps = int(diag_len) + 1

    for i in range(steps + 1):
        t = i / steps
        sx = min(sw - 1, int(t * (sw - 1)))

        cx = x0 + t * dx
        cy = y0 + t * dy
        if jagged_amplitude > 0:
            jag = offsets[sx] * jagged_amplitude
            cx += perp_x * jag
            cy += perp_y * jag

        local_half = half_width
        if width_variation > 0:
            local_half *= 0.72 + widths[sx] * width_variation

        radius = int(math.ceil(local_half))
        for py in range(max(0, int(cy) - radius), min(SIZE, int(cy) + radius + 1)):
            for px in range(max(0, int(cx) - radius), min(SIZE, int(cx) + radius + 1)):
                rel_x = px - cx
                rel_y = py - cy
                signed_perp = rel_x * perp_x + rel_y * perp_y
                dist = math.hypot(rel_x, rel_y)
                if dist > local_half:
                    continue

                # Map perpendicular distance into strip rows (crest at top rows).
                norm = abs(signed_perp) / local_half if local_half > 0 else 0
                sy = int(norm * (sh - 1))
                sy = max(0, min(sh - 1, sy))
                r, g, b, a = spx[sx, sy]
                if a < 8 and fallback_rgba is not None:
                    r, g, b, a = fallback_rgba
                if a < 8:
                    continue

                if tint_rgba is not None:
                    r, g, b = tint_rgba

                if norm < core_fraction:
                    edge = 1.0
                else:
                    edge = max(0.0, 1.0 - ((norm - core_fraction) / (1.0 - core_fraction)) ** 0.7)
                out_a = min(255, int(a * edge * alpha_scale))
                if out_a < 4:
                    continue
                existing = tpx[px, py]
                if out_a >= existing[3]:
                    tpx[px, py] = (r, g, b, out_a)

    return tile


def build_active_tile(crest: Image.Image, diagonal: str) -> Image.Image:
    strip = tile_strip_to_length(crest, STRIP_LENGTH)
    return draw_diagonal_band(
        strip,
        diagonal,
        half_width=14.0,
        jagged_amplitude=10.0,
        width_variation=0.6,
    )


def build_fade_tile(crest: Image.Image, diagonal: str) -> Image.Image:
    # Same silhouette as the active crest, tinted dark so fade matches line width.
    strip = tile_strip_to_length(crest, STRIP_LENGTH)
    return draw_diagonal_band(
        strip,
        diagonal,
        half_width=14.0,
        jagged_amplitude=10.0,
        width_variation=0.6,
        alpha_scale=0.85,
        core_fraction=0.45,
        tint_rgba=(12, 8, 16),
    )


def main() -> None:
    os.makedirs(ASSETS, exist_ok=True)
    crest = extract_crest(PURPLE_SRC)

    for diagonal in ("ne-sw", "nw-se"):
        suffix = "" if diagonal == "ne-sw" else "_mirror"
        build_active_tile(crest, diagonal).save(
            os.path.join(ASSETS, f"shadow_wall_active{suffix}.png")
        )
        build_fade_tile(crest, diagonal).save(
            os.path.join(ASSETS, f"shadow_wall_fade{suffix}.png")
        )

    print("Wrote jagged corner-to-corner tile assets to", ASSETS)


if __name__ == "__main__":
    main()
