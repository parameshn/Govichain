from datetime import datetime
from decimal import Decimal
from typing import List

from fastapi import APIRouter, Body, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..auth import get_current_user
from typing import List, Optional
from datetime import datetime
from sqlalchemy import func
from ..database import get_db
from ..models import Milestone, MilestoneStatus, Project, ProjectStatus, User, UserRole
from ..schemas import MilestoneChainAction, MilestoneCreate, MilestoneResponse
from ..services.ai_engine import evaluate_milestone
from ..utils.rbac import require_role

router = APIRouter(prefix="/milestones", tags=["Milestones"])


def to_decimal(value: float | int | None) -> Decimal:
    return Decimal(str(value or 0))


def refresh_project_status(project: Project, db: Session) -> None:
    milestones = db.query(Milestone).filter(Milestone.project_id == project.id).all()

    if not milestones:
        project.status = ProjectStatus.CREATED
        return

    approved_amount = sum((
        to_decimal(item.requested_amount)
        for item in milestones
        if item.status == MilestoneStatus.APPROVED
    ), Decimal("0"))
    pending_count = sum(1 for item in milestones if item.status == MilestoneStatus.PENDING)
    flagged_count = sum(1 for item in milestones if item.status == MilestoneStatus.FLAGGED)

    if (
        approved_amount >= to_decimal(project.budget)
        and pending_count == 0
        and flagged_count == 0
    ):
        project.status = ProjectStatus.COMPLETED
    else:
        project.status = ProjectStatus.IN_PROGRESS


@router.post("/evaluate")
def evaluate(data: dict):
    rules = data.get("rules")
    milestone = data.get("milestone")
    if not rules or not milestone:
        raise HTTPException(status_code=400, detail="Missing rules or milestone")
    return evaluate_milestone(rules, milestone)


