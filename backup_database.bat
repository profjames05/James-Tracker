@echo off
REM Attendance Tracker - Database Backup Script
REM This script creates a backup of your SQLite database

setlocal enabledelayedexpansion

REM Get current date and time for backup filename
for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set mydate=%%c%%a%%b)
for /f "tokens=1-2 delims=/:" %%a in ('time /t') do (set mytime=%%a%%b)

REM Create backups folder if it doesn't exist
if not exist "backups" mkdir backups

REM Copy database file to backups folder with timestamp
set backup_file=backups\attendance_backup_%mydate%_%mytime%.db

if exist "attendance.db" (
    copy attendance.db "%backup_file%"
    echo.
    echo ========================================
    echo Database backup completed successfully!
    echo ========================================
    echo Backup saved to: %backup_file%
    echo.
) else (
    echo.
    echo ========================================
    echo ERROR: attendance.db not found!
    echo ========================================
    echo Make sure the server has been run at least once.
    echo.
)

pause
