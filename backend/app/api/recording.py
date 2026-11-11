import uuid
import shutil
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse
from app.config import settings
from app.storage.file_storage import FileStorage
from app.database import get_db
from app.schemas.recording import RecordingSaveResponse

router = APIRouter(prefix="/api/recording", tags=["Recording"])

@router.post("/save", response_model=RecordingSaveResponse)
async def save_recording(
    track_id: str = Form(...),
    duration: float = Form(0.0),
    effects: str = Form("{}"),
    audio_file: UploadFile = File(...)
):
    """Save user microphone vocal recording."""
    rec_id = str(uuid.uuid4())[:8]
    ext = Path(audio_file.filename).suffix.lstrip(".") or "wav"
    rec_path = FileStorage.get_recording_path(rec_id, ext)
    
    with open(rec_path, "wb") as buffer:
        shutil.copyfileobj(audio_file.file, buffer)
        
    with get_db() as db:
        db.execute("""
            INSERT INTO recordings (id, track_id, file_path, duration, effects_used)
            VALUES (?, ?, ?, ?, ?)
        """, (rec_id, track_id, str(rec_path), duration, effects))
        db.commit()
        
    return RecordingSaveResponse(
        id=rec_id,
        track_id=track_id,
        file_path=str(rec_path),
        recording_url=f"/api/recording/stream/{rec_id}",
        duration=duration,
        created_at="Just now"
    )

@router.get("/stream/{recording_id}")
async def stream_recording(recording_id: str):
    with get_db() as db:
        row = db.execute("SELECT file_path FROM recordings WHERE id = ?", (recording_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Recording not found")
            
    rec_p = Path(row["file_path"])
    if not rec_p.exists():
        raise HTTPException(status_code=404, detail="Recording audio file missing")
        
    return FileResponse(rec_p, media_type="audio/wav")

@router.get("/list/{track_id}")
async def list_recordings(track_id: str):
    with get_db() as db:
        rows = db.execute("""
            SELECT id, track_id, duration, created_at FROM recordings 
            WHERE track_id = ? ORDER BY created_at DESC
        """, (track_id,)).fetchall()
        
        return [
            {
                "id": r["id"],
                "track_id": r["track_id"],
                "recording_url": f"/api/recording/stream/{r['id']}",
                "duration": r["duration"],
                "created_at": str(r["created_at"])
            }
            for r in rows
        ]

