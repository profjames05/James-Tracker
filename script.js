const API_URL = 'http://localhost:3000/api';

let currentUser = null;
let currentRole = 'student';

// Check server connection on page load
window.addEventListener('load', async () => {
    try {
        const response = await fetch(`${API_URL}/health`, { method: 'GET' });
        if (!response.ok) throw new Error('Server not responding');
        console.log('✓ Server connected');
    } catch (error) {
        alert('Warning: Cannot connect to server. Please make sure the server is running on http://localhost:3000\n\nTo start the server:\n1. Open command prompt\n2. Navigate to the project folder\n3. Run: npm install\n4. Run: node server.js\n5. Open http://localhost:3000 in your browser');
    }
});

// Role Selection
function selectRole(role) {
    currentRole = role;
    document.getElementById('studentRoleBtn').classList.toggle('active', role === 'student');
    document.getElementById('adminRoleBtn').classList.toggle('active', role === 'admin');
    
    // Update toggle text based on role
    const toggleText = document.getElementById('toggleText');
    if (role === 'admin') {
        toggleText.textContent = "Don't have an admin account? ";
    } else {
        toggleText.textContent = "Don't have an account? ";
    }
    
    // Reset forms
    loginForm.reset();
    document.getElementById('authError').style.display = 'none';
}

// Toggle between login and signup (for both student and admin)
const toggleBtn = document.getElementById('toggleBtn');
const toggleText = document.getElementById('toggleText');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');

toggleBtn.addEventListener('click', () => {
    loginForm.classList.toggle('hidden');
    signupForm.classList.toggle('hidden');
    
    if (loginForm.classList.contains('hidden')) {
        const roleText = currentRole === 'admin' ? 'Admin Account' : 'Your Account';
        document.getElementById('authTitle').textContent = `Create ${roleText}`;
        toggleText.textContent = 'Already have an account? ';
        toggleBtn.textContent = 'Login';
    } else {
        document.getElementById('authTitle').textContent = 'Attendance Tracker';
        const toggleTextContent = currentRole === 'admin' ? "Don't have an admin account? " : "Don't have an account? ";
        toggleText.textContent = toggleTextContent;
        toggleBtn.textContent = 'Sign Up';
    }
});

// Login handler
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const authError = document.getElementById('authError');

    try {
        const endpoint = currentRole === 'admin' ? '/auth/login/admin' : '/auth/login/student';
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (data.success) {
            currentUser = data.user;
            authError.style.display = 'none';
            if (currentRole === 'admin') {
                showAdminSection();
            } else {
                showAttendanceSection();
            }
            loginForm.reset();
        } else {
            authError.textContent = data.message;
            authError.style.display = 'block';
        }
    } catch (error) {
        authError.textContent = 'Error connecting to server';
        authError.style.display = 'block';
    }
});

// Signup handler
document.getElementById('signupForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirmPassword').value;
    const authError = document.getElementById('authError');

    if (password !== confirmPassword) {
        authError.textContent = 'Passwords do not match';
        authError.style.display = 'block';
        return;
    }

    try {
        const endpoint = currentRole === 'admin' ? '/auth/signup/admin' : '/auth/signup/student';
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, confirmPassword })
        });

        const data = await response.json();

        if (data.success) {
            currentUser = data.user;
            authError.style.display = 'none';
            if (currentRole === 'admin') {
                showAdminSection();
            } else {
                showAttendanceSection();
            }
            document.getElementById('signupForm').reset();
        } else {
            authError.textContent = data.message;
            authError.style.display = 'block';
        }
    } catch (error) {
        authError.textContent = 'Error connecting to server';
        authError.style.display = 'block';
    }
});

// Show attendance section
function showAttendanceSection() {
    document.getElementById('authSection').classList.add('hidden');
    document.getElementById('attendanceSection').classList.remove('hidden');
    document.getElementById('userNameDisplay').textContent = currentUser.name;
}

// Show admin section
function showAdminSection() {
    document.getElementById('authSection').classList.add('hidden');
    document.getElementById('adminSection').classList.remove('hidden');
    loadDashboardData();
    populateStudentList();
}

// Logout handler
function logout() {
    currentUser = null;
    currentRole = 'student';
    document.getElementById('authSection').classList.remove('hidden');
    document.getElementById('attendanceSection').classList.add('hidden');
    document.getElementById('adminSection').classList.add('hidden');
    loginForm.classList.remove('hidden');
    document.getElementById('signupForm').classList.add('hidden');
    document.getElementById('authTitle').textContent = 'Attendance Tracker';
    toggleText.textContent = "Don't have an account? ";
    toggleBtn.textContent = 'Sign Up';
    document.getElementById('studentRoleBtn').classList.add('active');
    document.getElementById('adminRoleBtn').classList.remove('active');
    loginForm.reset();
    document.getElementById('authError').style.display = 'none';
}

