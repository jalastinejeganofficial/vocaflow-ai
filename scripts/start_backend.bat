@echo off
title VocaFlow AI - Backend Server
echo ========================================================
echo   Starting VocaFlow AI FastAPI Backend on Port 8000
echo ========================================================
set KMP_DUPLICATE_LIB_OK=TRUE
set PYTHONPATH=%~dp0..\backend
cd /d "%~dp0..\backend"
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
pause

