from fastapi import APIRouter, HTTPException
from app.schemas.separation import SeparationStartRequest, SeparationStatusResponse, SeparationResultResponse
from app.services.separation_service import SeparationService
from app.storage.file_storage import FileStorage
from app.database import get_db

router = APIRouter(prefix="/api/separation", tags=["Separation"])

@router.post("/start")
async def start_separation(req: SeparationStartRequest):
    """Start AI vocal/instrumental separation job."""
    try:
        job_id = SeparationService.start_job(
            track_id=req.track_id,
            quality=req.quality or "balanced",
            model=req.model or "htdemucs"
        )
        return {"job_id": job_id, "track_id": req.track_id, "status": "queued"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/status/{job_id}", response_model=SeparationStatusResponse)
async def get_separation_status(job_id: str):
    """Retrieve separation job status and progress percentage."""
    info = SeparationService.get_status(job_id)
    if not info:
        raise HTTPException(status_code=404, detail="Job not found")
        
    return SeparationStatusResponse(
        job_id=info["id"],
        track_id=info["track_id"],
        status=info["status"],
        progress=float(info["progress"]),
        quality=info["quality"],
        model=info["model"],
        message=info.get("message"),
        elapsed_seconds=info.get("elapsed_seconds"),
        estimated_remaining_seconds=info.get("estimated_remaining_seconds"),
        error_message=info.get("error_message"),
        started_at=str(info.get("started_at")),
        completed_at=str(info.get("completed_at"))
    )

@router.get("/result/{job_id}", response_model=SeparationResultResponse)
async def get_separation_result(job_id: str):
    """Retrieve URLs for generated stems once separation completes."""
    info = SeparationService.get_status(job_id)
    if not info:
        raise HTTPException(status_code=404, detail="Job not found")
        
    if info["status"] != "completed":
        return SeparationResultResponse(
            job_id=info["id"],
            track_id=info["track_id"],
            status=info["status"],
            vocal_url=None,
            instrumental_url=None
        )
        
    track_id = info["track_id"]
    vocal_url = f"/api/audio/stems/{track_id}/vocals"
    inst_url = f"/api/audio/stems/{track_id}/instrumental"
    
    return SeparationResultResponse(
        job_id=info["id"],
        track_id=track_id,
        status="completed",
        vocal_url=vocal_url,
        instrumental_url=inst_url,
        stems={
            "vocals": vocal_url,
            "instrumental": inst_url
        }
    )

@router.delete("/{job_id}")
async def cancel_separation(job_id: str):
    """Cancel or terminate an in-progress separation job."""
    success = SeparationService.cancel_job(job_id)
    return {"job_id": job_id, "cancelled": success}