// Attendance form submission
document.getElementById('attendanceForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const indexNumber = document.getElementById('indexNumber').value;
    const courseOffering = document.getElementById('courseOffering').value;
    const classTime = document.getElementById('classTime').value;
    
    const attendanceChecks = document.querySelectorAll('input[name="attendance"]:checked');
    if (attendanceChecks.length === 0) {
        document.getElementById('attendanceError').textContent = 'Please select an attendance status';
        document.getElementById('attendanceError').style.display = 'block';
        document.getElementById('successMessage').style.display = 'none';
        return;
    }

    const attendanceStatus = attendanceChecks[0].value;

    try {
        const response = await fetch(`${API_URL}/attendance/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                student_id: currentUser.id,
                student_name: currentUser.name,
                email: currentUser.email,
                index_number: indexNumber,
                course_offering: courseOffering,
                attendance_status: attendanceStatus,
                class_time: classTime
            })
        });

        const data = await response.json();

        if (data.success) {
            document.getElementById('successMessage').style.display = 'block';
            document.getElementById('attendanceError').style.display = 'none';

            setTimeout(() => {
                document.getElementById('attendanceForm').reset();
                document.getElementById('successMessage').style.display = 'none';
            }, 2000);
        } else {
            document.getElementById('attendanceError').textContent = data.message;
            document.getElementById('attendanceError').style.display = 'block';
        }
    } catch (error) {
        document.getElementById('attendanceError').textContent = 'Error submitting attendance';
        document.getElementById('attendanceError').style.display = 'block';
    }
});

// Uncheck other attendance options when one is selected
const attendanceCheckboxes = document.querySelectorAll('input[name="attendance"]');
attendanceCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
        if (e.target.checked) {
            attendanceCheckboxes.forEach(cb => {
                if (cb !== e.target) cb.checked = false;
            });
        }
    });
});

// ===== ADMIN FUNCTIONS =====

async function loadDashboardData() {
    try {
        const [statsResponse, recentResponse] = await Promise.all([
            fetch(`${API_URL}/admin/stats`),
            fetch(`${API_URL}/admin/recent`)
        ]);

        const statsData = await statsResponse.json();
        const recentData = await recentResponse.json();

        if (statsData.success) {
            const stats = statsData.stats;
            document.getElementById('totalStudents').textContent = stats.totalStudents;
            document.getElementById('totalRecords').textContent = stats.totalRecords;
            document.getElementById('presentToday').textContent = stats.presentToday;
            document.getElementById('absentToday').textContent = stats.absentToday;
        }

        if (recentData.success) {
            const recentRecordsDiv = document.getElementById('recentRecords');
            if (recentData.records.length === 0) {
                recentRecordsDiv.innerHTML = '<div class="empty-state"><p>No attendance records yet</p></div>';
            } else {
                recentRecordsDiv.innerHTML = generateRecordsTable(recentData.records);
            }
        }
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

function generateRecordsTable(records) {
    if (records.length === 0) {
        return '<div class="empty-state"><p>No records found</p></div>';
    }

    let html = '<table><thead><tr><th>Student Name</th><th>Index #</th><th>Course</th><th>Status</th><th>Class Time</th><th>Date & Time</th></tr></thead><tbody>';
    
    records.forEach(record => {
        const statusClass = `status-${record.attendance_status.toLowerCase().replace(' ', '-')}`;
        html += `<tr>
            <td>${record.student_name}</td>
            <td>${record.index_number}</td>
            <td>${record.course_offering}</td>
            <td><span class="status-badge ${statusClass}">${record.attendance_status}</span></td>
            <td>${record.class_time}</td>
            <td>${new Date(record.submitted_at).toLocaleString()}</td>
        </tr>`;
    });

    html += '</tbody></table>';
    return html;
}

function showAdminTab(tabName) {
    document.querySelectorAll('.admin-tab').forEach(tab => tab.classList.add('hidden'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));

    if (tabName === 'overview') {
        document.getElementById('overviewTab').classList.remove('hidden');
        document.querySelectorAll('.nav-btn')[0].classList.add('active');
        loadDashboardData();
    } else if (tabName === 'records') {
        document.getElementById('recordsTab').classList.remove('hidden');
        document.querySelectorAll('.nav-btn')[1].classList.add('active');
        displayAllRecords();
    } else if (tabName === 'students') {
        document.getElementById('studentsTab').classList.remove('hidden');
        document.querySelectorAll('.nav-btn')[2].classList.add('active');
        populateStudentList();
    } else if (tabName === 'access') {
        document.getElementById('accessTab').classList.remove('hidden');
        document.querySelectorAll('.nav-btn')[3].classList.add('active');
        document.getElementById('accessLinkContainer').innerHTML = '<div class="empty-state"><p>Generate a temporary link for students to access the site.</p></div>';
    }
}

async function displayAllRecords() {
    try {
        const response = await fetch(`${API_URL}/attendance/all`);
        const data = await response.json();

        const allRecordsTable = document.getElementById('allRecordsTable');
        
        if (data.success && data.records.length > 0) {
            allRecordsTable.innerHTML = generateRecordsTable(data.records.reverse());
        } else {
            allRecordsTable.innerHTML = '<div class="empty-state"><p>No attendance records found</p></div>';
        }
    } catch (error) {
        console.error('Error loading records:', error);
    }
}

async function applyFilters() {
    const course = document.getElementById('filterCourse').value;
    const status = document.getElementById('filterStatus').value;
    const studentName = document.getElementById('searchStudent').value;

    try {
        const params = new URLSearchParams();
        if (course) params.append('course', course);
        if (status) params.append('status', status);
        if (studentName) params.append('studentName', studentName);

        const response = await fetch(`${API_URL}/admin/filter?${params}`);
        const data = await response.json();

        const allRecordsTable = document.getElementById('allRecordsTable');
        
        if (data.success && data.records.length > 0) {
            allRecordsTable.innerHTML = generateRecordsTable(data.records.reverse());
        } else {
            allRecordsTable.innerHTML = '<div class="empty-state"><p>No records match your filters</p></div>';
        }
    } catch (error) {
        console.error('Error applying filters:', error);
    }
}

async function generateStudentAccessLink() {
    try {
        const response = await fetch(`${API_URL}/admin/generate-link`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        const data = await response.json();
        const container = document.getElementById('accessLinkContainer');

        if (data.success) {
            let copiedText = '';
            try {
                await navigator.clipboard.writeText(data.accessUrl);
                copiedText = '<p class="success-message">Link copied to clipboard automatically.</p>';
            } catch (clipboardError) {
                copiedText = '<p class="error-message">Unable to copy automatically. Please copy the link manually.</p>';
            }

            container.innerHTML = `
                <div class="link-card">
                    <p><strong>Temporary Access Link (15 minutes):</strong></p>
                    <p><a href="${data.accessUrl}" target="_blank" rel="noopener noreferrer">${data.accessUrl}</a></p>
                    <p>Expires at: ${new Date(data.expiresAt).toLocaleString()}</p>
                    ${copiedText}
                </div>
            `;
        } else {
            container.innerHTML = '<div class="error-message">Unable to generate access link. Try again.</div>';
        }
    } catch (error) {
        console.error('Error generating access link:', error);
        document.getElementById('accessLinkContainer').innerHTML = '<div class="error-message">Error generating access link</div>';
    }
}

function clearFilters() {
    document.getElementById('filterCourse').value = '';
    document.getElementById('filterStatus').value = '';
    document.getElementById('searchStudent').value = '';
    displayAllRecords();
}

async function populateStudentList() {
    try {
        const response = await fetch(`${API_URL}/admin/students`);
        const data = await response.json();

        const select = document.getElementById('selectedStudent');
        const currentValue = select.value;
        
        select.innerHTML = '<option value="">-- Select a Student --</option>';
        
        if (data.success) {
            data.students.forEach(student => {
                const option = document.createElement('option');
                option.value = student.student_name;
                option.textContent = student.student_name;
                select.appendChild(option);
            });
        }

        select.value = currentValue;
    } catch (error) {
        console.error('Error fetching students:', error);
    }
}

async function viewStudentActivity() {
    const selectedStudent = document.getElementById('selectedStudent').value;
    
    if (!selectedStudent) {
        document.getElementById('studentActivityTable').innerHTML = '<div class="empty-state"><p>Please select a student</p></div>';
        return;
    }

    try {
        const response = await fetch(`${API_URL}/admin/student-activity/${encodeURIComponent(selectedStudent)}`);
        const data = await response.json();

        const activityTable = document.getElementById('studentActivityTable');
        if (data.success && data.records.length > 0) {
            activityTable.innerHTML = generateRecordsTable(data.records.reverse());
        } else {
            activityTable.innerHTML = '<div class="empty-state"><p>No activity found for this student</p></div>';
        }
    } catch (error) {
        console.error('Error fetching student activity:', error);
    }
}
