# Quick Reference Guide

## 🚀 Quick Start Command

**Windows Users - Double-click this file first:**
```
start_server.bat
```

**Or manually:**
```powershell
cd "C:\Users\PROF JAMES\OneDrive\Desktop\Attendance_Tracker"
npm start
```

Then open: **http://localhost:3000**

---

## 📋 Common Tasks

### Task 1: First Time Setup

```powershell
# 1. Navigate to project
cd "C:\Users\PROF JAMES\OneDrive\Desktop\Attendance_Tracker"

# 2. Install dependencies (one time only)
npm install

# 3. Start the server
npm start

# 4. Open browser
http://localhost:3000

# 5. Login as admin
Email: admin@admin.com
Password: admin123
```

**Time required**: 5-10 minutes

---

### Task 2: Create Student Account

1. Open http://localhost:3000
2. Make sure "Student" role is selected (default)
3. Click "Sign Up"
4. Fill in:
   - Full Name: (your name)
   - Email: (your email)
   - Password: (create password)
   - Confirm Password: (repeat password)
5. Click "Sign Up"
6. You're logged in as student

---

### Task 3: Submit Attendance

1. Login as student
2. Fill in the form:
   - index Number: (enter your student ID)
   - Course Offering: (select from dropdown)
   - Attendance: (check Present, Absent, or Excused)
   - Class Time: (select from dropdown)
3. Click "Submit Attendance"
4. See "Attendance submitted successfully!"

---

### Task 4: View Admin Dashboard

1. Open http://localhost:3000
2. Click "Admin" role button
3. Login with:
   - Email: admin@admin.com
   - Password: admin123
4. See dashboard with:
   - Total students
   - Total records
   - Present today
   - Absent today
   - Recent submissions table

---

### Task 5: Filter Attendance Records

1. Login as admin
2. Click "All Records" tab
3. Fill in optional filters:
   - Filter by Course: (select a course)
   - Filter by Status: (Present/Absent/Excused)
   - Search by Student Name: (enter name)
4. Click "Apply Filters"
5. See filtered results

---

### Task 6: Backup Database

**Option A - Double-click:**
```
backup_database.bat
```

**Option B - Manual:**
```powershell
copy attendance.db attendance_backup.db
```

File saved to: `backups\attendance_backup_[date]_[time].db`

---

### Task 7: Restore from Backup

```powershell
# Stop the server first (Ctrl+C)

# Find backup in backups\ folder

# Restore
copy backups\attendance_backup_YYYYMMDD_HHMM.db attendance.db

# Restart server
npm start
```

---

### Task 8: Change Admin Password

⚠️ Currently must be done at signup for new admin account:

1. Create new admin account in Admin signup
2. Or manually in database (advanced users)
3. Recommended: Create new admin, delete old one

---

### Task 9: Export Records to CSV

**Option A - Using SQLite CLI:**
```powershell
sqlite3 attendance.db ".mode csv" ".output records.csv" "SELECT * FROM attendance_records;"
```

**Option B - Download DB Browser:**
1. Download: https://sqlitebrowser.org/
2. Open attendance.db in DB Browser
3. Right-click table → Export as CSV

---

### Task 10: View Student History

1. Login as admin
2. Click "Student Activities" tab
3. Select student from dropdown
4. See all attendance records for that student

---

## 🔧 Troubleshooting

### Problem: "Port 3000 is already in use"

**Solution:**
```powershell
# Find process using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID with number)
taskkill /PID [PID] /F

# Restart server
npm start
```

---

### Problem: "npm: The term 'npm' is not recognized"

**Solution:**
1. Node.js not installed correctly
2. Restart your computer
3. Reinstall Node.js from https://nodejs.org/

---

### Problem: "Cannot find module errors"

**Solution:**
```powershell
# Delete node_modules
rmdir node_modules -r

# Reinstall dependencies
npm install

# Start server
npm start
```

---

### Problem: "Database errors"

**Solution:**
```powershell
# Stop server (Ctrl+C)

# Delete corrupted database
del attendance.db

# Start server again - it will recreate database
npm start
```

---

### Problem: "Cannot connect to server"

**Solution:**
1. Make sure server is running (should see "Server running on http://localhost:3000")
2. Make sure port 3000 is open
3. Try: http://localhost:3000 (not HTTPS)
4. Check firewall settings

---

