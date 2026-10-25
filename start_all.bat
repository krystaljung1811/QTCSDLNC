@echo off
title Khoi Dong Toan Bo He Thong Cinema Oracle
echo ==============================================================================
echo  KHOI DONG HE THONG QUAN TRI DAT VE RAP PHIM (ORACLE DATABASE 23ai / 26ai)
echo ==============================================================================
echo Dang khoi dong Backend FastAPI tai http://127.0.0.1:8000 ...
start "Oracle Cinema Backend" cmd /k "%~dp0start_backend.bat"
timeout /t 3 /nobreak > nul
echo Dang khoi dong Frontend Vite tai http://localhost:5173 ...
start "Oracle Cinema Frontend" cmd /k "%~dp0start_frontend.bat"
timeout /t 2 /nobreak > nul
start http://localhost:5173
echo ==============================================================================
echo He thong da san sang! Hay kiem tra trinh duyet tai http://localhost:5173
echo ==============================================================================
