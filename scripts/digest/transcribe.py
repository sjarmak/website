#!/usr/bin/env python3
"""Transcribe digest podcast MP3s into the `transcripts` content collection.

The reverse of `tts-render.mjs`: that renders a script to audio; this recovers
the spoken text from audio (the script itself is ephemeral and not committed).
Output files are joined to digest issues / podcast episodes by `audioUrl`, so a
transcript automatically appears under its audio entry on the site.

Usage:
  # GPU (needs the CUDA runtime libs on LD_LIBRARY_PATH — see setup below)
  LD_LIBRARY_PATH="$(python -c 'import glob,nvidia,os;b=list(nvidia.__path__)[0];print(":".join(sorted({os.path.dirname(p) for p in glob.glob(b+"/**/lib/*.so*",recursive=True)})))')" \
    python scripts/digest/transcribe.py

  python scripts/digest/transcribe.py --device cpu --model small.en   # no GPU
  python scripts/digest/transcribe.py --only daily-2026-06-17         # one file
  python scripts/digest/transcribe.py --force                         # re-transcribe

Setup (one-time): pip install faster-whisper nvidia-cublas-cu12 nvidia-cudnn-cu12
"""

import argparse
import glob
import os
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
AUDIO_DIR = ROOT / "public" / "media" / "digests"
DIGEST_DIR = ROOT / "src" / "content" / "digest"
OUT_DIR = ROOT / "transcripts"


def digest_titles() -> dict[str, str]:
    """Map audioUrl -> issue title by scanning the digest collection frontmatter."""
    titles: dict[str, str] = {}
    for md in DIGEST_DIR.glob("*.md"):
        text = md.read_text(encoding="utf-8")
        fm = re.match(r"^---\n(.*?)\n---\n", text, re.DOTALL)
        if not fm:
            continue
        block = fm.group(1)
        audio = re.search(r'^audioUrl:\s*"?([^"\n]+)"?\s*$', block, re.MULTILINE)
        title = re.search(r'^title:\s*"?(.+?)"?\s*$', block, re.MULTILINE)
        if audio and title:
            titles[audio.group(1).strip()] = title.group(1).strip()
    return titles


def to_paragraphs(text: str) -> str:
    """Group the model's sentence stream into readable paragraphs (~4 sentences)."""
    sentences = re.findall(r"[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$", text.strip())
    paras, cur = [], []
    for s in sentences:
        s = s.strip()
        if not s:
            continue
        cur.append(s)
        if len(cur) >= 4:
            paras.append(" ".join(cur))
            cur = []
    if cur:
        paras.append(" ".join(cur))
    return "\n\n".join(paras)


def yaml_quote(s: str) -> str:
    return s.replace('"', '\\"')


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--model", default="large-v3")
    ap.add_argument("--device", default="cuda", choices=["cuda", "cpu"])
    ap.add_argument("--compute-type", default=None, help="default: float16 on cuda, int8 on cpu")
    ap.add_argument("--only", default=None, help="transcribe only this basename (no .mp3)")
    ap.add_argument("--force", action="store_true", help="overwrite existing transcripts")
    args = ap.parse_args()

    compute_type = args.compute_type or ("float16" if args.device == "cuda" else "int8")
    titles = digest_titles()
    OUT_DIR.mkdir(exist_ok=True)

    mp3s = sorted(AUDIO_DIR.glob("*.mp3"))
    if args.only:
        mp3s = [p for p in mp3s if p.stem == args.only]
    if not mp3s:
        print("no MP3s matched", file=sys.stderr)
        return 1

    from faster_whisper import WhisperModel

    print(f"[transcribe] loading {args.model} on {args.device} ({compute_type})", file=sys.stderr)
    model = WhisperModel(args.model, device=args.device, compute_type=compute_type)

    for mp3 in mp3s:
        out = OUT_DIR / f"{mp3.stem}.md"
        if out.exists() and not args.force:
            print(f"[transcribe] skip {mp3.stem} (exists)", file=sys.stderr)
            continue
        audio_url = f"/media/digests/{mp3.name}"
        title = titles.get(audio_url, mp3.stem)

        print(f"[transcribe] {mp3.stem} …", file=sys.stderr)
        segments, info = model.transcribe(str(mp3), beam_size=5, vad_filter=True)
        text = " ".join(seg.text.strip() for seg in segments).strip()
        body = to_paragraphs(text)
        words = len(text.split())
        duration_min = round(info.duration / 60, 1)

        fm = (
            "---\n"
            f'title: "{yaml_quote(title)}"\n'
            f"audioUrl: {audio_url}\n"
            f"durationMin: {duration_min}\n"
            f"words: {words}\n"
            "---\n\n"
        )
        out.write_text(fm + body + "\n", encoding="utf-8")
        print(f"[transcribe]   -> {out.relative_to(ROOT)} ({words} words, {duration_min} min)", file=sys.stderr)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
