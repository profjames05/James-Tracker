## UENR Attendance Tracker - Updated Setup Guide

### Step 1: Save the Logo
The logo image you provided needs to be saved to the project folder:

1. **Right-click the UENR logo image** (the one you uploaded)
2. **Select "Save image as..."**
3. **Save it with the name:** `uener_logo.png`
4. **Save it to this location:** 
   ```
   c:\Users\PROF JAMES\OneDrive\Desktop\Attendance_Tracker\images\
   ```

**Final path should be:** `c:\Users\PROF JAMES\OneDrive\Desktop\Attendance_Tracker\images\uener_logo.png`

### Step 2: Start the Server
1. Open Command Prompt or PowerShell
2. Navigate to the project folder:
   ```
   cd c:\Users\PROF JAMES\OneDrive\Desktop\Attendance_Tracker
   ```
3. Start the server:
   ```
   node server.js
   ```

### Step 3: Access the Application
1. Open your web browser
2. Go to: `http://localhost:3000`
3. You should see the UENR logo at the top with the subtitle

### Step 4: Login & Test
**Admin Account (for testing):**
- Email: `admin@uenr.edu.gh`
- Password: `admin123`

**Or create a new student account** by clicking "Sign Up"

### Available Courses

#### Information Technology (IT)
- IT101 - Introduction to Information Technology
- IT202 - Network Administration

#### Computer Science (CS)
- CS101 - Introduction to Computer Science
- CS202 - Data Structures and Algorithms
- CS303 - Software Development

#### Biological Science (BS)
- BS101 - Introduction to Biological Science
- BS202 - Cellular Biology
- BS303 - Genetics and Evolution

#### Hospitality Management (HM)
- HM101 - Hospitality Management Fundamentals
- HM202 - Hotel Operations
- HM303 - Event Management

### Troubleshooting

**Logo not showing?**
- Ensure the image file is named exactly: `uener_logo.png`
- Ensure it's in the `images` folder
- Try refreshing the page (F5)

**Server not connecting?**
- Make sure `node server.js` is running in your terminal
- Access via `http://localhost:3000` (NOT the file path)
- Check that port 3000 is not blocked

**Need to stop the server?**
- Press `Ctrl+C` in the terminal

### Quick Start Script
You can also run the setup script:
```
setup_and_start.bat
```
This will check dependencies and start the server automatically.
