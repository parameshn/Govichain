from fastapi import APIRouter, HTTPException

from ..services.ai_engine import evaluate_milestone
from ..standards import PROJECT_STANDARDS

router = APIRouter(prefix="/milestone", tags=["Milestone"])


@router.post("/evaluate")
def evaluate(data: dict):
    project_type = data.get("project_type")
    milestone = data.get("milestone")

    if not project_type or not milestone:
        raise HTTPException(status_code=400, detail="Missing project_type or milestone")

    standards = PROJECT_STANDARDS.get(project_type)
    if not standards:
        raise HTTPException(status_code=400, detail="Unsupported project type")

    ai_result = evaluate_milestone(standards, milestone)

    return {
        "ai_response": ai_result
    }
