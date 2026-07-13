"""Isolate Mokhaiotl ranged-ball sphere from a dump, preserving RGBA.

Do NOT paste onto opaque black or force alpha to 255 — that was the prior bug.
Dump first with camera framing (see assets.json id 3384), then run:

  python scripts/isolate_mok_ball.py path/to/dump.png path/to/3384.png
"""
from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage


def isolate_sphere(
    src: Path,
    dest: Path,
    *,
    target: int = 256,
    pad: int = 10,
    margin_frac: float = 0.12,
) -> None:
    im = np.asarray(Image.open(src).convert("RGBA"))
    a = im[..., 3] > 0
    r = im[..., 0].astype(np.int16)
    g = im[..., 1].astype(np.int16)
    b = im[..., 2].astype(np.int16)

    body = ((g + 15 >= r) & (g > b + 5) & ((r + g + b) > 80) & a) | (
        (np.abs(r - g) < 35) & (g > b + 10) & (r > 90) & (b < 110) & a
    )
    body &= ~((r > 55) & (r > g * 1.2) & (r > b * 1.3) & (g < 90))
    body &= ~((r > 130) & (b < 90) & (r > g + 15))
    body = ndimage.binary_opening(body, iterations=1)

    labels, n = ndimage.label(body)
    if n == 0:
        raise SystemExit(f"No sphere component found in {src}")

    sizes = ndimage.sum(body, labels, range(1, n + 1))
    best_i = None
    best_score = -1.0
    for i in range(1, n + 1):
        size = float(sizes[i - 1])
        if size < 500:
            continue
        ys, xs = np.where(labels == i)
        bw = int(xs.max() - xs.min() + 1)
        bh = int(ys.max() - ys.min() + 1)
        # Prefer fully in-frame, circular components.
        if xs.min() == 0 or ys.min() == 0 or xs.max() == im.shape[1] - 1 or ys.max() == im.shape[0] - 1:
            continue
        circ = size / (max(bw, bh) ** 2)
        aspect = min(bw, bh) / max(bw, bh)
        score = circ * aspect * (size ** 0.5)
        if score > best_score:
            best_score = score
            best_i = i

    if best_i is None:
        raise SystemExit(f"No unclipped sphere component found in {src}")

    keep = ndimage.binary_dilation(labels == best_i, iterations=1)
    out = np.zeros_like(im)
    out[keep] = im[keep]  # preserve original RGB and alpha

    ys, xs = np.where(keep)
    y0 = max(0, int(ys.min()) - pad)
    y1 = min(im.shape[0] - 1, int(ys.max()) + pad)
    x0 = max(0, int(xs.min()) - pad)
    x1 = min(im.shape[1] - 1, int(xs.max()) + pad)
    cropped = out[y0 : y1 + 1, x0 : x1 + 1]
    ch, cw = cropped.shape[:2]

    side = int(round(max(ch, cw) / (1 - 2 * margin_frac)))
    # Transparent canvas — never (0,0,0,255).
    canvas = np.zeros((side, side, 4), dtype=np.uint8)
    oy = (side - ch) // 2
    ox = (side - cw) // 2
    canvas[oy : oy + ch, ox : ox + cw] = cropped

    final = Image.fromarray(canvas, "RGBA").resize((target, target), Image.Resampling.LANCZOS)
    dest.parent.mkdir(parents=True, exist_ok=True)
    final.save(dest)
    arr = np.asarray(final)
    print(
        f"Wrote {dest} size={final.size} "
        f"transparent={(arr[..., 3] == 0).sum()} "
        f"opaque={(arr[..., 3] == 255).sum()} "
        f"partial={((arr[..., 3] > 0) & (arr[..., 3] < 255)).sum()}"
    )


def main() -> None:
    if len(sys.argv) != 3:
        print(__doc__)
        raise SystemExit(2)
    isolate_sphere(Path(sys.argv[1]), Path(sys.argv[2]))


if __name__ == "__main__":
    main()
