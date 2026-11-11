from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query
from app.database import get_db
from app.schemas.track import TrackResponse
from app.storage.file_storage import FileStorage

router = APIRouter(prefix="/api/library", tags=["Library"])

@router.get("", response_model=List[TrackResponse])
async def get_library(
    search: Optional[str] = None,
    filter_type: Optional[str] = "all", # all, ready, separating, favorites
    sort_by: Optional[str] = "created_at" # created_at, title, artist, duration
):
    """Retrieve music library with search, filtering, and sorting."""
    query = "SELECT * FROM tracks WHERE 1=1"
    params = []
    
    if search:
        query += " AND (title LIKE ? OR artist LIKE ? OR album LIKE ?)"
        wildcard = f"%{search}%"
        params.extend([wildcard, wildcard, wildcard])
        
    if filter_type == "ready":
        query += " AND has_stems = 1"
    elif filter_type == "favorites":
        query += " AND is_favorite = 1"
        
    order_column = {
        "title": "title ASC",
        "artist": "artist ASC",
        "duration": "duration DESC",
        "created_at": "created_at DESC"
    }.get(sort_by, "created_at DESC")
    
    query += f" ORDER BY {order_column}"
    
    with get_db() as db:
        rows = db.execute(query, params).fetchall()
        
        result = []
        for r in rows:
            track_id = r["id"]
            art_p = FileStorage.get_artwork_path(track_id)
            artwork_url = f"/api/audio/artwork/{track_id}" if art_p.exists() else None
            
            inst_p = FileStorage.get_instrumental_path(track_id)
            vocal_p = FileStorage.get_vocal_path(track_id)
            
            has_stems = bool(r["has_stems"] or (inst_p.exists() and vocal_p.exists()))
            
            inst_url = f"/api/audio/stems/{track_id}/instrumental" if has_stems else None
            vocal_url = f"/api/audio/stems/{track_id}/vocals" if has_stems else None
            
            result.append(TrackResponse(
                id=track_id,
                title=r["title"],
                artist=r["artist"],
                album=r["album"],
                duration=float(r["duration"]),
                original_path=r["original_path"],
                artwork_path=r["artwork_path"],
                artwork_url=artwork_url,
                stream_url=f"/api/audio/stream/{track_id}",
                instrumental_url=inst_url,
                vocal_url=vocal_url,
                format=r["format"] or "mp3",
                sample_rate=r["sample_rate"] or 48000,
                channels=r["channels"] or 2,
                has_stems=has_stems,
                status=r["status"] or "ready",
                play_count=r["play_count"] or 0,
                is_favorite=bool(r["is_favorite"]),
                created_at=str(r["created_at"])
            ))
            
        return result

@router.put("/{track_id}/favorite")
async def toggle_favorite(track_id: str):
    """Toggle favorite status of a track."""
    with get_db() as db:
        row = db.execute("SELECT is_favorite FROM tracks WHERE id = ?", (track_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Track not found")
        new_fav = 0 if row["is_favorite"] else 1
        db.execute("UPDATE tracks SET is_favorite = ? WHERE id = ?", (new_fav, track_id))
        db.commit()
        return {"id": track_id, "is_favorite": bool(new_fav)}

@router.delete("/{track_id}")
async def delete_track(track_id: str):
    """Delete a track and its associated files."""
    with get_db() as db:
        db.execute("DELETE FROM tracks WHERE id = ?", (track_id,))
        db.execute("DELETE FROM lyrics WHERE track_id = ?", (track_id,))
        db.execute("DELETE FROM separation_jobs WHERE track_id = ?", (track_id,))
        db.commit()
    return {"id": track_id, "deleted": True}

