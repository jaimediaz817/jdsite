import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent / "backend" / "blogs_source"

for md in BASE_DIR.rglob("*.md"):
    with open(md, "a", encoding="utf-8") as f:
        f.write("\n<!-- reimport 2026-05-06 -->\n")
