# Playto KYC Pipeline

A KYC onboarding system for merchants built with Django + React.

## Test Login Credentials
- Reviewer: `reviewer1` / `reviewer123`
- Merchant 1: `merchant1` / `merchant123` (draft state)
- Merchant 2: `merchant2` / `merchant123` (under_review state)

## Setup Instructions

### Backend
cd backend
python -m venv venv
venv\Scripts\activate
pip install django djangorestframework pillow python-dotenv django-cors-headers
python manage.py migrate
python kyc/seed.py
python manage.py runserver

### Frontend
cd frontend
npm install
npm run dev

Then open http://localhost:5173 in your browser.

## Tech Stack
- Backend: Django + Django REST Framework
- Frontend: React + Tailwind CSS + Vite
- Database: SQLite
- Auth: Token Authentication