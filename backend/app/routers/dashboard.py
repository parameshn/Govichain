from decimal import Decimal

from sqlalchemy import func
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Project, Milestone, User, UserRole, ProjectStatus, MilestoneStatus
from ..auth import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


ACTIVE_REVIEW_STATUSES = [MilestoneStatus.PENDING, MilestoneStatus.FLAGGED]


def to_decimal(value: float | int | None) -> Decimal:
    return Decimal(str(value or 0))


def money_to_float(value: Decimal | float | int | None) -> float:
    return float(to_decimal(value).quantize(Decimal("0.01")))


@router.get("/stats")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    total_projects = db.query(Project).count()
    total_milestones = db.query(Milestone).count()
    total_users = db.query(User).count()

    projects_by_status = db.query(
        Project.status, func.count(Project.id)
    ).group_by(Project.status).all()
    project_status_counts = {status.value: count for status, count in projects_by_status}

    milestones_by_status = db.query(
        Milestone.status, func.count(Milestone.id)
    ).group_by(Milestone.status).all()
    milestone_status_counts = {status.value: count for status, count in milestones_by_status}

    total_budget = db.query(func.sum(Project.budget)).scalar() or 0
    total_requested = db.query(func.sum(Milestone.requested_amount)).scalar() or 0
    approved_funds = db.query(func.sum(Milestone.requested_amount)).filter(
        Milestone.status == MilestoneStatus.APPROVED
    ).scalar() or 0

    pending_approvals = db.query(Milestone).filter(
        Milestone.status.in_(ACTIVE_REVIEW_STATUSES)
    ).count()

    users_by_role = db.query(
        User.role, func.count(User.id)
    ).group_by(User.role).all()
    user_role_counts = {role.value: count for role, count in users_by_role}

    total_budget_value = money_to_float(total_budget)
    total_requested_value = money_to_float(total_requested)
    approved_funds_value = money_to_float(approved_funds)

    return {
        "total_projects": total_projects,
        "total_milestones": total_milestones,
        "total_users": total_users,
        "project_status": project_status_counts,
        "milestone_status": milestone_status_counts,
        "budget": {
            "total_allocated": total_budget_value,
            "total_requested": total_requested_value,
            "total_approved": approved_funds_value,
            "utilization_percentage": round((approved_funds_value / total_budget_value * 100), 2) if total_budget_value > 0 else 0
        },
        "pending_approvals": pending_approvals,
        "users_by_role": user_role_counts
    }


@router.get("/my-stats")
def get_my_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role == UserRole.GOVERNMENT:
        my_projects = db.query(Project).filter(
            Project.creator_id == current_user.id
        ).count()

        my_projects_budget = db.query(func.sum(Project.budget)).filter(
            Project.creator_id == current_user.id
        ).scalar() or 0

        return {
            "role": "GOVERNMENT",
            "projects_created": my_projects,
            "total_budget_allocated": money_to_float(my_projects_budget)
        }

    elif current_user.role == UserRole.CONTRACTOR:
        my_milestones = db.query(Milestone).filter(
            Milestone.contractor_id == current_user.id
        ).count()

        approved_milestones = db.query(Milestone).filter(
            Milestone.contractor_id == current_user.id,
            Milestone.status == MilestoneStatus.APPROVED
        ).count()

        pending_milestones = db.query(Milestone).filter(
            Milestone.contractor_id == current_user.id,
            Milestone.status.in_(ACTIVE_REVIEW_STATUSES)
        ).count()

        total_requested = db.query(func.sum(Milestone.requested_amount)).filter(
            Milestone.contractor_id == current_user.id
        ).scalar() or 0

        total_approved_amount = db.query(func.sum(Milestone.requested_amount)).filter(
            Milestone.contractor_id == current_user.id,
            Milestone.status == MilestoneStatus.APPROVED
        ).scalar() or 0

        return {
            "role": "CONTRACTOR",
            "total_milestones": my_milestones,
            "approved_milestones": approved_milestones,
            "pending_milestones": pending_milestones,
            "total_requested": money_to_float(total_requested),
            "total_approved_amount": money_to_float(total_approved_amount)
        }

    elif current_user.role == UserRole.AUDITOR:
        pending_reviews = db.query(Milestone).filter(
            Milestone.status.in_(ACTIVE_REVIEW_STATUSES)
        ).count()

        reviewed_by_me = db.query(Milestone).filter(
            Milestone.auditor_id == current_user.id
        ).count()

        approved_by_me = db.query(Milestone).filter(
            Milestone.auditor_id == current_user.id,
            Milestone.status == MilestoneStatus.APPROVED
        ).count()

        flagged_by_me = db.query(Milestone).filter(
            Milestone.auditor_id == current_user.id,
            Milestone.status == MilestoneStatus.FLAGGED
        ).count()

        return {
            "role": "AUDITOR",
            "pending_reviews": pending_reviews,
            "total_reviewed": reviewed_by_me,
            "approved": approved_by_me,
            "flagged": flagged_by_me
        }
