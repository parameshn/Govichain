from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum, Text, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from .database import Base


class UserRole(str, enum.Enum):
    GOVERNMENT = "GOVERNMENT"
    CONTRACTOR = "CONTRACTOR"
    AUDITOR = "AUDITOR"


class ProjectStatus(str, enum.Enum):
    CREATED = "CREATED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"


class MilestoneStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    FLAGGED = "FLAGGED"
    REJECTED = "REJECTED"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    projects = relationship("Project", back_populates="creator")

    contractor_milestones = relationship(
        "Milestone",
        foreign_keys="Milestone.contractor_id",
        back_populates="contractor"
    )

    auditor_milestones = relationship(
        "Milestone",
        foreign_keys="Milestone.auditor_id",
        back_populates="auditor"
    )


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    budget = Column(Float, nullable=False)
    compliance_rules = Column(Text)
    status = Column(Enum(ProjectStatus), default=ProjectStatus.CREATED)
    creator_id = Column(Integer, ForeignKey("users.id"))
    wallet_address = Column(String, nullable=True)
    on_chain_tx_hash = Column(String, nullable=True, index=True)
    chain_network = Column(String, nullable=True)
    chain_id = Column(Integer, nullable=True)
    chain_project_id = Column(Integer, nullable=True)
    contract_address = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    creator = relationship("User", back_populates="projects")
    milestones = relationship(
        "Milestone",
        back_populates="project",
        cascade="all, delete-orphan"
    )


class Milestone(Base):
    __tablename__ = "milestones"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    title = Column(String, nullable=False)
    description = Column(Text)
    requested_amount = Column(Float, nullable=False)
    status = Column(Enum(MilestoneStatus), default=MilestoneStatus.PENDING)
    contractor_id = Column(Integer, ForeignKey("users.id"))
    auditor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    wallet_address = Column(String, nullable=True)
    submission_tx_hash = Column(String, nullable=True, index=True)
    review_tx_hash = Column(String, nullable=True, index=True)
    chain_network = Column(String, nullable=True)
    chain_id = Column(Integer, nullable=True)
    chain_project_id = Column(Integer, nullable=True)
    chain_milestone_id = Column(Integer, nullable=True)
    contract_address = Column(String, nullable=True)
    description_hash = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    approved_at = Column(DateTime, nullable=True)
    ai_report = Column(JSON)
    ai_score = Column(Float)
    ai_flags = Column(JSON)

    project = relationship("Project", back_populates="milestones")

    contractor = relationship(
        "User",
        foreign_keys=[contractor_id],
        back_populates="contractor_milestones"
    )

    auditor = relationship(
        "User",
        foreign_keys=[auditor_id],
        back_populates="auditor_milestones"
    )
