@echo off
cls
echo ============================================
echo   OptiFleet - One-Click Startup
echo ============================================
echo.

echo [1/4] Stopping conflicting processes...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3000" ^| find "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5000" ^| find "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)
echo       Done!
echo.

echo [2/4] Navigating to project folder...
cd /d "%~dp0"
echo       Done!
echo.

echo [3/4] Starting backend server...
echo.
echo ============================================
echo   Server will start below
echo   Press Ctrl+C to stop
echo ============================================
echo.

node backend\server.js

echo.
echo Server stopped.
pause
