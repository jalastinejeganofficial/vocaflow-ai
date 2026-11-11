import shutil
from pathlib import Path
from app.config import settings

class FileStorage:
    @staticmethod
    def get_track_audio_path(track_id: str, ext: str = "mp3") -> Path:
        return settings.AUDIO_DIR / f"{track_id}.{ext}"

    @staticmethod
    def get_track_stems_dir(track_id: str) -> Path:
        stems_dir = settings.STEMS_DIR / track_id
        stems_dir.mkdir(parents=True, exist_ok=True)
        return stems_dir

    @staticmethod
    def get_vocal_path(track_id: str) -> Path:
        return FileStorage.get_track_stems_dir(track_id) / "vocals.wav"

    @staticmethod
    def get_instrumental_path(track_id: str) -> Path:
        return FileStorage.get_track_stems_dir(track_id) / "instrumental.wav"

    @staticmethod
    def get_recording_path(recording_id: str, ext: str = "wav") -> Path:
        return settings.RECORDINGS_DIR / f"{recording_id}.{ext}"

    @staticmethod
    def get_artwork_path(track_id: str) -> Path:
        return settings.ARTWORKS_DIR / f"{track_id}.jpg"

    @staticmethod
    def get_lyrics_path(track_id: str) -> Path:
        return settings.LYRICS_DIR / f"{track_id}.lrc"

    @staticmethod
    def get_storage_stats() -> dict:
        def folder_size(p: Path) -> int:
            if not p.exists():
                return 0
            return sum(f.stat().st_size for f in p.glob("**/*") if f.is_file())

        total_audio = folder_size(settings.AUDIO_DIR)
        total_stems = folder_size(settings.STEMS_DIR)
        total_recordings = folder_size(settings.RECORDINGS_DIR)
        
        return {
            "audio_mb": round(total_audio / (1024 * 1024), 2),
            "stems_mb": round(total_stems / (1024 * 1024), 2),
            "recordings_mb": round(total_recordings / (1024 * 1024), 2),
            "total_mb": round((total_audio + total_stems + total_recordings) / (1024 * 1024), 2)
        }

    @staticmethod
    def clear_stems_cache() -> int:
        count = 0
        for item in settings.STEMS_DIR.iterdir():
            if item.is_dir():
                shutil.rmtree(item, ignore_errors=True)
                count += 1
        return count

