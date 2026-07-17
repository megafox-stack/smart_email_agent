@echo off
title Smart Email Agent Launcher

echo Starting Backend...
start "Backend" "%~dp0start_backend.bat"

timeout /t 5 /nobreak >nul

echo Starting Frontend...
start "Frontend" "%~dp0start_frontend.bat"

timeout /t 5 /nobreak >nul

start http://localhost:5173

exit