@echo off
title Oracle Cinema Backend (FastAPI)
echo ========================================================
echo  KHOI DONG BACKEND FASTAPI - ORACLE DATABASE THIN MODE
echo ========================================================
cd /d "%~dp0backend"
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
pause
