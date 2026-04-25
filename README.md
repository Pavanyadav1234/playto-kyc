# Playto KYC Pipeline

A KYC onboarding system for merchants built with Django + React.

## Live Demo
- Frontend: https://playto-kyc-frontend-vewl.onrender.com
- Backend API: https://playto-kyc-backend-hw1z.onrender.com

## Test Login Credentials
- Reviewer: `reviewer1` / `reviewer123`
- Merchant 1: `merchant1` / `merchant123` (draft state)
- Merchant 2: `merchant2` / `merchant123` (under_review state)

## Setup Instructions

### Backend
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python kyc/seed.py
python manage.py runserver

### Frontend
cd frontend
npm install
npm run dev

Open http://localhost:5173

## Tech Stack
- Backend: Django + Django REST Framework
- Frontend: React + Tailwind CSS + Vite
- Database: SQLite
- Auth: Token Authentication