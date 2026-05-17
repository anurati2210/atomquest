  
from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import engine, get_db, Base
from app import models, schemas
from app.auth import (
    authenticate_user, create_access_token,
    hash_password, decode_token
)

Base.metadata.create_all(bind=engine)

app = FastAPI(title="AtomQuest Goal Tracker")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://atomquest-five.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── seed demo users on startup ──────────────────────────────────────────
@app.on_event("startup")
def seed():
    db = next(get_db())
    if db.query(models.User).count() == 0:
        users = [
            models.User(name="Alice Employee", email="employee@demo.com",
                        password_hash=hash_password("password123"), role="employee"),
            models.User(name="Bob Manager",   email="manager@demo.com",
                        password_hash=hash_password("password123"), role="manager"),
            models.User(name="Carol Admin",   email="admin@demo.com",
                        password_hash=hash_password("password123"), role="admin"),
        ]
        db.add_all(users)
        db.commit()
        db.refresh(users[0])
        users[0].manager_id = users[1].id
        db.commit()

# ── auth helper ─────────────────────────────────────────────────────────
def get_current_user(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.split(" ")[1]
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = db.query(models.User).filter(models.User.id == payload.get("user_id")).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

# ── login ────────────────────────────────────────────────────────────────
@app.post("/api/login", response_model=schemas.TokenResponse)
def login(request: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = authenticate_user(db, request.email, request.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token({"user_id": user.id, "role": user.role})
    return {"access_token": token, "token_type": "bearer",
            "role": user.role, "name": user.name, "user_id": user.id}

# ── goals ────────────────────────────────────────────────────────────────
@app.post("/api/goals", response_model=schemas.GoalResponse)
def create_goal(goal: schemas.GoalCreate, db: Session = Depends(get_db),
                current_user=Depends(get_current_user)):
    if current_user.role != "employee":
        raise HTTPException(status_code=403, detail="Only employees can create goals")
    existing = db.query(models.Goal).filter(
    models.Goal.user_id == current_user.id,
    models.Goal.status.in_(["draft", "pending", "returned"])
).all()
    if len(existing) >= 8:
        raise HTTPException(status_code=400, detail="Maximum 8 goals allowed")
    db_goal = models.Goal(**goal.dict(), user_id=current_user.id, status="draft")
    db.add(db_goal)
    db.commit()
    db.refresh(db_goal)
    return db_goal

@app.get("/api/goals", response_model=List[schemas.GoalResponse])
def get_my_goals(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return db.query(models.Goal).filter(models.Goal.user_id == current_user.id).all()

@app.post("/api/goals/submit")
def submit_goals(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    if current_user.role != "employee":
        raise HTTPException(status_code=403, detail="Only employees can submit goals")
    goals = db.query(models.Goal).filter(
        models.Goal.user_id == current_user.id,
        models.Goal.status == "draft"
    ).all()
    if not goals:
        raise HTTPException(status_code=400, detail="No draft goals to submit")
    if len(goals) > 8 - db.query(models.Goal).filter(
    models.Goal.user_id == current_user.id,
    models.Goal.status == "approved"
).count():
        raise HTTPException(status_code=400, detail="Maximum 8 goals allowed")
    total_weightage = sum(g.weightage for g in goals)
    if abs(total_weightage - 100.0) > 0.01:
        raise HTTPException(status_code=400, detail=f"Total weightage must be 100%. Currently: {total_weightage}%")
    if any(g.weightage < 10 for g in goals):
        raise HTTPException(status_code=400, detail="Each goal must have at least 10% weightage")
    for goal in goals:
        goal.status = "pending"
    db.commit()
    return {"message": "Goals submitted for approval"}

@app.delete("/api/goals/{goal_id}")
def delete_goal(goal_id: int, db: Session = Depends(get_db),
                current_user=Depends(get_current_user)):
    goal = db.query(models.Goal).filter(
        models.Goal.id == goal_id,
        models.Goal.user_id == current_user.id
    ).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    if goal.status not in ["draft", "returned"]:
        raise HTTPException(status_code=400, detail="Cannot delete this goal")
    # Delete related records first
    db.query(models.QuarterlyUpdate).filter(models.QuarterlyUpdate.goal_id == goal_id).delete()
    db.query(models.GoalApproval).filter(models.GoalApproval.goal_id == goal_id).delete()
    db.query(models.CheckinComment).filter(models.CheckinComment.goal_id == goal_id).delete()
    db.query(models.AuditLog).filter(models.AuditLog.goal_id == goal_id).delete()
    db.delete(goal)
    db.commit()
    return {"message": "Goal deleted"}

# ── manager ──────────────────────────────────────────────────────────────
@app.get("/api/manager/team")
def get_team(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    if current_user.role != "manager":
        raise HTTPException(status_code=403, detail="Managers only")
    team = db.query(models.User).filter(models.User.manager_id == current_user.id).all()
    result = []
    for member in team:
        goals = db.query(models.Goal).filter(models.Goal.user_id == member.id).all()
        result.append({
            "id": member.id, "name": member.name, "email": member.email,
            "pending_goals": len([g for g in goals if g.status == "pending"]),
            "approved_goals": len([g for g in goals if g.status == "approved"]),
        })
    return result

@app.get("/api/manager/employee/{employee_id}/goals")
def get_employee_goals(employee_id: int, db: Session = Depends(get_db),
                       current_user=Depends(get_current_user)):
    if current_user.role != "manager":
        raise HTTPException(status_code=403, detail="Managers only")
    return db.query(models.Goal).filter(models.Goal.user_id == employee_id).all()

@app.post("/api/manager/goals/{goal_id}/approve")
def approve_goal(goal_id: int, request: schemas.ApprovalRequest,
                 db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    if current_user.role != "manager":
        raise HTTPException(status_code=403, detail="Managers only")
    goal = db.query(models.Goal).filter(models.Goal.id == goal_id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    goal.status = request.action  # "approved" or "returned"
    approval = models.GoalApproval(
        goal_id=goal_id, manager_id=current_user.id,
        action=request.action, comment=request.comment
    )
    db.add(approval)
    db.commit()
    return {"message": f"Goal {request.action}"}

# ── quarterly updates ────────────────────────────────────────────────────
@app.post("/api/goals/{goal_id}/quarterly", response_model=schemas.QuarterlyUpdateResponse)
def add_quarterly_update(goal_id: int, update: schemas.QuarterlyUpdateCreate,
                         db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    goal = db.query(models.Goal).filter(
        models.Goal.id == goal_id,
        models.Goal.user_id == current_user.id
    ).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    if goal.status != "approved":
        raise HTTPException(status_code=400, detail="Goal must be approved before logging progress")
    db_update = models.QuarterlyUpdate(goal_id=goal_id, **update.dict())
    db.add(db_update)
    db.commit()
    db.refresh(db_update)
    return db_update

@app.get("/api/goals/{goal_id}/quarterly", response_model=List[schemas.QuarterlyUpdateResponse])
def get_quarterly_updates(goal_id: int, db: Session = Depends(get_db),
                          current_user=Depends(get_current_user)):
    return db.query(models.QuarterlyUpdate).filter(
        models.QuarterlyUpdate.goal_id == goal_id
    ).all()

# ── checkin comments ─────────────────────────────────────────────────────
@app.post("/api/manager/goals/{goal_id}/checkin")
def add_checkin(goal_id: int, checkin: schemas.CheckinCommentCreate,
                db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    if current_user.role != "manager":
        raise HTTPException(status_code=403, detail="Managers only")
    comment = models.CheckinComment(
        goal_id=goal_id, manager_id=current_user.id,
        quarter=checkin.quarter, comment=checkin.comment
    )
    db.add(comment)
    db.commit()
    return {"message": "Check-in comment added"}

# ── admin ────────────────────────────────────────────────────────────────
@app.get("/api/admin/users")
def get_all_users(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admins only")
    return db.query(models.User).all()

@app.get("/api/admin/goals")
def get_all_goals(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admins only")
    return db.query(models.Goal).all()

@app.post("/api/admin/goals/{goal_id}/unlock")
def unlock_goal(goal_id: int, db: Session = Depends(get_db),
                current_user=Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admins only")
    goal = db.query(models.Goal).filter(models.Goal.id == goal_id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    goal.status = "draft"
    db.commit()
    return {"message": "Goal unlocked"}

# ── health check ─────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {"message": "AtomQuest API is running!"}