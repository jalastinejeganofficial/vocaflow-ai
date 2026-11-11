from pydantic import BaseModel
from typing import Optional, List
from fastapi import APIRouter
from app.database import get_db

router = APIRouter(prefix="/api/history", tags=["History"])

class HistoryEvent(BaseModel):
    track_id: str
    completion_percentage: Optional[float] = 100.0
    mode: Optional[str] = "normal"  # normal, sing_mode

@router.get("")
async def get_history(limit: int = 20):
    """Retrieve recently played tracks."""
    with get_db() as db:
        rows = db.execute("""
            SELECT h.id, h.track_id, h.played_at, h.completion_percentage, h.mode,
                   t.title, t.artist, t.duration
            FROM history h
            JOIN tracks t ON h.track_id = t.id
            ORDER BY h.played_at DESC
            LIMIT ?
        """, (limit,)).fetchall()
        
        return [dict(r) for r in rows]

@router.post("")
async def record_history(event: HistoryEvent):
    """Record a song play in history and increment play_count."""
    with get_db() as db:
        db.execute("""
            INSERT INTO history (track_id, completion_percentage, mode)
            VALUES (?, ?, ?)
        """, (event.track_id, event.completion_percentage, event.mode))
        db.execute("UPDATE tracks SET play_count = play_count + 1 WHERE id = ?", (event.track_id,))
        db.commit()
    return {"status": "recorded"}

