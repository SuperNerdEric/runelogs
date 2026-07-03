#!/usr/bin/env python3
"""Downscale baked favicon master PNGs and build favicon.ico."""

import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public"
CIRCULAR_MASTER = PUBLIC / "favicon-render-512.png"
CIRCULAR_OUTPUTS: list[tuple[int, str]] = [
    (16, "favicon-16x16.png"),
    (32, "favicon-32x32.png"),
    (48, "favicon-48x48.png"),
    (150, "mstile-150x150.png"),
    (192, "android-chrome-192x192.png"),
    (512, "android-chrome-512x512.png"),
]
ICO_SIZES = [16, 32, 48]


def downscale_circular() -> None:
    if not CIRCULAR_MASTER.exists():
        raise SystemExit(
            f"Missing {CIRCULAR_MASTER}. Run: npm run generate-favicons",
        )

    master = Image.open(CIRCULAR_MASTER).convert("RGBA")
    for size, filename in CIRCULAR_OUTPUTS:
        path = PUBLIC / filename
        master.resize((size, size), Image.Resampling.LANCZOS).save(path, optimize=True)
        print(f"Wrote {path}")


def build_ico() -> None:
    images: list[Image.Image] = []
    for size in ICO_SIZES:
        path = PUBLIC / f"favicon-{size}x{size}.png"
        if not path.exists():
            raise SystemExit(f"Missing {path}. Run: npm run generate-favicons")
        images.append(Image.open(path).convert("RGBA"))

    ico_path = PUBLIC / "favicon.ico"
    images[0].save(
        ico_path,
        format="ICO",
        sizes=[(size, size) for size in ICO_SIZES],
        append_images=images[1:],
    )
    print(f"Wrote {ico_path}")


def main() -> None:
    if "--ico-only" in sys.argv:
        build_ico()
        return

    if "--downscale" in sys.argv:
        downscale_circular()
        build_ico()
        return

    print("Use: npm run generate-favicons", file=sys.stderr)
    sys.exit(1)


if __name__ == "__main__":
    main()
