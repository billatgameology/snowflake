#!/usr/bin/env bash
# Extract one frame every N seconds from a video into a folder named after the file.
# Usage: extract-frames.sh <video-file> [interval-seconds]   (default interval: 0.5)
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: $0 <video-file> [interval-seconds]" >&2
  exit 1
fi

VIDEO="$1"
INTERVAL="${2:-0.5}"

if [ ! -f "$VIDEO" ]; then
  echo "Error: file not found: $VIDEO" >&2
  exit 1
fi

BASENAME="$(basename "$VIDEO")"
NAME="${BASENAME%.*}"
OUTDIR="$(dirname "$VIDEO")/$NAME"

mkdir -p "$OUTDIR"

# fps = 1/interval; -q:v 2 for high-quality JPEG
ffmpeg -hide_banner -loglevel info -i "$VIDEO" \
  -vf "fps=1/$INTERVAL" -q:v 2 \
  "$OUTDIR/frame_%05d.jpg"

echo "Done. Frames written to: $OUTDIR"
