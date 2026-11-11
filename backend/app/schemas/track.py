from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class TrackBase(BaseModel):
    title: str
    artist: Optional[str] = "Unknown Artist"
    album: Optional[str] = "Unknown Album"
    duration: float = 0.0

class TrackCreate(TrackBase):
    original_path: str
    artwork_path: Optional[str] = None
    format: Optional[str] = "mp3"
    sample_rate: Optional[int] = 48000
    channels: Optional[int] = 2

class TrackResponse(TrackBase):
    id: str
    original_path: str
    artwork_path: Optional[str] = None
    artwork_url: Optional[str] = None
    stream_url: Optional[str] = None
    instrumental_url: Optional[str] = None
    vocal_url: Optional[str] = None
    format: Optional[str] = "mp3"
    sample_rate: int = 48000
    channels: int = 2
    has_stems: bool = False
    status: str = "ready"
    play_count: int = 0
    is_favorite: bool = False
    created_at: Optional[str] = None

class TrackUpdate(BaseModel):
    title: Optional[str] = None
    artist: Optional[str] = None
    album: Optional[str] = None
    is_favorite: Optional[bool] = None

