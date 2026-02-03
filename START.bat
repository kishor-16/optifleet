@echo off
echo ============================================
echo OptiFleet - Starting Server
echo ============================================
echo.

echo Stopping any existing servers on port 3000...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3000" ^| find "LISTENING"') do (
    echo Killing process %%a
    taskkill /F /PID %%a >nul 2>&1
)

echo.
echo Starting OptiFleet backend server...
echo.

cd /d "%~dp0"
node backend\server.js

pause
