import os
import sys
import subprocess
import shutil
import re
from pathlib import Path
from typing import Callable, Optional
from app.config import settings
from app.separation.spectral_fallback import fast_spectral_separation

class DemucsEngine:
    """Wrapper for Facebook Research Demucs Music Source Separation Engine."""
    
    def __init__(self, model_name: str = "htdemucs"):
        self.model_name = model_name
        
    def separate(
        self,
        input_audio_path: Path,
        output_dir: Path,
        quality: str = "balanced",
        progress_callback: Optional[Callable[[float, str], None]] = None,
        cancel_check: Optional[Callable[[], bool]] = None
    ) -> dict:
        """
        Executes vocal separation on the given audio file.
        Returns dict with paths: {'vocal': Path, 'instrumental': Path}
        """
        output_dir.mkdir(parents=True, exist_ok=True)
        vocal_target = output_dir / "vocals.wav"
        inst_target = output_dir / "instrumental.wav"
        
        # If fast quality requested, use optimized spectral separator immediately
        if quality.lower() == "fast":
            if progress_callback:
                progress_callback(15.0, "Decoding audio & building stereo spectrum...")
            success = fast_spectral_separation(input_audio_path, vocal_target, inst_target)
            if success:
                if progress_callback:
                    progress_callback(100.0, "AI Vocal Removal completed.")
                return {"vocal": vocal_target, "instrumental": inst_target}
            else:
                raise RuntimeError("Fast spectral separation failed.")
                
        # For balanced or high quality, execute Demucs
        shifts = "1" if quality.lower() == "balanced" else "2"
        model = self.model_name
        
        # Temp output folder for demucs raw output
        demucs_temp = output_dir / "demucs_raw"
        demucs_temp.mkdir(parents=True, exist_ok=True)
        
        cmd = [
            sys.executable,
            "-m", "demucs.separate",
            "--two-stems", "vocals",
            "-d", "cpu",
            "-n", model,
            "--shifts", shifts,
            "-o", str(demucs_temp),
            str(input_audio_path)
        ]
        
        env = os.environ.copy()
        env["KMP_DUPLICATE_LIB_OK"] = "TRUE"
        env["PYTHONUNBUFFERED"] = "1"
        
        if progress_callback:
            progress_callback(5.0, f"Loading AI model ({model})...")
            
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            bufsize=0,
            env=env
        )
        
        percent_pattern = re.compile(r"(\d+)%\|")
        
        try:
            buf = bytearray()
            while True:
                if cancel_check and cancel_check():
                    process.terminate()
                    raise RuntimeError("Separation job was cancelled by user.")

                chunk = process.stdout.read(1)
                if not chunk:
                    break
                if chunk in (b"\r", b"\n"):
                    line_str = buf.decode("utf-8", errors="ignore").strip()
                    buf.clear()
                    if line_str:
                        match = percent_pattern.search(line_str)
                        if match:
                            raw_pct = float(match.group(1))
                            # Map demucs 0-100% to overall 10%-95%
                            mapped_progress = 10.0 + (raw_pct * 0.85)
                            if progress_callback:
                                progress_callback(mapped_progress, f"AI Removing Vocals: {int(raw_pct)}%")
                        elif "Separated tracks" in line_str or "Saving" in line_str:
                            if progress_callback:
                                progress_callback(96.0, "Finalizing pristine instrumental & vocal stems...")
                else:
                    buf.extend(chunk)
                        
            process.wait()
            
            if process.returncode != 0:
                print(f"Demucs failed with code {process.returncode}, falling back to spectral filter...")
                # Automatic fallback to ensure seamless user experience
                success = fast_spectral_separation(input_audio_path, vocal_target, inst_target)
                if not success:
                    raise RuntimeError(f"Demucs process exited with code {process.returncode}")
                if progress_callback:
                    progress_callback(100.0, "Separation completed with fallback engine.")
                return {"vocal": vocal_target, "instrumental": inst_target}
                
            # Demucs places files in: demucs_temp / model / <track_name> / [vocals.wav, no_vocals.wav]
            track_stem = input_audio_path.stem
            model_out_dir = demucs_temp / model / track_stem
            
            # Look for generated files
            raw_vocals = model_out_dir / "vocals.wav"
            raw_inst = model_out_dir / "no_vocals.wav"
            
            if not raw_vocals.exists() or not raw_inst.exists():
                # Check directly in model_out_dir for any wav files
                wav_files = list(model_out_dir.glob("*.wav"))
                for wf in wav_files:
                    if "vocals" in wf.name.lower() and "no_vocals" not in wf.name.lower():
                        raw_vocals = wf
                    elif "no_vocals" in wf.name.lower() or "instrumental" in wf.name.lower():
                        raw_inst = wf
                        
            if not raw_vocals.exists() or not raw_inst.exists():
                raise FileNotFoundError(f"Demucs output files not found in {model_out_dir}")
                
            # Copy to final destination
            shutil.copy2(raw_vocals, vocal_target)
            shutil.copy2(raw_inst, inst_target)
            
            # Clean up temp folder
            shutil.rmtree(demucs_temp, ignore_errors=True)
            
            if progress_callback:
                progress_callback(100.0, "Vocal separation finished successfully.")
                
            return {"vocal": vocal_target, "instrumental": inst_target}
            
        except Exception as e:
            if process.poll() is None:
                process.terminate()
            raise e

