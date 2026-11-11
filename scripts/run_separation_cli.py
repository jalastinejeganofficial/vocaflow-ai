#!/usr/bin/env python3
"""
VocaFlow AI - Standalone CLI Separation Tool
Usage:
    python run_separation_cli.py <audio_path> [--quality {fast,balanced,high}] [--output <dir>]
"""
import argparse
import sys
import os
from pathlib import Path

os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"
BACKEND_DIR = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(BACKEND_DIR))

from app.separation.demucs_engine import DemucsEngine

def main():
    parser = argparse.ArgumentParser(description="VocaFlow AI Source Separation CLI")
    parser.add_argument("audio_path", type=str, help="Path to input audio file (MP3, WAV, FLAC, M4A)")
    parser.add_argument("--quality", choices=["fast", "balanced", "high"], default="balanced", help="Separation quality")
    parser.add_argument("--model", type=str, default="htdemucs", help="Demucs model name")
    parser.add_argument("--output", type=str, default="separated_stems", help="Output directory")

    args = parser.parse_args()
    input_p = Path(args.audio_path).resolve()

    if not input_p.exists():
        print(f"Error: Audio file not found at {input_p}")
        sys.exit(1)

    out_dir = Path(args.output).resolve()
    print("=" * 60)
    print(f"  VOCAFLOW AI - SOURCE SEPARATION CLI")
    print(f"  Input: {input_p.name}")
    print(f"  Quality: {args.quality} | Model: {args.model}")
    print(f"  Output Dir: {out_dir}")
    print("=" * 60)

    engine = DemucsEngine(model_name=args.model)

    def on_progress(pct: float, msg: str):
        bar_len = 30
        filled = int(round(bar_len * pct / 100))
        bar = '=' * filled + '-' * (bar_len - filled)
        sys.stdout.write(f"\r  [{bar}] {pct:5.1f}% - {msg}    ")
        sys.stdout.flush()

    try:
        results = engine.separate(
            input_audio_path=input_p,
            output_dir=out_dir,
            quality=args.quality,
            progress_callback=on_progress
        )
        print("\n\nSeparation Successful!")
        print(f"  -> Instrumental: {results['instrumental']}")
        print(f"  -> Vocals:       {results['vocal']}")
    except Exception as e:
        print(f"\nSeparation failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()

