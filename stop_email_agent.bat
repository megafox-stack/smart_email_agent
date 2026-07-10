@echo off
title Stop Smart Email Agent

echo ==========================================
echo Stopping Smart Email Agent
echo ==========================================

REM Stop Ollama
taskkill /F /IM ollama.exe >nul 2>&1

REM Stop Python (Uvicorn)
taskkill /F /IM python.exe >nul 2>&1

REM Stop Node/Vite
taskkill /F /IM node.exe >nul 2>&1

echo.
echo All services stopped.

pause