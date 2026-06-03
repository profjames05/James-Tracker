# UENR Attendance Tracker - Setup Complete ✓

## Current Status
- ✓ Server is running on http://localhost:3000
- ✓ Database is initialized
- ✓ All courses configured (IT, Computer Science, Biological Science, Hospitality Management)
- ✓ Admin account created

## LOGO SETUP - IMPORTANT!

### To display the UENR logo:

1. **Right-click the logo image you provided** (bottom of your browser)
2. Select **"Save image as..."** or **"Download image"**
3. Name it: **`uener_logo.png`**
4. Save it to: **`c:\Users\PROF JAMES\OneDrive\Desktop\Attendance_Tracker\images\`**

The complete path should be:
```
c:\Users\PROF JAMES\OneDrive\Desktop\Attendance_Tracker\images\uener_logo.png
```

### After saving the logo:
- Refresh your browser (F5)
- The large UENR logo will appear at the top of the page

---

## Features Included

### Courses by Department

| IT | Computer Science | Biological Science | Hospitality Management |
|----|------------------|-------------------|----------------------|
| IT101 - Introduction to IT | CS101 - Intro to CS | BS101 - Intro to Bio | HM101 - Fundamentals |
| IT202 - Network Admin | CS202 - Data Structures | BS202 - Cellular Bio | HM202 - Hotel Operations |
| | CS303 - Software Dev | BS303 - Genetics | HM303 - Event Management |

### User Roles
- **Admin**: View all records, generate reports, manage data
- **Students**: Submit attendance, view personal records

### Attendance Status
- Present
- Absent
- Excused Absence

---

## How to Run

**Server is currently running!**

To access the application:
1. Open browser
2. Go to: `http://localhost:3000`
3. Login or Sign Up

Default Admin Credentials:
- Email: `admin@uenr.edu.gh`
- Password: `admin123`

---

## File Locations

```
Attendance_Tracker/
├── index.html              # Main interface
├── server.js              # Backend server
├── script.js              # Frontend logic
├── styles.css             # Styling
├── attendance.db          # Database (auto-created)
├── images/
│   └── uener_logo.png    # ← SAVE LOGO HERE
├── QUICK_START.md         # Quick reference
├── LOGO_SETUP.md          # Detailed logo setup
└── setup_and_start.bat    # One-click startup
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Logo not showing | Save `uener_logo.png` to images folder, then refresh |
| Server won't start | Ensure Node.js is installed, run `npm install` first |
| Can't connect to server | Make sure http://localhost:3000 is used (not file://) |
| Attendance not submitting | Verify server is running (should show output in terminal) |

---

## Quick Commands

```cmd
# Install dependencies (if needed)
npm install

# Start the server
node server.js

# Stop the server
Ctrl + C

# View database contents (requires sqlite3)
sqlite3 attendance.db
```

---

Generated: April 6, 2026
UENR Attendance Tracking System v1.0
