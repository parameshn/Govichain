from datetime import datetime
from decimal import Decimal, ROUND_HALF_UP
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.models import MilestoneStatus, ProjectStatus, UserRole


MONEY_QUANTIZER = Decimal("0.01")


def normalize_money(value: float, field_label: str) -> float:
    amount = Decimal(str(value)).quantize(MONEY_QUANTIZER, rounding=ROUND_HALF_UP)
    if amount <= 0:
        raise ValueError(f"{field_label} must be greater than 0")
    return float(amount)


class UserBase(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    role: UserRole


class UserCreate(UserBase):
    password: str = Field(..., min_length=6)


class UserResponse(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class ProjectBase(BaseModel):
    name: str = Field(..., min_length=3, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    budget: float = Field(..., gt=0)

    @field_validator("budget")
    def validate_budget(cls, value):
        return normalize_money(value, "Budget")


class ProjectCreate(ProjectBase):
    wallet_address: Optional[str] = None
    on_chain_tx_hash: Optional[str] = None
    chain_network: Optional[str] = None
    chain_id: Optional[int] = None
    chain_project_id: Optional[int] = None
    contract_address: Optional[str] = None


class ProjectResponse(ProjectBase):
    id: int
    status: ProjectStatus
    creator_id: int
    compliance_rules: Optional[str]
    wallet_address: Optional[str] = None
    on_chain_tx_hash: Optional[str] = None
    chain_network: Optional[str] = None
    chain_id: Optional[int] = None
    chain_project_id: Optional[int] = None
    contract_address: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class MilestoneBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)
    requested_amount: float = Field(..., gt=0)

    @field_validator("requested_amount")
    def validate_amount(cls, value):
        return normalize_money(value, "Requested amount")


class MilestoneCreate(MilestoneBase):
    project_id: int
    wallet_address: Optional[str] = None
    submission_tx_hash: Optional[str] = None
    chain_network: Optional[str] = None
    chain_id: Optional[int] = None
    chain_project_id: Optional[int] = None
    chain_milestone_id: Optional[int] = None
    contract_address: Optional[str] = None
    description_hash: Optional[str] = None


class MilestoneResponse(MilestoneBase):
    id: int
    project_id: int
    status: MilestoneStatus
    contractor_id: int
    auditor_id: Optional[int]
    wallet_address: Optional[str] = None
    submission_tx_hash: Optional[str] = None
    review_tx_hash: Optional[str] = None
    chain_network: Optional[str] = None
    chain_id: Optional[int] = None
    chain_project_id: Optional[int] = None
    chain_milestone_id: Optional[int] = None
    contract_address: Optional[str] = None
    description_hash: Optional[str] = None
    created_at: datetime
    approved_at: Optional[datetime]
    ai_score: Optional[float] = None
    ai_flags: Optional[List[Any]] = None
    ai_report: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[UserRole] = None


class MilestoneChainAction(BaseModel):
    wallet_address: Optional[str] = None
    review_tx_hash: Optional[str] = None
    chain_network: Optional[str] = None
    chain_id: Optional[int] = None
    chain_project_id: Optional[int] = None
    chain_milestone_id: Optional[int] = None
    contract_address: Optional[str] = None

class ProjectDetailResponse(ProjectResponse):
    milestones: List[MilestoneResponse] = []

    class Config:
        from_attributes = True