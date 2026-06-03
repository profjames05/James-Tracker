# Setup Instructions for Windows Users

## Quick Start Guide

### 1. Install Node.js

1. Visit https://nodejs.org/
2. Click "LTS" (Long-term Support) version
3. Run the installer and follow the on-screen steps
4. Check boxes for "Add to PATH" and "Automatically install necessary tools"
5. Restart your computer after installation

### 2. Verify Installation

Open PowerShell and type:
```powershell
node --version
npm --version
```

Both commands should display version numbers.

### 3. Install Dependencies

1. Open PowerShell
2. Navigate to the Attendance_Tracker folder:
   ```powershell
   cd "C:\Users\PROF JAMES\OneDrive\Desktop\Attendance_Tracker"
   ```
3. Install packages:
   ```powershell
   npm install
   ```

Wait for installation to complete (may take 2-5 minutes).

### 4. Start the Server

In the same PowerShell window, type:
```powershell
npm start
```

You should see:
```
Connected to SQLite database
Database tables initialized
Default admin account created
Server running on http://localhost:3000
Database: C:\Users\PROF JAMES\OneDrive\Desktop\Attendance_Tracker\attendance.db
```

### 5. Access the Application

1. Open your web browser (Chrome, Edge, Firefox, etc.)
2. Go to: `http://localhost:3000`
3. The Attendance Tracker app should load

### Default Login Credentials

**Role**: Admin
**Email**: admin@admin.com
**Password**: admin123

## To Stop the Server

Press `Ctrl + C` in PowerShell

## To Restart the Server

1. Press `Ctrl + C` to stop
2. Type: `npm start` again

## Important Notes

⚠️ The server MUST be running for the app to work
⚠️ Keep the PowerShell window open while using the app
⚠️ When you close PowerShell, the server stops

## File Locations

Your database will be stored at:
```
C:\Users\PROF JAMES\OneDrive\Desktop\Attendance_Tracker\attendance.db
```

All your attendance records are saved in the SQLite database file.

## Troubleshooting

### "npm: The term 'npm' is not recognized"
- Node.js wasn't installed correctly or not added to PATH
- Restart your computer
- Reinstall Node.js

### "Port 3000 is already in use"
- Another application is using port 3000
- Close other applications or:
  ```powershell
  netstat -ano | findstr :3000
  taskkill /PID [pid] /F
  ```

### "Cannot find module"
- Run: `npm install` again
- Delete `node_modules` folder and `package-lock.json`, then run `npm install`

### "Database error"
- Delete `attendance.db` file
- Restart the server with `npm start`
- The database will be recreated automatically

## Leaving the Application Running

To keep the server running even after closing PowerShell, you can:

1. Install PM2 globally:
   ```powershell
   npm install -g pm2
   ```

2. Start the server with PM2:
   ```powershell
   pm2 start server.js --name "AttendanceTracker"
   ```

3. View running processes:
   ```powershell
   pm2 list
   ```

4. Stop the server:
   ```powershell
   pm2 stop AttendanceTracker
   ```

## Next Steps

1. Test student signup and login
2. Submit attendance record
3. Test admin dashboard
4. Change default admin password for security
5. Backup your `attendance.db` file regularly

---

Need help? Check the README.md file or the browser console (F12) for error messages.
