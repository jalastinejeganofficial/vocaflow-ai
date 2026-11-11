from fastapi import APIRouter, HTTPException
from app.schemas.evaluation import EvaluationRequest, EvaluationResponse
from app.services.evaluation_service import EvaluationService

router = APIRouter(prefix="/api/singing", tags=["Singing Evaluation"])

@router.post("/evaluate", response_model=EvaluationResponse)
async def evaluate_performance(req: EvaluationRequest):
    """Run AI singing evaluation on user recording vs reference vocals."""
    try:
        report = EvaluationService.evaluate(req.recording_id, req.track_id)
        return EvaluationResponse(**report)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Singing evaluation error: {str(e)}")

@router.get("/latest/{track_id}", response_model=EvaluationResponse)
async def get_latest_evaluation(track_id: str):
    """Retrieve latest performance evaluation report for a track."""
    report = EvaluationService.get_latest_evaluation(track_id)
    if not report:
        raise HTTPException(status_code=404, detail="No evaluations found for this track.")
    return EvaluationResponse(**report)

