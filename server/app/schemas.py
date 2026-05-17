from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# Auth
class LoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    role: str
    name: str
    user_id: int

# Goals
class GoalCreate(BaseModel):
    thrust_area: str
    title: str
    description: Optional[str] = None
    uom_type: str
    target: float
    weightage: float
    is_shared: bool = False

class GoalUpdate(BaseModel):
    thrust_area: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    uom_type: Optional[str] = None
    target: Optional[float] = None
    weightage: Optional[float] = None

class GoalResponse(BaseModel):
    id: int
    user_id: int
    thrust_area: str
    title: str
    description: Optional[str]
    uom_type: str
    target: float
    weightage: float
    status: str
    is_shared: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Approvals
class ApprovalRequest(BaseModel):
    action: str  # approved / returned
    comment: Optional[str] = None

# Quarterly Updates
class QuarterlyUpdateCreate(BaseModel):
    quarter: str
    actual_achievement: float
    status: str

class QuarterlyUpdateResponse(BaseModel):
    id: int
    goal_id: int
    quarter: str
    actual_achievement: Optional[float]
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

# Checkin
class CheckinCommentCreate(BaseModel):
    quarter: str
    comment: str

# User
class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    manager_id: Optional[int]

    class Config:
        from_attributes = True
