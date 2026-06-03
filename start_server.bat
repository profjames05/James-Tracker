@echo off
REM Attendance Tracker - Start Server Script
REM This script starts the attendance tracker application

echo.
echo ========================================
echo   Attendance Tracker - Starting Server
echo ========================================
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    echo.
    call npm install
    echo.
)

REM Start the server
echo Starting server on http://localhost:3000
echo.
echo Press Ctrl+C to stop the server
echo.
call npm start

pause
