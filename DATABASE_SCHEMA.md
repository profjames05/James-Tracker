# Database Schema Documentation

This document describes the SQLite database structure for the Attendance Tracker application.

## Database File
- **Location**: `attendance.db` (in the project root)
- **Type**: SQLite 3
- **Auto-created**: Yes, on first server start
- **Backup**: Use `backup_database.bat` script

## Tables

### 1. STUDENTS Table
Stores information about student users who submit attendance.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY, AUTO INCREMENT | Unique student identifier |
| name | TEXT | NOT NULL | Full name of the student |
| email | TEXT | NOT NULL, UNIQUE | Email address (unique) |
| password | TEXT | NOT NULL | Encrypted password (using bcryptjs) |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Account creation timestamp |

**Example Data**:
```
id: 1
name: John Doe
email: john@example.com
password: $2a$10$...(encrypted)
created_at: 2026-04-05 10:30:45
```

---

### 2. ADMINS Table
Stores information about admin users who manage the system.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY, AUTO INCREMENT | Unique admin identifier |
| name | TEXT | NOT NULL | Full name of the admin |
| email | TEXT | NOT NULL, UNIQUE | Email address (unique) |
| password | TEXT | NOT NULL | Encrypted password (using bcryptjs) |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Account creation timestamp |

**Example Data**:
```
id: 1
name: Admin User
email: admin@admin.com
password: $2a$10$...(encrypted)
created_at: 2026-04-05 08:00:00
```

---

### 3. ATTENDANCE_RECORDS Table
Stores all attendance submissions by students.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY, AUTO INCREMENT | Unique record identifier |
| student_id | INTEGER | NOT NULL, FOREIGN KEY | References students.id |
| student_name | TEXT | NOT NULL | Name of the student |
| email | TEXT | NOT NULL | Email of the student |
| index_number | TEXT | NOT NULL | Student index/ID number |
| course_offering | TEXT | NOT NULL | Course code (e.g., CS101) |
| attendance_status | TEXT | NOT NULL | Present/Absent/Excused Absence |
| class_time | TEXT | NOT NULL | Class time slot |
| submitted_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | When record was submitted |
| date | DATE | NOT NULL | Date of attendance |

**Example Data**:
```
id: 1
student_id: 1
student_name: John Doe
email: john@example.com
index_number: STU001
course_offering: CS101
attendance_status: Present
class_time: 8:00 AM - 10:00 AM
submitted_at: 2026-04-05 09:30:15
date: 2026-04-05
```

---

## Relationships

```
STUDENTS
   |
   |-- (1:N) ---> ATTENDANCE_RECORDS
   |
   └─ One student can have many attendance records

ADMINS
   |
   └─ Admins view and manage all attendance records
```

## Indexing (Recommended for Production)

For better query performance, consider adding these indexes:

```sql
CREATE INDEX idx_students_email ON students(email);
CREATE INDEX idx_admins_email ON admins(email);
CREATE INDEX idx_attendance_student_id ON attendance_records(student_id);
CREATE INDEX idx_attendance_date ON attendance_records(date);
CREATE INDEX idx_attendance_status ON attendance_records(attendance_status);
CREATE INDEX idx_attendance_course ON attendance_records(course_offering);
```

## SQL Queries Reference

### Get total students
```sql
SELECT COUNT(DISTINCT email) as total_students FROM attendance_records;
```

### Get attendance for a specific date
```sql
SELECT * FROM attendance_records WHERE date = '2026-04-05';
```

### Get student's all attendance records
```sql
SELECT * FROM attendance_records 
WHERE email = 'john@example.com' 
ORDER BY submitted_at DESC;
```

### Filter by course and status
```sql
SELECT * FROM attendance_records 
WHERE course_offering = 'CS101' 
  AND attendance_status = 'Present'
ORDER BY submitted_at DESC;
```

### Get statistics
```sql
SELECT 
    COUNT(DISTINCT email) as total_students,
    COUNT(*) as total_records,
    SUM(CASE WHEN attendance_status = 'Present' THEN 1 ELSE 0 END) as present_count,
    SUM(CASE WHEN attendance_status = 'Absent' THEN 1 ELSE 0 END) as absent_count
FROM attendance_records;
```

## Data Types

- **INTEGER**: Whole numbers (used for IDs)
- **TEXT**: Text strings of any length
- **DATE**: YYYY-MM-DD format
- **DATETIME**: YYYY-MM-DD HH:MM:SS format

## Constraints

- **PRIMARY KEY**: Uniquely identifies each row
- **FOREIGN KEY**: Links to another table
- **UNIQUE**: Ensures no duplicate values
- **NOT NULL**: Column must have a value
- **DEFAULT**: Sets a default value if not provided

## Backup and Recovery

### Backup
```bash
copy attendance.db attendance_backup.db
```

Or use:
```bash
backup_database.bat
```

### Restore
```bash
copy attendance_backup.db attendance.db
del-database
restart server
```

## Data Export

To export data to CSV format:

1. Using command line:
```bash
sqlite3 attendance.db ".mode csv" ".output export.csv" "SELECT * FROM attendance_records;"
```

2. Using SQLite Browser:
- Download DB Browser for SQLite
- Open `attendance.db`
- Right-click table → Export as CSV

## Important Notes

⚠️ **Password Security**: Passwords are encrypted using bcryptjs, never store plain text!
⚠️ **Data Privacy**: Ensure compliance with GDPR/local regulations
⚠️ **Regular Backups**: Keep regular backups of your database
⚠️ **Permissions**: Keep database file secure with proper file permissions

---

**Last Updated**: April 2026
