import os
import shutil
import uuid
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException, status, Request
from fastapi.responses import FileResponse, StreamingResponse
from app.config import settings
from app.services.audio_service import AudioService
from app.storage.file_storage import FileStorage
from app.database import get_db

router = APIRouter(prefix="/api/audio", tags=["Audio"])

def send_partial_audio(path: Path, request: Request):
    """Supports HTTP 206 Partial Content range requests for instant scrubbing."""
    if not path.exists():
        raise HTTPException(status_code=404, detail="Audio file not found")
        
    stat = path.stat()
    file_size = stat.st_size
    range_header = request.headers.get("range")
    
    content_type = "audio/mpeg" if path.suffix.lower() == ".mp3" else "audio/wav"
    
    if not range_header:
        return FileResponse(path, media_type=content_type)
        
    # Range: bytes=start-end
    try:
        bytes_prefix = "bytes="
        if not range_header.startswith(bytes_prefix):
            return FileResponse(path, media_type=content_type)
            
        range_val = range_header[len(bytes_prefix):].strip()
        start_str, end_str = range_val.split("-")
        start = int(start_str) if start_str else 0
        end = int(end_str) if end_str else file_size - 1
        
        if start >= file_size or end >= file_size or start > end:
            raise HTTPException(status_code=416, detail="Requested Range Not Satisfiable")
            
        chunk_size = (end - start) + 1
        
        def iterfile():
            with open(path, "rb") as f:
                f.seek(start)
                bytes_left = chunk_size
                while bytes_left > 0:
                    read_len = min(64 * 1024, bytes_left)
                    data = f.read(read_len)
                    if not data:
                        break
                    bytes_left -= len(data)
                    yield data

        headers = {
            "Content-Range": f"bytes {start}-{end}/{file_size}",
            "Accept-Ranges": "bytes",
            "Content-Length": str(chunk_size),
            "Content-Type": content_type
        }
        return StreamingResponse(iterfile(), status_code=206, headers=headers)
    except Exception as e:
        return FileResponse(path, media_type=content_type)

@router.post("/upload")
async def upload_audio(file: UploadFile = File(...)):
    """Upload audio file (MP3, WAV, FLAC, M4A) and index into library."""
    suffix = Path(file.filename).suffix.lower()
    if suffix not in [".mp3", ".wav", ".flac", ".m4a"]:
        raise HTTPException(status_code=400, detail="Unsupported audio format. Use MP3, WAV, FLAC, or M4A.")
        
    temp_path = settings.STORAGE_DIR / f"temp_{uuid.uuid4().hex[:8]}{suffix}"
    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        registered = AudioService.register_audio_file(temp_path, custom_title=Path(file.filename).stem)
        return registered
    finally:
        if temp_path.exists():
            temp_path.unlink()

@router.get("/stream/{track_id}")
async def stream_audio(track_id: str, request: Request):
    """Stream original audio track with range seeking support."""
    with get_db() as db:
        row = db.execute("SELECT original_path FROM tracks WHERE id = ?", (track_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Track not found")
        audio_path = Path(row["original_path"])
        
    return send_partial_audio(audio_path, request)

@router.get("/stems/{track_id}/{stem_type}")
async def stream_stem(track_id: str, stem_type: str, request: Request):
    """Stream generated stem (vocals or instrumental)."""
    if stem_type.lower() in ["vocals", "vocal"]:
        path = FileStorage.get_vocal_path(track_id)
    elif stem_type.lower() in ["instrumental", "no_vocals", "inst"]:
        path = FileStorage.get_instrumental_path(track_id)
    else:
        raise HTTPException(status_code=400, detail="Invalid stem type. Must be 'vocals' or 'instrumental'.")
        
    if not path.exists():
        raise HTTPException(status_code=404, detail="Stem not generated yet. Start Sing Mode separation first.")
        
    return send_partial_audio(path, request)

@router.get("/artwork/{track_id}")
async def get_artwork(track_id: str):
    """Return album cover image."""
    art_path = FileStorage.get_artwork_path(track_id)
    if art_path.exists():
        return FileResponse(art_path, media_type="image/jpeg")
        
    # Return 404 or default placeholder
    raise HTTPException(status_code=404, detail="Artwork not available")
