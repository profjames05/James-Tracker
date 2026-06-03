const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const os = require('os');
const path = require('path');

const app = express();
const PORT = 3000;
const tempLinks = new Map();

function getLocalNetworkHost() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return null;
}

setInterval(() => {
    const now = Date.now();
    for (const [token, expiresAt] of tempLinks) {
        if (expiresAt < now) {
            tempLinks.delete(token);
        }
    }
}, 60000);

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});

// Initialize SQLite Database
const DATABASE = path.join(__dirname, 'attendance.db');
const db = new sqlite3.Database(DATABASE, (err) => {
    if (err) {
        console.error('Error opening database:', err);
    } else {
        console.log('Connected to SQLite database');
        initializeDatabase();
    }
});

// Initialize Database Tables
function initializeDatabase() {
    db.serialize(() => {
        // Users (Students) Table
        db.run(`
            CREATE TABLE IF NOT EXISTS students (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Admins Table
        db.run(`
            CREATE TABLE IF NOT EXISTS admins (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `, (err) => {
            if (err) console.log('Admins table exists');
            else createDefaultAdmin();
        });

        // Attendance Records Table
        db.run(`
            CREATE TABLE IF NOT EXISTS attendance_records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_id INTEGER NOT NULL,
                student_name TEXT NOT NULL,
                email TEXT NOT NULL,
                index_number TEXT NOT NULL,
                course_offering TEXT NOT NULL,
                attendance_status TEXT NOT NULL,
                class_time TEXT NOT NULL,
                submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                date DATE NOT NULL,
                FOREIGN KEY (student_id) REFERENCES students(id)
            )
        `);

        console.log('Database tables initialized');
    });
}

// Create default admin account
function createDefaultAdmin() {
    const email = 'admin@uenr.edu.gh';
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    
    db.run(
        'INSERT OR IGNORE INTO admins (name, email, password) VALUES (?, ?, ?)',
        ['UENR Admin', email, hashedPassword],
        (err) => {
            if (!err) {
                console.log('Default admin account created');
            }
        }
    );
}

// ===== AUTHENTICATION ENDPOINTS =====

// Student Login
app.post('/api/auth/login/student', (req, res) => {
    const { email, password } = req.body;

    db.get('SELECT * FROM students WHERE email = ?', [email], (err, row) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Database error' });
        }

        if (!row) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        if (!bcrypt.compareSync(password, row.password)) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        res.json({
            success: true,
            user: { id: row.id, email: row.email, name: row.name, role: 'student' }
        });
    });
});

// Admin Login
app.post('/api/auth/login/admin', (req, res) => {
    const { email, password } = req.body;

    db.get('SELECT * FROM admins WHERE email = ?', [email], (err, row) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Database error' });
        }

        if (!row) {
            return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
        }

        if (!bcrypt.compareSync(password, row.password)) {
            return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
        }

        res.json({
            success: true,
            user: { id: row.id, email: row.email, name: row.name, role: 'admin' }
        });
    });
});

// Student Signup
app.post('/api/auth/signup/student', (req, res) => {
    const { name, email, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
        return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    db.run(
        'INSERT INTO students (name, email, password) VALUES (?, ?, ?)',
        [name, email, hashedPassword],
        (err) => {
            if (err) {
                if (err.message.includes('UNIQUE')) {
                    return res.status(400).json({ success: false, message: 'Email already registered as student' });
                }
                return res.status(500).json({ success: false, message: 'Database error' });
            }

            res.json({
                success: true,
                user: { email, name, role: 'student' }
            });
        }
    );
});

// Admin Signup
app.post('/api/auth/signup/admin', (req, res) => {
    const { name, email, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
        return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    db.run(
        'INSERT INTO admins (name, email, password) VALUES (?, ?, ?)',
        [name, email, hashedPassword],
        (err) => {
            if (err) {
                if (err.message.includes('UNIQUE')) {
                    return res.status(400).json({ success: false, message: 'Email already registered as admin' });
                }
                return res.status(500).json({ success: false, message: 'Database error' });
            }

            res.json({
                success: true,
                user: { email, name, role: 'admin' }
            });
        }
    );
});

// ===== ATTENDANCE ENDPOINTS =====

// Submit Attendance
app.post('/api/attendance/submit', (req, res) => {
    const { student_id, student_name, email, index_number, course_offering, attendance_status, class_time } = req.body;

    if (!attendance_status) {
        return res.status(400).json({ success: false, message: 'Please select an attendance status' });
    }

    const today = new Date().toISOString().split('T')[0];

    db.run(
        `INSERT INTO attendance_records 
         (student_id, student_name, email, index_number, course_offering, attendance_status, class_time, date) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [student_id, student_name, email, index_number, course_offering, attendance_status, class_time, today],
        (err) => {
            if (err) {
                return res.status(500).json({ success: false, message: 'Error submitting attendance' });
            }

            res.json({ success: true, message: 'Attendance submitted successfully' });
        }
    );
});

// Get all attendance records
app.get('/api/attendance/all', (req, res) => {
    db.all(`
        SELECT * FROM attendance_records 
        ORDER BY submitted_at DESC
    `, (err, rows) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Database error' });
        }

        res.json({ success: true, records: rows || [] });
    });
});

