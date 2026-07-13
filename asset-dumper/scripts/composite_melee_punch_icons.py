"""
Build NPC melee attack icons: Chisel moid base + combat-style punch overlay.

Punch source: SpriteID.COMBAT_STYLE_UNARMED_PUNCH (archive 247).
Cache sprite has no purple outline.

Punch overlay uses a FIXED absolute size (matched to mager-melee.png), so every
composite gets the same punch pixels regardless of moid aspect ratio.

Usage (from asset-dumper/):
  python scripts/composite_melee_punch_icons.py
"""

from __future__ import annotations

import urllib.request
from io import BytesIO
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]  # runelogs/
PROBE = ROOT / "src" / "assets" / "_punch_probe"
OUT_ROOT = ROOT / "public" / "images" / "npc-attacks"
CHISEL = "https://chisel.weirdgloop.org/static/img/osrs-npc/{npc_id}_128.png"

PUNCH_CANDIDATES = [
    PROBE / "unarmed_punch.png",
    OUT_ROOT / "combat" / "punch.png",
]

# (npc moid id, label, relative output path under npc-attacks/)
JOBS = [
    (14707, "mokhaiotl", "mokhaiotl/melee.png"),
    (7698, "jal-xil", "inferno/ranger-melee.png"),
    (7699, "jal-zek", "inferno/mager-melee.png"),
    (7700, "jaltok-jad", "inferno/jad-melee.png"),
]

MAX_DIM = 128
# Absolute punch size as on inferno/mager-melee.png (max side 81 → 81×60
# after content-crop of the 20×16 sprite). Do NOT scale relative to moid.
PUNCH_MAX_SIDE = 81


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


def content_crop(im: Image.Image, pad: int = 2) -> Image.Image:
    bbox = im.getbbox()
    if not bbox:
        return im
    l, t, r, b = bbox
    return im.crop(
        (
            max(0, l - pad),
            max(0, t - pad),
            min(im.width, r + pad),
            min(im.height, b + pad),
        )
    )


def fit_max(im: Image.Image, max_dim: int) -> Image.Image:
    w, h = im.size
    scale = min(max_dim / w, max_dim / h, 1.0)
    if scale >= 0.999:
        return im
    return im.resize(
        (max(1, int(round(w * scale))), max(1, int(round(h * scale)))),
        Image.Resampling.LANCZOS,
    )


def scale_punch(punch: Image.Image, max_side: int = PUNCH_MAX_SIDE) -> Image.Image:
    overlay = content_crop(near_black_to_alpha(punch), pad=0)
    ow, oh = overlay.size
    scale = max_side / max(ow, oh)
    return overlay.resize(
        (max(1, int(round(ow * scale))), max(1, int(round(oh * scale)))),
        Image.Resampling.NEAREST,
    )


def composite_moid_punch(
    moid: Image.Image,
    punch: Image.Image,
    max_dim: int = MAX_DIM,
    punch_max_side: int = PUNCH_MAX_SIDE,
) -> Image.Image:
    # Moid sizing unchanged (content-crop + max 128). Canvas may grow with
    # transparent padding when the fixed punch is larger than the moid.
    base = fit_max(content_crop(near_black_to_alpha(moid)), max_dim)
    overlay = scale_punch(punch, punch_max_side)
    cw = max(base.width, overlay.width)
    ch = max(base.height, overlay.height)
    canvas = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
    canvas.alpha_composite(
        base, ((cw - base.width) // 2, (ch - base.height) // 2)
    )
    canvas.alpha_composite(
        overlay, ((cw - overlay.width) // 2, (ch - overlay.height) // 2)
    )
    return canvas


def resolve_punch_path() -> Path:
    for path in PUNCH_CANDIDATES:
        if path.exists():
            return path
    raise SystemExit(
        "Missing punch sprite. Dump sprite 247 first:\n"
        "  .\\dump-hiscore-sprites.ps1 -CacheDir $env:OSRS_CACHE_DIR "
        "-Config config/combat-style-punch.json\n"
        f"Tried: {', '.join(str(p) for p in PUNCH_CANDIDATES)}"
    )


def fetch_moid(npc_id: int) -> Image.Image:
    named = list(PROBE.glob(f"moid_{npc_id}_*.png"))
    if named:
        return Image.open(named[0]).convert("RGBA")
    local = PROBE / f"moid_{npc_id}.png"
    if local.exists():
        return Image.open(local).convert("RGBA")
    url = CHISEL.format(npc_id=npc_id)
    req = urllib.request.Request(url, headers={"User-Agent": "runelogs-asset-script"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        im = Image.open(BytesIO(resp.read())).convert("RGBA")
    PROBE.mkdir(parents=True, exist_ok=True)
    im.save(local)
    return im


def main() -> None:
    punch_path = resolve_punch_path()
    punch = Image.open(punch_path)
    print(f"punch source: {punch_path}")

    punch_alpha = near_black_to_alpha(punch)
    combat_dir = OUT_ROOT / "combat"
    combat_dir.mkdir(parents=True, exist_ok=True)
    punch_alpha.save(combat_dir / "punch.png")
    punch_alpha.save(combat_dir / "punch.webp", "WEBP", lossless=True)

    overlay = scale_punch(punch)
    print(f"fixed punch overlay: {overlay.size[0]}x{overlay.size[1]} (max side {PUNCH_MAX_SIDE})")

    for npc_id, _name, rel in JOBS:
        moid = fetch_moid(npc_id)
        comp = composite_moid_punch(moid, punch)
        out = OUT_ROOT / rel
        out.parent.mkdir(parents=True, exist_ok=True)
        comp.save(out)
        print(f"wrote {rel} {comp.size}")


if __name__ == "__main__":
    main()
