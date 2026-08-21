from sqlalchemy import func
from decimal import Decimal
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Project, User, UserRole, ProjectStatus, Milestone, MilestoneStatus
from ..schemas import ProjectCreate, ProjectResponse
from ..auth import get_current_user
from ..utils.rbac import require_role
from app.services.ai_engine import generate_rules

router = APIRouter(prefix="/projects", tags=["Projects"])


def to_decimal(value: float | int | None) -> Decimal:
    return Decimal(str(value or 0))


def money_to_float(value: Decimal | float | int | None) -> float:
    return float(to_decimal(value).quantize(Decimal("0.01")))


@router.post("/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(
    project: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    require_role([UserRole.GOVERNMENT])(current_user)

    rules = generate_rules(project.description)

    new_project = Project(
        name=project.name,
        description=project.description,
        budget=project.budget,
        creator_id=current_user.id,
        status=ProjectStatus.CREATED,
        compliance_rules=rules,
        wallet_address=project.wallet_address,
        on_chain_tx_hash=project.on_chain_tx_hash,
        chain_network=project.chain_network,
        chain_id=project.chain_id,
        chain_project_id=project.chain_project_id,
        contract_address=project.contract_address,
    )

    db.add(new_project)
    db.commit()
    db.refresh(new_project)
    return new_project


@router.get("/", response_model=List[ProjectResponse])
def get_all_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Project).all()


# ✅ STATIC ROUTES MUST COME BEFORE /{project_id}
@router.get("/my-projects", response_model=List[ProjectResponse])
def get_my_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Project).filter(Project.creator_id == current_user.id).all()


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


# ✅ NEW: Progress endpoint that ProjectDetails.jsx needs
@router.get("/{project_id}/progress")
def get_project_progress(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    milestones = db.query(Milestone).filter(Milestone.project_id == project_id).all()

    approved = sum(1 for m in milestones if m.status == MilestoneStatus.APPROVED)
    pending = sum(1 for m in milestones if m.status == MilestoneStatus.PENDING)
    flagged = sum(1 for m in milestones if m.status == MilestoneStatus.FLAGGED)
    rejected = sum(1 for m in milestones if m.status == MilestoneStatus.REJECTED)

    approved_amount = sum((
        to_decimal(m.requested_amount)
        for m in milestones
        if m.status == MilestoneStatus.APPROVED
    ), Decimal("0"))
    under_review_amount = sum((
        to_decimal(m.requested_amount)
        for m in milestones
        if m.status in {MilestoneStatus.PENDING, MilestoneStatus.FLAGGED}
    ), Decimal("0"))
    rejected_amount = sum((
        to_decimal(m.requested_amount)
        for m in milestones
        if m.status == MilestoneStatus.REJECTED
    ), Decimal("0"))
    reserved_amount = approved_amount + under_review_amount
    available_budget = to_decimal(project.budget) - reserved_amount

    total_milestones = len(milestones)
    completion_percentage = round((approved / total_milestones * 100), 2) if total_milestones > 0 else 0
    budget_utilization = round(
        (money_to_float(reserved_amount) / project.budget * 100),
        2
    ) if project.budget > 0 else 0

    return {
        "project_id": project_id,
        "milestones": {
            "total": total_milestones,
            "approved": approved,
            "pending": pending,
            "flagged": flagged,
            "rejected": rejected,
        },
        "funds": {
            "total_budget": money_to_float(to_decimal(project.budget)),
            "reserved_amount": money_to_float(reserved_amount),
            "under_review_amount": money_to_float(under_review_amount),
            "approved_amount": money_to_float(approved_amount),
            "rejected_amount": money_to_float(rejected_amount),
            "available_budget": money_to_float(available_budget),
        },
        "progress": {
            "completion_percentage": completion_percentage,
            "budget_utilization": budget_utilization,
        }
    }
