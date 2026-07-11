@echo off
rem OmniHearth Local Server Manager Batch Launcher
echo =========================================
echo Launching OmniHearth Households OS...
echo =========================================

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0run_local.ps1"
pause
