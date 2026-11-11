import os
from pathlib import Path
from pydantic_settings import BaseSettings

# Fix for Intel OpenMP runtime duplicate error on Windows
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

# Base directory of backend and project
BACKEND_DIR = Path(__file__).resolve().parent.parent
PROJECT_ROOT = BACKEND_DIR.parent
STORAGE_DIR = PROJECT_ROOT / "local_storage"

class Settings(BaseSettings):
    APP_NAME: str = "VocaFlow AI"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    # Storage paths
    STORAGE_DIR: Path = STORAGE_DIR
    AUDIO_DIR: Path = STORAGE_DIR / "audio"
    STEMS_DIR: Path = STORAGE_DIR / "stems"
    RECORDINGS_DIR: Path = STORAGE_DIR / "recordings"
    LYRICS_DIR: Path = STORAGE_DIR / "lyrics"
    ARTWORKS_DIR: Path = STORAGE_DIR / "artworks"
    DATABASE_PATH: Path = STORAGE_DIR / "vocaflow.db"
    
    # Audio Separation
    DEFAULT_DEMUCS_MODEL: str = "htdemucs"
    DEFAULT_QUALITY: str = "balanced"  # fast, balanced, high
    SEPARATION_WORKERS: int = 2
    
    # Host & Port
    HOST: str = "127.0.0.1"
    PORT: int = 8000
    
    # Maximum upload size (50MB)
    MAX_UPLOAD_SIZE: int = 50 * 1024 * 1024

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()

# Ensure directories exist
for folder in [
    settings.STORAGE_DIR,
    settings.AUDIO_DIR,
    settings.STEMS_DIR,
    settings.RECORDINGS_DIR,
    settings.LYRICS_DIR,
    settings.ARTWORKS_DIR,
]:
    folder.mkdir(parents=True, exist_ok=True)

