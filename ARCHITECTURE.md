# System Architecture

## Application Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        WEB BROWSER                               │
│  User Interface: index.html + styles.css + script.js            │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                                                              │ │
│  │  Student Module          OR          Admin Module           │ │
│  │  ├─ Login/Signup                     ├─ Login/Signup       │ │
│  │  └─ Submit Attendance                ├─ Dashboard Stats    │ │
│  │                                      ├─ View All Records   │ │
│  │                                      ├─ Filter Records     │ │
│  │                                      └─ Student Activities │ │
│  │                                                              │ │
│  └────────────────────────────────────────────────────────────┘ │
│                           ▲                                       │
│                           │                                       │
│                      HTTP Requests/                              │
│                      JSON Responses                              │
│                           │                                       │
│                           ▼                                       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│          NODE.JS / EXPRESS SERVER (server.js)                   │
│          Running on: http://localhost:3000                      │
│                                                                   │
│  REST API Endpoints:                                             │
│  ├─ POST   /api/auth/login/student                              │
│  ├─ POST   /api/auth/login/admin                                │
│  ├─ POST   /api/auth/signup/student                             │
│  ├─ POST   /api/auth/signup/admin                               │
│  ├─ POST   /api/attendance/submit                               │
│  ├─ GET    /api/attendance/all                                  │
│  ├─ GET    /api/admin/stats                                     │
│  ├─ GET    /api/admin/recent                                    │
│  ├─ GET    /api/admin/filter                                    │
│  ├─ GET    /api/admin/students                                  │
│  └─ GET    /api/admin/student-activity/:studentName             │
│                           ▲                                       │
│                           │                                       │
│                    Database Queries                              │
│                    (SQL Statements)                              │
│                           │                                       │
│                           ▼                                       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│              SQLite DATABASE (attendance.db)                     │
│                                                                   │
│  Table: STUDENTS                    Table: ADMINS                │
│  ┌─────────────────────────┐       ┌─────────────────────────┐  │
│  │ id (PK)                 │       │ id (PK)                 │  │
│  │ name                    │       │ name                    │  │
│  │ email (UNIQUE)          │       │ email (UNIQUE)          │  │
│  │ password (encrypted)    │       │ password (encrypted)    │  │
│  │ created_at              │       │ created_at              │  │
│  └─────────────────────────┘       └─────────────────────────┘  │
│                                                                   │
│  Table: ATTENDANCE_RECORDS                                       │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ id (PK)                                                    │ │
│  │ student_id (FK → STUDENTS.id)                             │ │
│  │ student_name                                              │ │
│  │ email                                                     │ │
│  │ index_number                                              │ │
│  │ course_offering (CS101, CS202, etc.)                     │ │
│  │ attendance_status (Present/Absent/Excused)              │ │
│  │ class_time                                                │ │
│  │ submitted_at                                              │ │
│  │ date                                                      │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────┐
│   File System        │
│                      │
│ attendance.db        │
│ (SQLite Database)    │
│                      │
└──────────────────────┘
```

---

## Component Breakdown

### 1. Frontend (Browser)

**Files:**
- `index.html` - Structure and form elements
- `styles.css` - Styling and responsive design
- `script.js` - JavaScript logic and API calls

**Functionality:**
- User interface rendering
- Form validation
- API communication
- Display management (show/hide sections)
- Event handling

**Technologies:**
- HTML5
- CSS3
- Vanilla JavaScript (ES6+)
- Fetch API

---

### 2. Backend (Server)

**File:**
- `server.js` - Express.js application

**Functionality:**
- REST API endpoints
- Request routing
- Middleware handling (CORS, body-parser)
- Password encryption (bcryptjs)
- Database operations

**Technologies:**
- Node.js
- Express.js
- SQLite3
- bcryptjs

**Port:** 3000

---

### 3. Database

**File:**
- `attendance.db` - SQLite database file

**Tables:**
- `students` - Student user accounts
- `admins` - Admin user accounts
- `attendance_records` - Attendance records

**Relationships:**
- ATTENDANCE_RECORDS.student_id → STUDENTS.id (Foreign Key)

---

## Data Flow Examples

### Example 1: Student Login

```
1. User enters email & password in browser
   ↓
2. JavaScript captures form submit event
   ↓
3. JavaScript sends POST request to:
   POST /api/auth/login/student
   {
     "email": "john@example.com",
     "password": "password123"
   }
   ↓
4. Server receives request
   ↓
5. Server queries database:
   SELECT * FROM students WHERE email = 'john@example.com'
   ↓
6. Server retrieves student record from database
   ↓
7. Server compares passwords using bcrypt
   ↓
8. If match:
   Server sends response:
   {
     "success": true,
     "user": {
       "id": 1,
       "email": "john@example.com",
       "name": "John Doe",
       "role": "student"
     }
   }
   ↓
9. JavaScript receives response and stores in currentUser variable
   ↓
10. JavaScript shows attendance section
```

---

### Example 2: Submit Attendance

```
1. Student fills out attendance form
   ↓
2. Student clicks "Submit Attendance"
   ↓
3. JavaScript validates form data
   ↓
4. JavaScript sends POST to:
   POST /api/attendance/submit
   {
     "student_id": 1,
     "student_name": "John Doe",
     "email": "john@example.com",
     "index_number": "STU001",
     "course_offering": "CS101",
     "attendance_status": "Present",
     "class_time": "8:00 AM - 10:00 AM"
   }
   ↓
5. Server validates data
   ↓
6. Server inserts into database:
   INSERT INTO attendance_records (...)
   VALUES (...)
   ↓
7. Database stores the record permanently
   ↓
8. Server sends response:
   {
     "success": true,
     "message": "Attendance submitted successfully"
   }
   ↓
