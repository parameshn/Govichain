"""
Public API endpoints.

These routes provide read-only project information for the public dashboard and
do not require authentication.
"""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import desc, func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Milestone, MilestoneStatus, Project
from app.schemas import ProjectResponse

router = APIRouter(prefix="/public", tags=["public"])


def enum_value(value):
    return value.value if hasattr(value, "value") else value


@router.get("/projects", response_model=List[ProjectResponse])
def get_all_projects(
    db: Session = Depends(get_db),
    status: Optional[str] = Query(None),
    budget_min: Optional[float] = Query(None),
    budget_max: Optional[float] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
):
    query = db.query(Project)

    if status:
        query = query.filter(Project.status == status)

    if budget_min is not None:
        query = query.filter(Project.budget >= budget_min)
    if budget_max is not None:
        query = query.filter(Project.budget <= budget_max)

    return query.order_by(desc(Project.created_at)).offset(skip).limit(limit).all()


@router.get("/projects/{project_id}", response_model=dict)
def get_project_detail(
    project_id: int,
    db: Session = Depends(get_db),
):
    project = db.query(Project).filter(Project.id == project_id).first()

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    milestones = db.query(Milestone).filter(Milestone.project_id == project_id).all()

    approved_milestones = [m for m in milestones if m.status == MilestoneStatus.APPROVED]
    pending_milestones = [m for m in milestones if m.status == MilestoneStatus.PENDING]
    flagged_milestones = [m for m in milestones if m.status == MilestoneStatus.FLAGGED]
    rejected_milestones = [m for m in milestones if m.status == MilestoneStatus.REJECTED]

    approved_amount = sum(m.requested_amount for m in approved_milestones)
    pending_amount = sum(m.requested_amount for m in pending_milestones)
    flagged_amount = sum(m.requested_amount for m in flagged_milestones)
    rejected_amount = sum(m.requested_amount for m in rejected_milestones)

    progress_percentage = (approved_amount / project.budget * 100) if project.budget > 0 else 0

    return {
        "id": project.id,
        "name": project.name,
        "description": project.description,
        "budget": project.budget,
        "status": enum_value(project.status),
        "created_at": project.created_at,
        "updated_at": project.updated_at,
        "progress_percentage": min(progress_percentage, 100),
        "milestones": {
            "approved": {"count": len(approved_milestones), "amount": approved_amount},
            "pending": {"count": len(pending_milestones), "amount": pending_amount},
            "flagged": {"count": len(flagged_milestones), "amount": flagged_amount},
            "rejected": {"count": len(rejected_milestones), "amount": rejected_amount},
            "total": len(milestones),
        },
        "budget_breakdown": {
            "approved_amount": approved_amount,
            "pending_amount": pending_amount,
            "flagged_amount": flagged_amount,
            "rejected_amount": rejected_amount,
            "reserved_amount": pending_amount + flagged_amount,
            "available_amount": max(
                0,
                project.budget - approved_amount - pending_amount - flagged_amount,
            ),
        },
    }


@router.get("/projects/{project_id}/timeline")
def get_project_timeline(
    project_id: int,
    db: Session = Depends(get_db),
):
    project = db.query(Project).filter(Project.id == project_id).first()

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    milestones = (
        db.query(Milestone)
        .filter(Milestone.project_id == project_id)
        .order_by(Milestone.created_at)
        .all()
    )

    timeline_events = [
        {
            "id": f"milestone-{milestone.id}",
            "event_type": "milestone",
            "title": milestone.title,
            "amount": milestone.requested_amount,
            "status": enum_value(milestone.status),
            "created_at": milestone.created_at,
            "updated_at": milestone.approved_at or milestone.created_at,
            "description": milestone.description or "",
        }
        for milestone in milestones
    ]

    return {
        "project_id": project_id,
        "project_name": project.name,
        "total_milestones": len(milestones),
        "events": [
            {
                "id": f"project-{project.id}",
                "event_type": "project",
                "title": "Project created",
                "amount": project.budget,
                "status": enum_value(project.status),
                "created_at": project.created_at,
                "updated_at": project.updated_at,
                "description": project.description or "",
            },
            *timeline_events,
        ],
    }


@router.get("/stats")
def get_public_stats(db: Session = Depends(get_db)):
    total_projects = db.query(func.count(Project.id)).scalar() or 0

    created_count = (
        db.query(func.count(Project.id)).filter(Project.status == "CREATED").scalar()
        or 0
    )
    in_progress_count = (
        db.query(func.count(Project.id)).filter(Project.status == "IN_PROGRESS").scalar()
        or 0
    )
    completed_count = (
        db.query(func.count(Project.id)).filter(Project.status == "COMPLETED").scalar()
        or 0
    )

    total_budget = db.query(func.sum(Project.budget)).scalar() or 0

    total_milestones = db.query(func.count(Milestone.id)).scalar() or 0
    approved_milestones = (
        db.query(func.count(Milestone.id))
        .filter(Milestone.status == MilestoneStatus.APPROVED)
        .scalar()
        or 0
    )
    pending_milestones = (
        db.query(func.count(Milestone.id))
        .filter(Milestone.status == MilestoneStatus.PENDING)
        .scalar()
        or 0
    )

    completion_rate = (
        (approved_milestones / total_milestones * 100)
        if total_milestones > 0
        else 0
    )

    return {
        "total_projects": total_projects,
        "projects_by_status": {
            "created": created_count,
            "in_progress": in_progress_count,
            "completed": completed_count,
        },
        "total_budget": total_budget,
        "total_milestones": total_milestones,
        "milestones_by_status": {
            "approved": approved_milestones,
            "pending": pending_milestones,
        },
        "completion_rate": round(completion_rate, 2),
    }
