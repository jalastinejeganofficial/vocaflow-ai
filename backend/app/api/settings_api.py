from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, Dict
from app.database import get_db
from app.storage.file_storage import FileStorage

router = APIRouter(prefix="/api/settings", tags=["Settings"])

class SettingsUpdate(BaseModel):
    separation_quality: Optional[str] = None
    separation_model: Optional[str] = None
    offline_mode: Optional[bool] = None

@router.get("")
async def get_settings():
    storage_stats = FileStorage.get_storage_stats()
    
    with get_db() as db:
        rows = db.execute("SELECT key, value FROM settings").fetchall()
        settings_dict = {r["key"]: r["value"] for r in rows}
        
    return {
        "storage": storage_stats,
        "separation_quality": settings_dict.get("separation_quality", "balanced"),
        "separation_model": settings_dict.get("separation_model", "htdemucs"),
        "offline_mode": settings_dict.get("offline_mode", "false") == "true",
        "audio_latency": "low (128 samples)",
        "version": "1.0.0"
    }

@router.post("")
async def update_settings(update: SettingsUpdate):
    with get_db() as db:
        if update.separation_quality is not None:
            db.execute("INSERT OR REPLACE INTO settings (key, value) VALUES ('separation_quality', ?)", (update.separation_quality,))
        if update.separation_model is not None:
            db.execute("INSERT OR REPLACE INTO settings (key, value) VALUES ('separation_model', ?)", (update.separation_model,))
        if update.offline_mode is not None:
            db.execute("INSERT OR REPLACE INTO settings (key, value) VALUES ('offline_mode', ?)", ("true" if update.offline_mode else "false",))
        db.commit()
    return {"status": "updated"}

@router.post("/clear-cache")
async def clear_cache():
    cleared = FileStorage.clear_stems_cache()
    # Mark tracks has_stems = 0
    with get_db() as db:
        db.execute("UPDATE tracks SET has_stems = 0, vocal_path = NULL, instrumental_path = NULL")
        db.commit()
    return {"cleared_folders": cleared, "storage": FileStorage.get_storage_stats()}

