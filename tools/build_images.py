#!/usr/bin/env python3
"""Resize source photos into web-sized AVIFs and keep photos.json in sync.

Usage:
    python3 tools/build_images.py [SOURCE_DIR]

SOURCE_DIR defaults to "RAW PHOTOS". Every image in it or its subfolders
(jpg, jpeg, png, tif, heic, avif) becomes two files in images/web/:
    <name>-800.avif   used in grids and on phones
    <name>-1600.avif  used in the full-screen viewer and on large screens

Folder names tag the photos, so sort them like this:
    RAW PHOTOS/2025/Madrid/roll-12-04.jpg   -> year 2025, place Madrid
    RAW PHOTOS/2025/photo.jpg               -> year 2025, no place
    RAW PHOTOS/Madrid/photo.jpg             -> place Madrid, no year

photos.json is updated in place: new photos are appended, tags typed by
hand in photos.json win over folder names, and photos no longer in
SOURCE_DIR are removed (along with their files in images/web/).
Re-running is safe; already-built sizes are skipped.
"""
import json
import re
import subprocess
import sys
import unicodedata
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "images" / "web"
DATA = ROOT / "photos.json"
SIZES = (800, 1600)
QUALITY = 55
EXTS = {".jpg", ".jpeg", ".png", ".tif", ".tiff", ".heic", ".avif"}


def dimensions(path):
    out = subprocess.run(
        ["magick", "identify", "-format", "%w %h", f"{path}[0]"],
        check=True, capture_output=True, text=True,
    ).stdout
    w, h = map(int, out.split())
    return w, h


def folder_tags(src, src_dir):
    """Year and place from the folders between SOURCE_DIR and the file."""
    year = place = None
    for part in src.relative_to(src_dir).parts[:-1]:
        # macOS stores accents decomposed; keep "Bogotá" as one character per letter.
        part = unicodedata.normalize("NFC", part)
        if re.fullmatch(r"(19|20)\d\d", part):
            year = int(part)
        else:
            place = part
    return year, place


def web_names(sources):
    """A unique, URL-safe output name for each source file."""
    names, taken = {}, set()
    for src in sources:
        base = re.sub(r"[^A-Za-z0-9_-]+", "-", src.stem).strip("-") or "photo"
        name, n = base, 2
        while name in taken:
            name, n = f"{base}-{n}", n + 1
        taken.add(name)
        names[src] = name
    return names


def build(src, name, force):
    w, h = dimensions(src)
    for size in SIZES:
        dest = OUT_DIR / f"{name}-{size}.avif"
        if dest.exists() and not force:
            continue
        subprocess.run(
            ["magick", f"{src}[0]", "-auto-orient", "-strip",
             "-resize", f"{size}x{size}>",
             "-quality", str(QUALITY), str(dest)],
            check=True,
        )
    # Size of the largest output, which is what the layout uses for aspect ratio.
    scale = min(1, max(SIZES) / max(w, h))
    return name, round(w * scale), round(h * scale)


def main():
    src_dir = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "RAW PHOTOS"
    # Newest year first, so new photos land at the top of the feed.
    sources = sorted((p for p in src_dir.rglob("*") if p.suffix.lower() in EXTS),
                     key=lambda p: (-(folder_tags(p, src_dir)[0] or 0), p.as_posix()))
    if not sources:
        sys.exit(f"No images found in {src_dir}")
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    names = web_names(sources)
    rel = {s: s.relative_to(src_dir).as_posix() for s in sources}

    data = json.loads(DATA.read_text()) if DATA.exists() else {"photos": []}
    by_file = {p["file"]: p for p in data["photos"]}
    # A name now pointing at a different source file must be rebuilt and retagged.
    changed = {s for s in sources if by_file.get(names[s], {}).get("source") != rel[s]}

    with ThreadPoolExecutor() as pool:
        results = list(pool.map(
            lambda s: (s, *build(s, names[s], s in changed)), sources))

    added = 0
    for src, name, w, h in results:
        entry = by_file.get(name)
        if entry is None:
            entry = {"file": name, "year": None, "place": None, "caption": ""}
            data["photos"].append(entry)
            by_file[name] = entry
            added += 1
        year, place = folder_tags(src, src_dir)
        if src in changed:
            entry["year"], entry["place"] = year, place
        else:
            entry["year"] = entry["year"] or year
            entry["place"] = entry["place"] or place
        entry["source"] = rel[src]
        entry["w"], entry["h"] = w, h

    # Drop photos that are no longer part of the selection.
    keep = set(names.values())
    removed = [p["file"] for p in data["photos"] if p["file"] not in keep]
    data["photos"] = [p for p in data["photos"] if p["file"] in keep]
    for name in removed:
        for size in SIZES:
            (OUT_DIR / f"{name}-{size}.avif").unlink(missing_ok=True)

    DATA.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n")
    untagged = sum(1 for p in data["photos"] if not (p["year"] and p["place"]))
    print(f"{len(data['photos'])} photos: {added} added, {len(removed)} removed, "
          f"{untagged} still missing a year or place")


if __name__ == "__main__":
    main()
