@echo off
title Frontend Server

cd /d "%~dp0frontend"

npm run dev -- --host 0.0.0.0 --port 5173

pause