### Problem: "Can't see data I submitted"

**Solution:**
1. Make sure server is still running
2. Refresh the page (F5)
3. Try different browser
4. Check browser console for errors (F12)

---

## 📊 Database Queries (For Advanced Users)

### Get all students
```sql
SELECT COUNT(DISTINCT email) FROM attendance_records;
```

### Get today's attendance
```sql
SELECT * FROM attendance_records WHERE date = '2026-04-05';
```

### Get student's records
```sql
SELECT * FROM attendance_records 
WHERE student_name = 'John Doe' 
ORDER BY submitted_at DESC;
```

### Get course statistics
```sql
SELECT course_offering, attendance_status, COUNT(*) 
FROM attendance_records 
GROUP BY course_offering, attendance_status;
```

---

## 🔐 Security Checklist

- [ ] Changed default admin password after first login
- [ ] Created strong passwords (8+ characters)
- [ ] Backed up database regularly
- [ ] Don't share admin credentials
- [ ] Keep server input validated
- [ ] Monitor for suspicious accounts
- [ ] Regularly export and archive records

---

## 📁 File Quick Reference

| File | Purpose | Edit? |
|------|---------|-------|
| index.html | Frontend - Structure | ✓ UI only |
| styles.css | Frontend - Styling | ✓ CSS only |
| script.js | Frontend - Logic | ⚠️ Careful |
| server.js | Backend - Server | ⚠️ Careful |
| package.json | Dependencies | ❌ No |
| attendance.db | Database | ❌ No |
| README.md | Documentation | ✓ Reference |

---

## ⏱️ Common Tasks Duration

| Task | Time |
|------|------|
| First time setup | 5-10 min |
| Create account | 1 min |
| Submit attendance | 2 min |
| View dashboard | 1 min |
| Backup database | 30 sec |
| Restart server | 5 sec |

---

## 🎯 One-Click Solutions

### "My app is broken"
1. Stop server: `Ctrl+C`
2. Delete database: `del attendance.db`
3. Restart server: `npm start`
4. Try again

### "I forgot admin password"
1. Stop server
2. Delete the app folder
3. Extract/reinstall fresh copy
4. Default admin available again

### "Database is too large"
1. Backup database first
2. Delete old records from database
3. Or create new database and archive old one

---

## 📞 Getting Help

### Check These First:
1. Browser console (F12)
2. Server logs (PowerShell window)
3. README.md
4. DATABASE_SCHEMA.md
5. SETUP_WINDOWS.md

### Common Error Messages:

**"Cannot POST /api/auth/login/student"**
- Server not running

**"CORS error"**
- Server not running on localhost:3000

**"Cannot read property of undefined"**
- Page not fully loaded, refresh (F5)

**"UNIQUE constraint failed"**
- Email already registered

**"Port 3000 already in use"**
- Another app using port 3000

---

## 💡 Pro Tips

1. **Backup regularly** - Use `backup_database.bat` weekly
2. **Keep server running** - Don't close PowerShell
3. **Check browser console** - F12 shows all errors
4. **Export data** - CSV exports are useful for reports
5. **Test thoroughly** - Try both student and admin roles
6. **Monitor performance** - Watch database size
7. **Document changes** - Note any modifications made

---

## 🚀 Next Steps After Installation

1. ✅ Verify server starts correctly
2. ✅ Test student account creation
3. ✅ Test attendance submission
4. ✅ Test admin dashboard
5. ✅ Create backup of database
6. ✅ Train users on how to use
7. ✅ Set up regular backup schedule

---

## 📈 Monitoring Checklist

- [ ] Server running? (Should see "Server running on http://localhost:3000")
- [ ] Database file exists? (attendance.db in project folder)
- [ ] Can login as admin? (admin@admin.com)
- [ ] Can create student? (Signup form works)
- [ ] Can submit attendance? (Form processes correctly)
- [ ] Dashboard loads? (Stats appear)
- [ ] Database grows? (File size increases after submissions)

---

## 🎓 Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| F5 | Refresh page |
| F12 | Open Developer Console |
| Ctrl+C | Stop server |
| Ctrl+Shift+Delete | Clear browser cache |
| Alt+Tab | Switch windows |
| Win+Run | Open Run dialog (type `powershell`) |

---

**Version**: 1.0  
**Last Updated**: April 5, 2026  
**Status**: Ready to Use ✓
