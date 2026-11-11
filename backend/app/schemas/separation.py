from pydantic import BaseModel
from typing import Optional, Dict

class SeparationStartRequest(BaseModel):
    track_id: str
    quality: Optional[str] = "balanced"  # fast, balanced, high
    model: Optional[str] = "htdemucs"

class SeparationStatusResponse(BaseModel):
    job_id: str
    track_id: str
    status: str  # queued, processing, completed, failed
    progress: float  # 0 to 100
    quality: str
    model: str
    error_message: Optional[str] = None
    started_at: Optional[str] = None
    completed_at: Optional[str] = None

class SeparationResultResponse(BaseModel):
    job_id: str
    track_id: str
    status: str
    vocal_url: Optional[str] = None
    instrumental_url: Optional[str] = None
    stems: Dict[str, Optional[str]] = {}

