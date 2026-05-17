from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Boolean, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False)  # employee / manager / admin
    manager_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    goals = relationship("Goal", back_populates="owner", foreign_keys="Goal.user_id")

class Goal(Base):
    __tablename__ = "goals"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    thrust_area = Column(String, nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    uom_type = Column(String, nullable=False)  # min / max / timeline / zero
    target = Column(Float, nullable=False)
    weightage = Column(Float, nullable=False)
    status = Column(String, default="draft")  # draft / pending / approved / returned
    is_shared = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    owner = relationship("User", back_populates="goals", foreign_keys=[user_id])
    quarterly_updates = relationship("QuarterlyUpdate", back_populates="goal")
    approvals = relationship("GoalApproval", back_populates="goal")

class GoalApproval(Base):
    __tablename__ = "goal_approvals"
    id = Column(Integer, primary_key=True, index=True)
    goal_id = Column(Integer, ForeignKey("goals.id"), nullable=False)
    manager_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    action = Column(String, nullable=False)  # approved / returned
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    goal = relationship("Goal", back_populates="approvals")

class QuarterlyUpdate(Base):
    __tablename__ = "quarterly_updates"
    id = Column(Integer, primary_key=True, index=True)
    goal_id = Column(Integer, ForeignKey("goals.id"), nullable=False)
    quarter = Column(String, nullable=False)  # Q1 / Q2 / Q3 / Q4
    actual_achievement = Column(Float, nullable=True)
    status = Column(String, default="not_started")  # not_started / on_track / completed
    created_at = Column(DateTime, default=datetime.utcnow)
    goal = relationship("Goal", back_populates="quarterly_updates")

class CheckinComment(Base):
    __tablename__ = "checkin_comments"
    id = Column(Integer, primary_key=True, index=True)
    goal_id = Column(Integer, ForeignKey("goals.id"), nullable=False)
    manager_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    quarter = Column(String, nullable=False)
    comment = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class AuditLog(Base):
    __tablename__ = "audit_log"
    id = Column(Integer, primary_key=True, index=True)
    goal_id = Column(Integer, ForeignKey("goals.id"), nullable=False)
    changed_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    change_description = Column(Text, nullable=False)
    changed_at = Column(DateTime, default=datetime.utcnow)
    
