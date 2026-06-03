@echo off
REM UENR Attendance Tracker - Setup and Start Script
REM This script will help you set up the application

echo.
echo ========================================
echo UENR Attendance Tracker Setup
echo ========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo Please download and install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo [OK] Node.js detected
echo.

REM Check if dependencies are installed
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
    echo [OK] Dependencies installed
) else (
    echo [OK] Dependencies already installed
)

echo.
echo ========================================
echo Important: Logo Setup
echo ========================================
echo.
echo The logo file should be saved at:
echo   images\uener_logo.png
echo.
echo The system expects a PNG image of the UENR logo.
echo Copy your logo file to the images folder now!
echo.
pause

echo.
echo Starting server...
echo.
echo Access the application at: http://localhost:3000
echo.
echo Press Ctrl+C to stop the server
echo.

call node server.js
