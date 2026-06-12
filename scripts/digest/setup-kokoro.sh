#!/usr/bin/env bash
# One-time setup for the local Kokoro TTS venv used by tts-render.mjs.
#
#   scripts/digest/setup-kokoro.sh            # installs to ~/.venvs/kokoro-tts
#   KOKORO_VENV=/path scripts/digest/setup-kokoro.sh
#
# CPU-only torch is installed deliberately: Kokoro is 82M params and renders a
# 45-minute episode in a few minutes on CPU, and the small wheel keeps the venv
# light. The spaCy en_core_web_sm wheel must be installed explicitly — kokoro's
# G2P dependency (misaki) auto-downloads it into the wrong environment otherwise.
set -euo pipefail

VENV="${KOKORO_VENV:-$HOME/.venvs/kokoro-tts}"
SPACY_WHEEL="https://github.com/explosion/spacy-models/releases/download/en_core_web_sm-3.8.0/en_core_web_sm-3.8.0-py3-none-any.whl"

if command -v uv >/dev/null 2>&1; then
  uv venv "$VENV"
  uv pip install -p "$VENV/bin/python" kokoro soundfile torch \
    --index-strategy unsafe-best-match --extra-index-url https://download.pytorch.org/whl/cpu
  uv pip install -p "$VENV/bin/python" "$SPACY_WHEEL"
else
  python3 -m venv "$VENV"
  "$VENV/bin/pip" install kokoro soundfile torch --extra-index-url https://download.pytorch.org/whl/cpu
  "$VENV/bin/pip" install "$SPACY_WHEEL"
fi

"$VENV/bin/python" -c "
import spacy; spacy.load('en_core_web_sm')
from kokoro import KPipeline
print('[setup-kokoro] imports OK —', '$VENV')
"
echo "[setup-kokoro] done. First render downloads hexgrad/Kokoro-82M into the HF cache; offline after that."
