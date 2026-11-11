from pydantic import BaseModel
from typing import Optional

class RecordingSaveResponse(BaseModel):
    id: str
    track_id: str
    file_path: str
    recording_url: str
    duration: float
    created_at: str

