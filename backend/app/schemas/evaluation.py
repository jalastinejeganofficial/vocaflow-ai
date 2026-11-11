from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class PitchDataPoint(BaseModel):
    time: float
    user_pitch: Optional[float] = None
    ref_pitch: Optional[float] = None

class EvaluationRequest(BaseModel):
    recording_id: str
    track_id: str

class EvaluationResponse(BaseModel):
    id: str
    recording_id: str
    track_id: str
    overall_score: int
    pitch_score: int
    timing_score: int
    rhythm_score: int
    stability_score: int
    feedback: str
    strengths: List[str]
    improvements: List[str]
    pitch_contour: List[PitchDataPoint]
    created_at: str

