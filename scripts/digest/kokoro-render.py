#!/usr/bin/env python3
"""Render text chunks to WAV parts with local Kokoro-82M TTS.

Invoked by tts-render.mjs (one process per render so the model loads once):

    <kokoro-venv>/bin/python kokoro-render.py --chunks-dir <dir> [--voice am_onyx] [--speed 0.85]

Reads every chunk-NNN.txt in --chunks-dir and writes a matching part-NNN.wav
(24 kHz mono) beside it. Fully offline once the model weights are in the
Hugging Face cache (first run downloads hexgrad/Kokoro-82M).
"""

import argparse
import sys
import warnings
from pathlib import Path


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--chunks-dir", required=True)
    ap.add_argument("--voice", default="am_onyx")
    ap.add_argument("--speed", type=float, default=0.85)
    args = ap.parse_args()

    warnings.filterwarnings("ignore")  # torch RNN/weight_norm deprecation noise
    import numpy as np
    import soundfile as sf
    from kokoro import KPipeline

    chunk_files = sorted(Path(args.chunks_dir).glob("chunk-*.txt"))
    if not chunk_files:
        sys.exit(f"[kokoro] no chunk-*.txt files in {args.chunks_dir}")

    pipe = KPipeline(lang_code="a", repo_id="hexgrad/Kokoro-82M")
    for i, chunk_file in enumerate(chunk_files):
        text = chunk_file.read_text()
        segments = [audio for (_, _, audio) in pipe(text, voice=args.voice, speed=args.speed)]
        if not segments:
            sys.exit(f"[kokoro] {chunk_file.name} produced no audio segments")
        wav = np.concatenate([s.numpy() if hasattr(s, "numpy") else s for s in segments])
        out = chunk_file.with_name(f"part-{i:03d}.wav")
        sf.write(out, wav, 24000)
        print(f"[kokoro] {out.name}: {len(wav) / 24000:.0f}s", file=sys.stderr)


if __name__ == "__main__":
    main()
