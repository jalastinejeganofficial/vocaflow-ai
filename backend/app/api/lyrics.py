from fastapi import APIRouter, HTTPException
from app.schemas.lyrics import LyricsImportRequest, LyricsResponse
from app.services.lyrics_service import LyricsService

router = APIRouter(prefix="/api/lyrics", tags=["Lyrics"])

@router.post("/import", response_model=LyricsResponse)
async def import_lyrics(req: LyricsImportRequest):
    """Import and synchronize lyrics in LRC or SRT format."""
    try:
        res = LyricsService.save_lyrics(
            track_id=req.track_id,
            raw_content=req.raw_content,
            fmt=req.format or "lrc"
        )
        return LyricsResponse(
            track_id=res["track_id"],
            format=res["format"],
            raw_content=res["raw_content"],
            lines=res["lines"],
            created_at="Just now"
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse lyrics: {str(e)}")

@router.get("/{track_id}", response_model=LyricsResponse)
async def get_lyrics(track_id: str):
    """Retrieve synchronized lyrics for the specified track."""
    lyrics_data = LyricsService.get_lyrics(track_id)
    if not lyrics_data:
        raise HTTPException(status_code=404, detail="No lyrics found for this track.")
        
    return LyricsResponse(
        track_id=lyrics_data["track_id"],
        format=lyrics_data["format"],
        raw_content=lyrics_data["raw_content"],
        lines=lyrics_data["lines"],
        created_at=lyrics_data.get("created_at")
    )

