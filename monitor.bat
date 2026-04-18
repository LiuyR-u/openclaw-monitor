@echo off
chcp 65001 >nul 2>&1
title Openclaw Monitor
cd /d "%~dp0"

cls
echo ====================================================
echo    Openclaw Activity Monitor
echo    Press Ctrl+C to exit
echo ====================================================
echo.

node monitor.js --latest --filter compact
