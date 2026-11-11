import os
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import init_db, get_db
from app.services.audio_service import AudioService
from app.services.lyrics_service import LyricsService, DEFAULT_RATHINAMO_LRC
from app.storage.file_storage import FileStorage

from app.api.audio import router as audio_router
from app.api.separation import router as separation_router
from app.api.lyrics import router as lyrics_router
from app.api.recording import router as recording_router
from app.api.singing import router as singing_router
from app.api.library import router as library_router
from app.api.history import router as history_router
from app.api.settings_api import router as settings_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite database
    init_db()
    print("Database initialized successfully.")
    
    # Auto-seed initial track if database has no tracks
    with get_db() as db:
        count = db.execute("SELECT COUNT(*) as c FROM tracks").fetchone()["c"]
        if count == 0:
            candidate_files = [
                settings.AUDIO_DIR / "Rathinamo.mp3",
                settings.STORAGE_DIR.parent.parent / "Rathinamo.mp3"
            ]
            for cf in candidate_files:
                if cf.exists():
                    print(f"Auto-importing sample track: {cf.name}")
                    track_info = AudioService.register_audio_file(cf, custom_title="Rathinamo")
                    # Auto-import lyrics for Rathinamo
                    LyricsService.save_lyrics(track_info["id"], DEFAULT_RATHINAMO_LRC, "lrc")
                    break
                    
    yield

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="VocaFlow AI Backend: AI-Powered Smart Karaoke & Music Source Separation",
    lifespan=lifespan
)

# Enable CORS for React frontend (Vite dev server & production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Range", "Accept-Ranges", "Content-Length"],
)

# Mount API Routers
app.include_router(audio_router)
app.include_router(separation_router)
app.include_router(lyrics_router)
app.include_router(recording_router)
app.include_router(singing_router)
app.include_router(library_router)
app.include_router(history_router)
app.include_router(settings_router)

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "pytorch": "CPU",
        "demucs": "ready"
    }

# Mount Frontend static files for full out-of-the-box UI
frontend_dist = settings.STORAGE_DIR.parent / "frontend" / "dist"
if frontend_dist.exists():
    app.mount("/", StaticFiles(directory=str(frontend_dist), html=True), name="frontend")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