@router.post("/", response_model=MilestoneResponse)
def create_milestone(
    milestone: MilestoneCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    require_role([UserRole.CONTRACTOR])(current_user)

    project = db.query(Project).filter(Project.id == milestone.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if not project.compliance_rules:
        raise HTTPException(status_code=400, detail="No compliance rules defined")

    total = db.query(func.sum(Milestone.requested_amount)).filter(
        Milestone.project_id == milestone.project_id,
        Milestone.status != MilestoneStatus.REJECTED
    ).scalar() or 0

    if to_decimal(total) + to_decimal(milestone.requested_amount) > to_decimal(project.budget):
        raise HTTPException(status_code=400, detail="Budget exceeded")

    ai_result = evaluate_milestone(
        rules=project.compliance_rules,
        milestone=milestone.description or ""
    )

    verdict = ai_result.get("verdict", "REVIEW")

    if verdict == "REJECTED":
        raise HTTPException(
            status_code=400,
            detail={"message": "Compliance failed", "ai": ai_result}
        )

    status_val = MilestoneStatus.PENDING
    if verdict == "REVIEW":
        status_val = MilestoneStatus.FLAGGED

    new_milestone = Milestone(
        project_id=milestone.project_id,
        title=milestone.title,
        description=milestone.description,
        requested_amount=milestone.requested_amount,
        contractor_id=current_user.id,
        status=status_val,
        ai_report=ai_result,
        ai_score=ai_result.get("score", 0),
        ai_flags=ai_result.get("flags", []),
        wallet_address=milestone.wallet_address,
        submission_tx_hash=milestone.submission_tx_hash,
        chain_network=milestone.chain_network,
        chain_id=milestone.chain_id,
        chain_project_id=milestone.chain_project_id,
        chain_milestone_id=milestone.chain_milestone_id,
        contract_address=milestone.contract_address,
        description_hash=milestone.description_hash,
    )

    db.add(new_milestone)
    db.commit()
    db.refresh(new_milestone)

    refresh_project_status(project, db)
    db.commit()

    return new_milestone


@router.get("/my-milestones", response_model=List[MilestoneResponse])
def get_my_milestones(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Milestone).filter(
        Milestone.contractor_id == current_user.id
    ).order_by(Milestone.created_at.desc()).all()


@router.get("/project/{project_id}", response_model=List[MilestoneResponse])
def get_project_milestones(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return db.query(Milestone).filter(
        Milestone.project_id == project_id
    ).order_by(Milestone.created_at.desc()).all()


@router.get("/filter/by-status", response_model=List[MilestoneResponse])
def filter_by_status(
    status: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    require_role([UserRole.AUDITOR])(current_user)
    normalized_status = status.upper()

    if normalized_status == "PENDING":
        statuses = [MilestoneStatus.PENDING, MilestoneStatus.FLAGGED]
    else:
        try:
            statuses = [MilestoneStatus(normalized_status)]
        except ValueError as exc:
            valid_statuses = ", ".join(item.value for item in MilestoneStatus)
            raise HTTPException(
                status_code=400,
                detail=f"Invalid status '{status}'. Use one of: {valid_statuses}"
            ) from exc

    return db.query(Milestone).filter(
        Milestone.status.in_(statuses)
    ).order_by(Milestone.created_at.desc()).all()


@router.get("/{milestone_id}", response_model=MilestoneResponse)
def get_milestone(
    milestone_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    milestone = db.query(Milestone).filter(Milestone.id == milestone_id).first()
    if not milestone:
        raise HTTPException(status_code=404, detail="Milestone not found")
    return milestone


@router.put("/{milestone_id}/approve", response_model=MilestoneResponse)
def approve_milestone(
    milestone_id: int,
    chain_action: MilestoneChainAction | None = Body(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    require_role([UserRole.AUDITOR])(current_user)

    milestone = db.query(Milestone).filter(Milestone.id == milestone_id).first()
    if not milestone:
        raise HTTPException(status_code=404, detail="Milestone not found")

    if milestone.status == MilestoneStatus.APPROVED:
        raise HTTPException(status_code=400, detail="Milestone already approved")
    if milestone.status == MilestoneStatus.REJECTED:
        raise HTTPException(status_code=400, detail="Rejected milestone cannot be approved")

    milestone.status = MilestoneStatus.APPROVED
    milestone.auditor_id = current_user.id
    milestone.approved_at = datetime.utcnow()
    if chain_action:
        milestone.wallet_address = chain_action.wallet_address or milestone.wallet_address
        milestone.review_tx_hash = chain_action.review_tx_hash or milestone.review_tx_hash
        milestone.chain_network = chain_action.chain_network or milestone.chain_network
        milestone.chain_id = chain_action.chain_id or milestone.chain_id
        milestone.chain_project_id = chain_action.chain_project_id or milestone.chain_project_id
        milestone.chain_milestone_id = chain_action.chain_milestone_id or milestone.chain_milestone_id
        milestone.contract_address = chain_action.contract_address or milestone.contract_address
    
    # Query fresh project from DB instead of using lazy-loaded relationship
    project = db.query(Project).filter(Project.id == milestone.project_id).first()
    refresh_project_status(project, db)
    db.commit()
    db.refresh(milestone)
    return milestone


@router.put("/{milestone_id}/flag", response_model=MilestoneResponse)
def flag_milestone(
    milestone_id: int,
    chain_action: MilestoneChainAction | None = Body(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    require_role([UserRole.AUDITOR])(current_user)

    milestone = db.query(Milestone).filter(Milestone.id == milestone_id).first()
    if not milestone:
        raise HTTPException(status_code=404, detail="Milestone not found")
    if milestone.status == MilestoneStatus.FLAGGED:
        raise HTTPException(status_code=400, detail="Milestone already flagged")
    if milestone.status == MilestoneStatus.APPROVED:
        raise HTTPException(status_code=400, detail="Approved milestone cannot be flagged")
    if milestone.status == MilestoneStatus.REJECTED:
        raise HTTPException(status_code=400, detail="Rejected milestone cannot be flagged")

    milestone.status = MilestoneStatus.FLAGGED
    milestone.auditor_id = current_user.id
    milestone.approved_at = None
    if chain_action:
        milestone.wallet_address = chain_action.wallet_address or milestone.wallet_address
        milestone.review_tx_hash = chain_action.review_tx_hash or milestone.review_tx_hash
        milestone.chain_network = chain_action.chain_network or milestone.chain_network
        milestone.chain_id = chain_action.chain_id or milestone.chain_id
        milestone.chain_project_id = chain_action.chain_project_id or milestone.chain_project_id
        milestone.chain_milestone_id = chain_action.chain_milestone_id or milestone.chain_milestone_id
        milestone.contract_address = chain_action.contract_address or milestone.contract_address
    
    # Query fresh project from DB instead of using lazy-loaded relationship
    project = db.query(Project).filter(Project.id == milestone.project_id).first()
    refresh_project_status(project, db)
    db.commit()
    db.refresh(milestone)
    return milestone


@router.put("/{milestone_id}/reject", response_model=MilestoneResponse)
def reject_milestone(
    milestone_id: int,
    chain_action: MilestoneChainAction | None = Body(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    require_role([UserRole.AUDITOR])(current_user)

    milestone = db.query(Milestone).filter(Milestone.id == milestone_id).first()
    if not milestone:
        raise HTTPException(status_code=404, detail="Milestone not found")
    if milestone.status == MilestoneStatus.REJECTED:
        raise HTTPException(status_code=400, detail="Milestone already rejected")
    if milestone.status == MilestoneStatus.APPROVED:
        raise HTTPException(status_code=400, detail="Approved milestone cannot be rejected")

    milestone.status = MilestoneStatus.REJECTED
    milestone.auditor_id = current_user.id
    milestone.approved_at = None
    if chain_action:
        milestone.wallet_address = chain_action.wallet_address or milestone.wallet_address
        milestone.review_tx_hash = chain_action.review_tx_hash or milestone.review_tx_hash
        milestone.chain_network = chain_action.chain_network or milestone.chain_network
        milestone.chain_id = chain_action.chain_id or milestone.chain_id
        milestone.chain_project_id = chain_action.chain_project_id or milestone.chain_project_id
        milestone.chain_milestone_id = chain_action.chain_milestone_id or milestone.chain_milestone_id
        milestone.contract_address = chain_action.contract_address or milestone.contract_address
    
    # Query fresh project from DB instead of using lazy-loaded relationship
    project = db.query(Project).filter(Project.id == milestone.project_id).first()
    refresh_project_status(project, db)
    db.commit()
    db.refresh(milestone)
    return milestone
