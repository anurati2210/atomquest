# AtomQuest Goal Tracking Portal

A full-stack Goal Setting & Tracking Portal built for the AtomQuest Hackathon 1.0.

##  Live Demo
**https://atomquest-five.vercel.app**

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Employee | employee@demo.com | password123 |
| Manager | manager@demo.com | password123 |
| Admin | admin@demo.com | password123 |

##  Features

### Employee
- Create up to 8 goals with thrust area, target, UoM type and weightage
- Weightage validation — must total exactly 100%, minimum 10% per goal
- Submit goals for manager approval
- Log quarterly progress (Q1–Q4) with actual achievement
- Auto-calculated progress score based on UoM type

### Manager
- View team members and their goal status
- Approve or return goals for rework with comments
- Add quarterly check-in comments per goal

### Admin
- Overview dashboard with completion stats
- View all employees and their goals
- Unlock approved goals for editing
- Export all goal data as CSV

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite |
| Backend | Python + FastAPI |
| Database | SQLite + SQLAlchemy |
| Auth | JWT (python-jose) |
| Frontend Deploy | Vercel |
| Backend Deploy | Render |

## Architecture
Browser → Vercel (React) → Render (FastAPI) → SQLite DB

##  Run Locally

### Backend
```bash
cd server
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend
```bash
cd client
npm install
npm run dev
```
