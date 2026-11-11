@echo off
title VocaFlow AI - Frontend Dev Server
echo ========================================================
echo   Starting VocaFlow AI Frontend Dev Server on Port 3000
echo ========================================================
cd /d "%~dp0..\frontend"
npm run dev
pause