// ===== ADMIN DASHBOARD ENDPOINTS =====

// Get Dashboard Statistics
app.get('/api/admin/stats', (req, res) => {
    const today = new Date().toISOString().split('T')[0];

    db.all(`SELECT COUNT(DISTINCT email) as total_students FROM attendance_records`, (err, result1) => {
        db.all(`SELECT COUNT(*) as total_records FROM attendance_records`, (err, result2) => {
            db.all(`SELECT COUNT(*) as present_today FROM attendance_records WHERE date = ? AND attendance_status = 'Present'`, [today], (err, result3) => {
                db.all(`SELECT COUNT(*) as absent_today FROM attendance_records WHERE date = ? AND attendance_status = 'Absent'`, [today], (err, result4) => {
                    res.json({
                        success: true,
                        stats: {
                            totalStudents: result1[0]?.total_students || 0,
                            totalRecords: result2[0]?.total_records || 0,
                            presentToday: result3[0]?.present_today || 0,
                            absentToday: result4[0]?.absent_today || 0
                        }
                    });
                });
            });
        });
    });
});

// Get Recent Records (last 10)
app.get('/api/admin/recent', (req, res) => {
    db.all(`
        SELECT * FROM attendance_records 
        ORDER BY submitted_at DESC 
        LIMIT 10
    `, (err, rows) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Database error' });
        }

        res.json({ success: true, records: rows || [] });
    });
});

// Generate temporary access link valid for 15 minutes
app.post('/api/admin/generate-link', (req, res) => {
    const token = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');
    const expiresAt = Date.now() + 15 * 60 * 1000;
    tempLinks.set(token, expiresAt);

    const requestHost = req.get('host');
    let host = requestHost;
    let protocol = req.headers['x-forwarded-proto'] || req.protocol;

    if (requestHost.startsWith('localhost') || requestHost.startsWith('127.')) {
        const localIp = getLocalNetworkHost();
        if (localIp) {
            host = `${localIp}:${PORT}`;
            protocol = 'http';
        }
    }

    const accessUrl = `${protocol}://${host}/access/${token}`;

    res.json({ success: true, accessUrl, expiresAt });
});

// Filter Records by Course, Status, and Student Name
app.get('/api/admin/filter', (req, res) => {
    const { course, status, studentName } = req.query;

    let query = 'SELECT * FROM attendance_records WHERE 1=1';
    const params = [];

    if (course) {
        query += ' AND course_offering = ?';
        params.push(course);
    }

    if (status) {
        query += ' AND attendance_status = ?';
        params.push(status);
    }

    if (studentName) {
        query += ' AND student_name LIKE ?';
        params.push(`%${studentName}%`);
    }

    query += ' ORDER BY submitted_at DESC';

    db.all(query, params, (err, rows) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Database error' });
        }

        res.json({ success: true, records: rows || [] });
    });
});

// Get All Students
app.get('/api/admin/students', (req, res) => {
    db.all(`
        SELECT DISTINCT student_name, email FROM attendance_records 
        ORDER BY student_name
    `, (err, rows) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Database error' });
        }

        res.json({ success: true, students: rows || [] });
    });
});

// Get Student Activity
app.get('/api/admin/student-activity/:studentName', (req, res) => {
    const { studentName } = req.params;

    db.all(
        `SELECT * FROM attendance_records WHERE student_name = ? ORDER BY submitted_at DESC`,
        [decodeURIComponent(studentName)],
        (err, rows) => {
            if (err) {
                return res.status(500).json({ success: false, message: 'Database error' });
            }

            res.json({ success: true, records: rows || [] });
        }
    );
});

// Access temporary link
app.get('/access/:token', (req, res) => {
    const { token } = req.params;
    const expiresAt = tempLinks.get(token);

    if (!expiresAt || expiresAt < Date.now()) {
        tempLinks.delete(token);
        return res.status(404).send(`
            <html>
                <head><title>Access Expired</title></head>
                <body style="font-family: Arial, sans-serif; text-align: center; padding: 40px;">
                    <h1>Access Link Invalid or Expired</h1>
                    <p>This temporary access link is no longer valid. Please ask the admin to generate a new link.</p>
                </body>
            </html>
        `);
    }

    res.sendFile(path.join(__dirname, 'index.html'));
});

// ===== ERROR HANDLING =====

app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Endpoint not found' });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Database: ${DATABASE}`);
});

process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err);
        } else {
            console.log('Database connection closed');
        }
        process.exit(0);
    });
});
