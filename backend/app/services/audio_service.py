import json
import subprocess
import uuid
import shutil
from pathlib import Path
from typing import Optional, Dict, Any
from app.config import settings
from app.database import get_db
from app.storage.file_storage import FileStorage

class AudioService:
    @staticmethod
    def inspect_audio(file_path: Path) -> Dict[str, Any]:
        """Inspects audio file using ffprobe for duration, sample rate, channels, tags."""
        cmd = [
            "ffprobe",
            "-v", "quiet",
            "-print_format", "json",
            "-show_format",
            "-show_streams",
            str(file_path)
        ]
        
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, check=True)
            info = json.loads(result.stdout)
            
            fmt = info.get("format", {})
            duration = float(fmt.get("duration", 0.0))
            tags = fmt.get("tags", {})
            
            # Find audio stream
            audio_stream = next((s for s in info.get("streams", []) if s.get("codec_type") == "audio"), {})
            sample_rate = int(audio_stream.get("sample_rate", 48000))
            channels = int(audio_stream.get("channels", 2))
            
            title = tags.get("title") or tags.get("TITLE") or file_path.stem
            artist = tags.get("artist") or tags.get("ARTIST") or "Unknown Artist"
            album = tags.get("album") or tags.get("ALBUM") or "Single"
            
            # Clean common tag suffixes
            title = title.split(" - ")[0].strip()
            artist = artist.split(" - ")[0].strip()
            album = album.split(" - ")[0].strip()
            
            return {
                "title": title,
                "artist": artist,
                "album": album,
                "duration": round(duration, 2),
                "sample_rate": sample_rate,
                "channels": channels,
                "format": file_path.suffix.lstrip(".").lower()
            }
        except Exception as e:
            print(f"ffprobe extraction error: {e}")
            return {
                "title": file_path.stem,
                "artist": "Unknown Artist",
                "album": "Single",
                "duration": 0.0,
                "sample_rate": 48000,
                "channels": 2,
                "format": file_path.suffix.lstrip(".").lower()
            }

    @staticmethod
    def extract_cover_art(audio_path: Path, output_art_path: Path) -> bool:
        """Extracts embedded album cover art to jpg using ffmpeg."""
        cmd = [
            "ffmpeg", "-y",
            "-i", str(audio_path),
            "-an",
            "-vcodec", "copy",
            str(output_art_path)
        ]
        try:
            res = subprocess.run(cmd, capture_output=True, timeout=10)
            return output_art_path.exists() and output_art_path.stat().st_size > 0
        except Exception:
            return False

    @classmethod
    def register_audio_file(cls, source_file: Path, custom_title: Optional[str] = None) -> Dict[str, Any]:
        """Copies or imports audio into VocaFlow storage and indexes into DB."""
        meta = cls.inspect_audio(source_file)
        track_id = str(uuid.uuid4())[:8]
        
        target_audio = FileStorage.get_track_audio_path(track_id, meta["format"])
        shutil.copy2(source_file, target_audio)
        
        # Try extracting cover art
        target_art = FileStorage.get_artwork_path(track_id)
        has_art = cls.extract_cover_art(target_audio, target_art)
        artwork_path_str = str(target_art) if has_art else None
        
        title = custom_title or meta["title"]
        artist = meta["artist"]
        album = meta["album"]
        duration = meta["duration"]
        
        # Check if stems already exist for this file
        vocal_p = FileStorage.get_vocal_path(track_id)
        inst_p = FileStorage.get_instrumental_path(track_id)
        has_stems = 1 if (vocal_p.exists() and inst_p.exists()) else 0
        
        with get_db() as db:
            db.execute("""
                INSERT INTO tracks (
                    id, title, artist, album, duration, original_path,
                    artwork_path, format, sample_rate, channels, has_stems,
                    vocal_path, instrumental_path, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                track_id, title, artist, album, duration, str(target_audio),
                artwork_path_str, meta["format"], meta["sample_rate"], meta["channels"],
                has_stems,
                str(vocal_p) if has_stems else None,
                str(inst_p) if has_stems else None,
                "ready"
            ))
            db.commit()
            
        return {
            "id": track_id,
            "title": title,
            "artist": artist,
            "album": album,
            "duration": duration,
            "format": meta["format"],
            "has_stems": bool(has_stems),
            "artwork_path": artwork_path_str
        }

