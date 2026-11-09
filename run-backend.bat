@echo off
title Statistics Story AI - Backend Server
echo [BACKEND] Memulai server FastAPI Uvicorn di http://127.0.0.1:8000 ...
cd backend
if exist .venv\Scripts\activate.bat (
    call .venv\Scripts\activate.bat
)
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
pause