9. JavaScript shows success message
   ↓
10. Record is saved in database permanently ✓
```

---

### Example 3: Admin Dashboard

```
1. Admin navigates to Dashboard
   ↓
2. JavaScript triggers loadDashboardData()
   ↓
3. JavaScript sends GET requests to:
   - GET /api/admin/stats
   - GET /api/admin/recent
   ↓
4. Server queries database:
   
   For stats:
   - COUNT(DISTINCT email) FROM attendance_records
   - COUNT(*) FROM attendance_records
   - COUNT(*) WHERE attendance_status = 'Present' AND date = today
   - COUNT(*) WHERE attendance_status = 'Absent' AND date = today
   
   For recent:
   - SELECT * FROM attendance_records ORDER BY submitted_at DESC LIMIT 10
   
   ↓
5. Server returns JSON response:
   {
     "success": true,
     "stats": {
       "totalStudents": 150,
       "totalRecords": 3250,
       "presentToday": 89,
       "absentToday": 12
     },
     "records": [...]
   }
   ↓
6. JavaScript receives data
   ↓
7. JavaScript updates dashboard UI with stats and table
   ↓
8. Admin sees real-time data from database ✓
```

---

## Technology Stack

```
┌─────────────────────────────────────────┐
│        PRESENTATION LAYER               │
│  HTML5 | CSS3 | Vanilla JavaScript      │
│  (Browser-side rendering)               │
└─────────────────────────────────────────┘
              ↑↓ (HTTP/JSON)
┌─────────────────────────────────────────┐
│       APPLICATION LAYER                 │
│  Node.js | Express.js                   │
│  (REST API endpoints)                   │
│  (Request routing)                      │
│  (Business logic)                       │
└─────────────────────────────────────────┘
              ↑↓ (SQL)
┌─────────────────────────────────────────┐
│         DATA LAYER                      │
│  SQLite3 | Database Queries             │
│  (Data persistence)                     │
│  (Data integrity)                       │
└─────────────────────────────────────────┘
              ↑↓
┌─────────────────────────────────────────┐
│      STORAGE LAYER                      │
│  File System | attendance.db            │
│  (Binary SQLite database file)          │
└─────────────────────────────────────────┘
```

---

## Security Architecture

```
┌──────────────────────────────────┐
│    PASSWORD ENCRYPTION           │
│                                  │
│ User Input → bcryptjs → Hash     │
│            (10 rounds)           │
│                                  │
│ Stored in database: $2a$10$...   │
│ (Never plain text) ✓             │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│    SQL INJECTION PROTECTION      │
│                                  │
│ All queries use parameters       │
│ ? placeholders (no string concat)│
│                                  │
│ Example:                         │
│ db.run(                          │
│   'SELECT * FROM users           │
│    WHERE email = ?',             │
│   [userEmail]  ← Parameter       │
│ )                                │
│                                  │
│ Protected ✓                      │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│    UNIQUE CONSTRAINTS            │
│                                  │
│ Email uniqueness enforced at DB  │
│ No duplicate emails possible     │
│                                  │
│ PRIMARY KEY UNIQUE NOT NULL      │
│                                  │
│ Protected ✓                      │
└──────────────────────────────────┘
```

---

## File Organization

```
Attendance_Tracker/
│
├── Frontend Files
│   ├── index.html         (HTML structure)
│   ├── styles.css         (Styling)
│   └── script.js          (Client-side logic)
│
├── Backend Files
│   ├── server.js          (Express server & API)
│   └── package.json       (Dependencies)
│
├── Database File
│   └── attendance.db      (SQLite database - auto-created)
│
├── Documentation
│   ├── README.md          (Main documentation)
│   ├── SETUP_WINDOWS.md   (Windows setup guide)
│   ├── DATABASE_SCHEMA.md (Database structure)
│   └── SETUP_SUMMARY.md   (Implementation summary)
│
└── Utility Scripts
    ├── start_server.bat   (Start server on Windows)
    └── backup_database.bat (Backup database on Windows)
```

---

## Request/Response Cycle

```
BROWSER                           SERVER                       DATABASE
  │                                 │                              │
  ├─ HTTP POST Request ────────────>│                              │
  │  (User credentials)             │                              │
  │                                 ├─ Extract data                │
  │                                 │                              │
  │                                 ├─ Validate input              │
  │                                 │                              │
  │                                 ├─ Query ───────────────────>│
  │                                 │  SELECT * FROM students    │
  │                                 │  WHERE email = ?           │
  │                                 │                              │
  │                                 │<────── Return record ─────  │
  │                                 │                              │
  │                                 ├─ Compare passwords           │
  │                                 │  (using bcryptjs)           │
  │                                 │                              │
  │                                 ├─ Create response JSON       │
  │                                 │                              │
  │<────── HTTP 200 ───────────────<│                              │
  │  (JSON response)                │                              │
  │                                 │                              │
  ├─ Parse JSON                     │                              │
  │                                 │                              │
  ├─ Update UI                      │                              │
  │                                 │                              │
  └─ Show Success Message           │                              │
```

---

## Performance Considerations

- **Database Indexing**: Consider adding indexes for frequently queried fields
- **Query Optimization**: Queries are optimized with WHERE clauses
- **Connection Pooling**: SQLite handles single-user efficiently
- **Response Caching**: Could be implemented for admin stats
- **Pagination**: Could be added for large record sets
- **Compression**: GZIP could reduce response sizes

---

## Scalability Path

```
Current: sqlite (single-file)
   ↓
Medium: PostgreSQL (multi-user)
   ↓
Large: MongoDB (distributed)
   ↓
Enterprise: Multi-database with caching
```

---

**Architecture Version**: 1.0
**Created**: April 5, 2026
**Status**: Production Ready ✓
