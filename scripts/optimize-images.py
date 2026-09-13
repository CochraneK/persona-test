#!/usr/bin/env python3
"""Safely recompress oversized JPEG assets in-place.

Keeps file names/paths stable so the static app does not need rewritten image URLs.
Only replaces a file when the optimized result is at least 8% smaller.
"""
from __future__ import annotations

import argparse
import io
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
IMG_DIR = ROOT / "img"


def optimize(path: Path, *, max_edge: int, quality: int, min_bytes: int, write: bool) -> tuple[int, int, bool]:
    original = path.read_bytes()
    before = len(original)
    try:
        with Image.open(io.BytesIO(original)) as src:
            src = ImageOps.exif_transpose(src)
            width, height = src.size
            if before < min_bytes and max(width, height) <= max_edge:
                return before, before, False
            if src.mode not in ("RGB", "L"):
                src = src.convert("RGB")
            if max(src.size) > max_edge:
                ratio = max_edge / max(src.size)
                src = src.resize((max(1, round(src.width * ratio)), max(1, round(src.height * ratio))), Image.Resampling.LANCZOS)
            out = io.BytesIO()
            src.save(out, format="JPEG", quality=quality, optimize=True, progressive=True)
            optimized = out.getvalue()
    except Exception as exc:
        print(f"WARN cannot optimize {path.relative_to(ROOT)}: {exc}")
        return before, before, False

    after = len(optimized)
    if after >= before * 0.92:
        return before, before, False
    if write:
        path.write_bytes(optimized)
    return before, after, True


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--write", action="store_true", help="replace files in-place")
    parser.add_argument("--max-edge", type=int, default=1400)
    parser.add_argument("--quality", type=int, default=82)
    parser.add_argument("--min-kb", type=int, default=300)
    args = parser.parse_args()

    if not IMG_DIR.exists():
        raise SystemExit("img/ directory not found")

    total_before = total_after = changed = 0
    for path in sorted(IMG_DIR.iterdir()):
        if path.suffix.lower() not in {".jpg", ".jpeg"}:
            continue
        before, after, did_change = optimize(
            path,
            max_edge=args.max_edge,
            quality=args.quality,
            min_bytes=args.min_kb * 1024,
            write=args.write,
        )
        total_before += before
        total_after += after
        if did_change:
            changed += 1
            mode = "optimized" if args.write else "would optimize"
            print(f"{mode}: {path.relative_to(ROOT)} {before/1024:.0f}KB -> {after/1024:.0f}KB")

    saved = total_before - total_after
    print(f"files changed: {changed}; estimated saved: {saved/1024/1024:.2f}MB")
    if not args.write:
        print("dry run only; pass --write to replace files")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
