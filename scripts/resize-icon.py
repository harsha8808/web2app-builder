#!/usr/bin/env python3
"""
resize-icon.py
Resizes /tmp/ic_launcher_src.png to correct dimensions for each mipmap density.
"""
import os
from PIL import Image

densities = {
    'mipmap-mdpi':     48,
    'mipmap-hdpi':     72,
    'mipmap-xhdpi':    96,
    'mipmap-xxhdpi':   144,
    'mipmap-xxxhdpi':  192,
}

for folder, size in densities.items():
    out_dir = f"app/src/main/res/{folder}"
    os.makedirs(out_dir, exist_ok=True)
    img = Image.open("/tmp/ic_launcher_src.png").convert("RGBA")
    img = img.resize((size, size), Image.LANCZOS)
    img.save(f"{out_dir}/ic_launcher.png")
    print(f"  Saved {folder}/ic_launcher.png ({size}x{size})")
