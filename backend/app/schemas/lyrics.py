from pydantic import BaseModel
from typing import List, Optional

class LyricWord(BaseModel):
    word: str
    start: float
    end: float

class LyricLine(BaseModel):
    time: float
    text: str
    words: Optional[List[LyricWord]] = None

class LyricsImportRequest(BaseModel):
    track_id: str
    format: Optional[str] = "lrc"  # lrc, srt, text
    raw_content: str

class LyricsResponse(BaseModel):
    track_id: str
    format: str
    raw_content: str
    lines: List[LyricLine]
    created_at: Optional[str] = None

