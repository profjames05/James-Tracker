document.addEventListener('DOMContentLoaded', initAttendanceApp);

function initAttendanceApp() {
    populateLocationDropdown();
    
    // Initialize attendance windows with defaults
    window.initializeDefaultAttendanceWindows();

    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const toggleBtn = document.getElementById('toggleBtn');
    const attendanceForm = document.getElementById('attendanceForm');
    const detectLocationButton = document.getElementById('detectLocationButton');
    const locationStatus = document.getElementById('locationStatus');

    toggleBtn.addEventListener('click', toggleAuthForm);
    loginForm.addEventListener('submit', handleLogin);
    signupForm.addEventListener('submit', handleSignup);
    attendanceForm.addEventListener('submit', handleAttendanceSubmit);
    detectLocationButton.addEventListener('click', handleLocationCheck);

    document.querySelectorAll('input[name="attendance"]').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                document.querySelectorAll('input[name="attendance"]').forEach(cb => {
                    if (cb !== e.target) cb.checked = false;
                });
            }
        });
    });

    locationStatus.textContent = 'Select a location, then verify your GPS before submitting.';
}

const getUsers = () => JSON.parse(localStorage.getItem('users')) || {};
const saveUsers = (users) => localStorage.setItem('users', JSON.stringify(users));
const getAdmins = () => JSON.parse(localStorage.getItem('admins')) || initializeAdmins();
const saveAdmins = (admins) => localStorage.setItem('admins', JSON.stringify(admins));

let currentUser = null;
let currentRole = 'student';
let liveClockInterval = null;

function initializeAdmins() {
    const admins = {
        'admin@admin.com': { name: 'Admin User', password: 'admin123' }
    };
    saveAdmins(admins);
    return admins;
}

if (!localStorage.getItem('admins')) {
    initializeAdmins();
}

function selectRole(role) {
    currentRole = role;
    document.getElementById('studentRoleBtn').classList.toggle('active', role === 'student');
    document.getElementById('adminRoleBtn').classList.toggle('active', role === 'admin');

    const toggleText = document.getElementById('toggleText');
    if (role === 'admin') {
        toggleText.textContent = "Don't have an admin account? ";
    } else {
        toggleText.textContent = "Don't have an account? ";
    }

    document.getElementById('authError').style.display = 'none';
    document.getElementById('loginForm').reset();
}

function toggleAuthForm() {
    document.getElementById('loginForm').classList.toggle('hidden');
    document.getElementById('signupForm').classList.toggle('hidden');

    if (document.getElementById('loginForm').classList.contains('hidden')) {
        const roleText = currentRole === 'admin' ? 'Admin Account' : 'Your Account';
        document.getElementById('authTitle').textContent = `Create ${roleText}`;
        document.getElementById('toggleText').textContent = 'Already have an account? ';
        document.getElementById('toggleBtn').textContent = 'Login';
    } else {
        document.getElementById('authTitle').textContent = 'Attendance Tracker';
        const toggleTextContent = currentRole === 'admin' ? "Don't have an admin account? " : "Don't have an account? ";
        document.getElementById('toggleText').textContent = toggleTextContent;
        document.getElementById('toggleBtn').textContent = 'Sign Up';
    }
}

function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const authError = document.getElementById('authError');

    if (currentRole === 'admin') {
        const admins = getAdmins();
        if (admins[email] && admins[email].password === password) {
            currentUser = { email, name: admins[email].name, role: 'admin' };
            authError.style.display = 'none';
            showAdminSection();
            e.target.reset();
        } else {
            authError.textContent = 'Invalid admin credentials';
            authError.style.display = 'block';
        }
    } else {
        const users = getUsers();
        if (users[email] && users[email].password === password) {
            currentUser = { email, name: users[email].name, role: 'student' };
            authError.style.display = 'none';
            showAttendanceSection();
            e.target.reset();
        } else {
            authError.textContent = 'Invalid email or password';
            authError.style.display = 'block';
        }
    }
}

function handleSignup(e) {
    e.preventDefault();
    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirmPassword').value;
    const authError = document.getElementById('authError');

    if (password !== confirmPassword) {
        authError.textContent = 'Passwords do not match';
        authError.style.display = 'block';
        return;
    }

    if (currentRole === 'admin') {
        const admins = getAdmins();
        if (admins[email]) {
            authError.textContent = 'Email already registered as admin';
            authError.style.display = 'block';
            return;
        }
        admins[email] = { name, password };
        saveAdmins(admins);
        authError.style.display = 'none';
        currentUser = { email, name, role: 'admin' };
        showAdminSection();
        e.target.reset();
    } else {
        const users = getUsers();
        if (users[email]) {
            authError.textContent = 'Email already registered as student';
            authError.style.display = 'block';
            return;
        }
        users[email] = { name, password };
        saveUsers(users);
        authError.style.display = 'none';
        currentUser = { email, name, role: 'student' };
        showAttendanceSection();
        e.target.reset();
    }
}

function showAttendanceSection() {
    document.getElementById('authSection').classList.add('hidden');
    document.getElementById('attendanceSection').classList.remove('hidden');
    document.getElementById('userNameDisplay').textContent = currentUser.name;
    
    // Start live clock
    startLiveClock();
    
    // Update time window status
    updateTimeWindowStatus();
}

function showAdminSection() {
    document.getElementById('authSection').classList.add('hidden');
    document.getElementById('adminSection').classList.remove('hidden');
    loadDashboardData();
    populateStudentList();
}

/**
 * Start the live clock update
 */
function startLiveClock() {
    // Clear any existing interval
    if (liveClockInterval) {
        clearInterval(liveClockInterval);
    }
    
    // Update immediately
    updateLiveClock();
    
    // Update every 1000ms (1 second)
    liveClockInterval = setInterval(updateLiveClock, 1000);
}

/**
 * Update the live clock display
 */
function updateLiveClock() {
    const timeInfo = window.getCurrentTimeInfo();
    const clockDisplay = document.getElementById('liveClockDisplay');
    const dateDisplay = document.getElementById('liveDateDisplay');
    const timezoneDisplay = document.getElementById('liveTimezoneDisplay');
    
    if (clockDisplay && dateDisplay && timezoneDisplay) {
        clockDisplay.textContent = timeInfo.time;
        dateDisplay.textContent = `Date: ${timeInfo.date}`;
        timezoneDisplay.textContent = `Timezone: ${timeInfo.timeZone} (${timeInfo.utcOffset})`;
    }
    
    // Also update time window status
    updateTimeWindowStatus();
}

/**
 * Update time window status display
 */
function updateTimeWindowStatus() {
    const courseOffering = document.getElementById('courseOffering');
    const timeWindowStatus = document.getElementById('timeWindowStatus');
    
    if (!courseOffering || !timeWindowStatus) return;
    
    const courseId = courseOffering.value;
    if (!courseId) {
        timeWindowStatus.textContent = 'Select a course to see attendance window information.';
        return;
    }
    
    const window = window.getAttendanceWindow(courseId);
    if (!window) {
        timeWindowStatus.textContent = 'No attendance window configured for this course.';
        return;
    }
    
    const timeStatus = window.isTimeInAttendanceWindow(window.startTime, window.endTime);
    const statusMessage = window.getTimeStatusMessage(timeStatus.status, timeStatus.minutesRemaining);
    
    timeWindowStatus.innerHTML = `
        <strong>${statusMessage}</strong><br>
        Window: ${window.startTime} - ${window.endTime} | Late cutoff: ${window.lateTime}
    `;
    
    // Update styling based on status
    if (timeStatus.status === 'OPEN') {
        timeWindowStatus.style.backgroundColor = '#d4edda';
        timeWindowStatus.style.color = '#155724';
        timeWindowStatus.style.borderColor = '#c3e6cb';
    } else if (timeStatus.status === 'NOT_STARTED') {
        timeWindowStatus.style.backgroundColor = '#e2e3e5';
        timeWindowStatus.style.color = '#383d41';
        timeWindowStatus.style.borderColor = '#d6d8db';
    } else {
        timeWindowStatus.style.backgroundColor = '#f8d7da';
        timeWindowStatus.style.color = '#721c24';
        timeWindowStatus.style.borderColor = '#f5c6cb';
    }
}

function logout() {
    currentUser = null;
    currentRole = 'student';
    document.getElementById('authSection').classList.remove('hidden');
    document.getElementById('attendanceSection').classList.add('hidden');
    document.getElementById('adminSection').classList.add('hidden');
    document.getElementById('loginForm').classList.remove('hidden');
    document.getElementById('signupForm').classList.add('hidden');
    document.getElementById('authTitle').textContent = 'Attendance Tracker';
    document.getElementById('toggleText').textContent = "Don't have an account? ";
    document.getElementById('toggleBtn').textContent = 'Sign Up';
    document.getElementById('studentRoleBtn').classList.add('active');
    document.getElementById('adminRoleBtn').classList.remove('active');
    document.getElementById('loginForm').reset();
    document.getElementById('authError').style.display = 'none';
}

async function handleLocationCheck() {
    const locationStatus = document.getElementById('locationStatus');
    const selectedLocationId = document.getElementById('attendanceLocation').value;

    if (!selectedLocationId) {
        locationStatus.textContent = 'Please select a location first.';
        return;
    }

    try {
        const result = await verifySelectedLocation();
        if (result.isValid) {
            locationStatus.textContent = `✓ Verified at ${result.locationName}. Distance: ${window.formatDistanceMessage(result.distanceMeters)}. GPS accuracy: ${result.accuracy.toFixed(0)}m.`;
        } else {
            locationStatus.textContent = `✗ Location mismatch. You are ${window.formatDistanceMessage(result.distanceMeters)} away from ${result.locationName}.`;
        }
    } catch (error) {
        locationStatus.textContent = error.message;
    }
}

async function handleAttendanceSubmit(e) {
    e.preventDefault();

    const indexNumber = document.getElementById('indexNumber').value.trim();
    const courseOffering = document.getElementById('courseOffering').value;
    const selectedLocationId = document.getElementById('attendanceLocation').value;
    const attendanceChecks = document.querySelectorAll('input[name="attendance"]:checked');
    const attendanceError = document.getElementById('attendanceError');
    const successMessage = document.getElementById('successMessage');

    attendanceError.style.display = 'none';
    successMessage.style.display = 'none';

    // Validate location selection
    if (!selectedLocationId) {
        attendanceError.textContent = 'Please select a location from the official UENR locations list.';
        attendanceError.style.display = 'block';
        return;
    }

    // Validate course selection
    if (!courseOffering) {
        attendanceError.textContent = 'Please select a course offering.';
        attendanceError.style.display = 'block';
        return;
    }

    // Validate attendance status
    if (attendanceChecks.length === 0) {
        attendanceError.textContent = 'Please select an attendance status.';
        attendanceError.style.display = 'block';
        return;
    }

    try {
        // Check for time tampering
        const tamperingCheck = window.checkForTimeTampering();
        if (tamperingCheck.isSuspicious) {
            attendanceError.textContent = `⚠️ Suspicious activity detected: ${tamperingCheck.details}`;
            attendanceError.style.display = 'block';
            return;
        }

        // Verify GPS location before submission
        const verification = await verifySelectedLocation();
        
        // Check GPS accuracy
        if (verification.accuracyIssue) {
            attendanceError.textContent = `GPS accuracy too weak (${verification.accuracy.toFixed(0)}m). Please wait for better GPS signal or move to an open area.`;
            attendanceError.style.display = 'block';
            return;
        }
        
        // Check if within location radius
        if (!verification.isValid) {
            attendanceError.textContent = `You are ${window.formatDistanceMessage(verification.distanceMeters)} away from ${verification.locationName}. Maximum allowed distance is ${window.getLocationById(selectedLocationId).allowedRadius}m.`;
            attendanceError.style.display = 'block';
            return;
        }

        // Validate time window
        const attendanceWindow = window.getAttendanceWindow(courseOffering);
        if (!attendanceWindow) {
            attendanceError.textContent = 'No attendance window configured for this course. Please contact your instructor.';
            attendanceError.style.display = 'block';
            return;
        }

        const timeStatus = window.isTimeInAttendanceWindow(attendanceWindow.startTime, attendanceWindow.endTime);
        if (!timeStatus.isValid) {
            attendanceError.textContent = 'Attendance period has closed. You cannot submit attendance outside the designated time window.';
            attendanceError.style.display = 'block';
            return;
        }

        // Get current time info for record
        const timeInfo = window.getCurrentTimeInfo();
        
        // Determine attendance status based on time
        const attendanceStatusByTime = window.getAttendanceStatusByTime(
            attendanceWindow.startTime,
            attendanceWindow.lateTime,
            attendanceWindow.endTime
        );

        // All validations passed - create and save attendance record
        const newRecord = {
            // Student information
            studentName: currentUser.name,
            email: currentUser.email,
            indexNumber,
            
            // Attendance details
            courseOffering,
            attendance: attendanceChecks[0].value,
            attendanceStatusByTime,
            
            // Time information (automatic)
            date: timeInfo.date,
            time: timeInfo.time,
            timeZone: timeInfo.timeZone,
            utcOffset: timeInfo.utcOffset,
            timestamp: timeInfo.timestamp,
            isoTimestamp: timeInfo.isoString,
            
            // Attendance window info
            windowStartTime: attendanceWindow.startTime,
            windowLateTime: attendanceWindow.lateTime,
            windowEndTime: attendanceWindow.endTime,
            
            // Location information
            locationId: verification.locationId,
            locationName: verification.locationName,
            
            // GPS coordinates
            studentLat: verification.latitude,
            studentLon: verification.longitude,
            targetLat: verification.targetLat,
            targetLng: verification.targetLng,
            
            // Distance and accuracy
            distanceMeters: verification.distanceMeters,
            gpsAccuracyMeters: verification.accuracy,
            allowedRadiusMeters: window.getLocationById(selectedLocationId).allowedRadius,
            
            // Time tampering check
            tamperingFlagged: false
        };

        // Save to localStorage
        const records = JSON.parse(localStorage.getItem('attendanceRecords')) || [];
        records.push(newRecord);
        localStorage.setItem('attendanceRecords', JSON.stringify(records));
        
        // Record submission time for tampering detection
        window.recordSubmissionTime(timeInfo.isoString);

        // Show success message
        successMessage.textContent = `Attendance submitted successfully! Status: ${attendanceStatusByTime} at ${timeInfo.time}`;
        successMessage.style.display = 'block';
        attendanceError.style.display = 'none';
        document.getElementById('attendanceForm').reset();
        document.getElementById('locationStatus').textContent = 'Select a location, then verify your GPS before submitting.';

        setTimeout(() => {
            successMessage.style.display = 'none';
        }, 2500);
    } catch (error) {
        attendanceError.textContent = error.message;
        attendanceError.style.display = 'block';
    }
}

async function verifySelectedLocation() {
    const locationStatus = document.getElementById('locationStatus');
    const selectedLocationId = document.getElementById('attendanceLocation').value;
    const location = window.getLocationById(selectedLocationId);

    if (!selectedLocationId || !location) {
        throw new Error('Please select a valid location from the list.');
    }

    if (!window.isGeolocationSupported()) {
        throw new Error('Your browser does not support GPS location detection.');
    }

    const detectButton = document.getElementById('detectLocationButton');
    detectButton.disabled = true;
    locationStatus.textContent = 'Requesting GPS coordinates...';

    try {
        const position = await window.getCurrentPositionPromise({ 
            enableHighAccuracy: true, 
            timeout: 15000, 
            maximumAge: 0
        });
        
        const { latitude, longitude, accuracy } = position.coords;
        
        // Check if GPS accuracy is acceptable
        if (!window.isGPSAccuracyAcceptable(accuracy)) {
            locationStatus.textContent = `${window.getGPSAccuracyMessage(accuracy)} Please wait or move to an open area.`;
            return {
                locationId: selectedLocationId,
                locationName: location.name,
                latitude,
                longitude,
                targetLat: location.latitude,
                targetLng: location.longitude,
                distanceMeters: 0,
                accuracy,
                isValid: false,
                accuracyIssue: true
            };
        }
        
        // Calculate distance using Haversine formula
        const distanceMeters = window.getDistanceFromLatLonInMeters(
            latitude, 
            longitude, 
            location.latitude, 
            location.longitude
        );
        
        // Check if within allowed radius
        const isValid = distanceMeters <= location.allowedRadius;
        
        // Update status display
        const accuracyStatus = window.getGPSAccuracyMessage(accuracy);
        if (isValid) {
            locationStatus.textContent = `✓ GPS verified at ${latitude.toFixed(6)}, ${longitude.toFixed(6)}. ${accuracyStatus}. Distance: ${window.formatDistanceMessage(distanceMeters)}.`;
        } else {
            locationStatus.textContent = `✗ You are ${window.formatDistanceMessage(distanceMeters)} away from ${location.name} (max: ${location.allowedRadius}m). ${accuracyStatus}.`;
        }

        return {
            locationId: selectedLocationId,
            locationName: location.name,
            latitude,
            longitude,
            targetLat: location.latitude,
            targetLng: location.longitude,
            distanceMeters,
            accuracy,
            isValid,
            accuracyIssue: false
        };
    } catch (error) {
        if (error.code === 1) {
            throw new Error('Location permission denied. Please allow GPS access to submit attendance.');
        }
        if (error.code === 2) {
            throw new Error('Unable to determine your location. Please try again in an open area.');
        }
        if (error.code === 3) {
            throw new Error('GPS request timed out. Please try again.');
        }
        throw new Error(error.message || 'Failed to verify location.');
    } finally {
        detectButton.disabled = false;
    }
}

function loadDashboardData() {
    const records = JSON.parse(localStorage.getItem('attendanceRecords')) || [];
    const today = new Date().toISOString().split('T')[0];
    const uniqueStudents = new Set(records.map(r => r.email)).size;
    const todaysRecords = records.filter(r => r.date === today);
    const presentToday = todaysRecords.filter(r => r.attendance === 'Present').length;
    const absentToday = todaysRecords.filter(r => r.attendance === 'Absent').length;

    document.getElementById('totalStudents').textContent = uniqueStudents;
    document.getElementById('totalRecords').textContent = records.length;
    document.getElementById('presentToday').textContent = presentToday;
    document.getElementById('absentToday').textContent = absentToday;

    const recentRecordsDiv = document.getElementById('recentRecords');
    const recentRecs = records.slice(-10).reverse();
    recentRecordsDiv.innerHTML = recentRecs.length === 0 ? '<div class="empty-state"><p>No attendance records yet</p></div>' : generateRecordsTable(recentRecs);
}

function generateRecordsTable(records) {
    if (!records.length) {
        return '<div class="empty-state"><p>No records found</p></div>';
    }

    let html = '<table><thead><tr><th>Student Name</th><th>Index #</th><th>Course</th><th>Location</th><th>GPS</th><th>Distance</th><th>Status</th><th>Class Time</th><th>Date & Time</th></tr></thead><tbody>';
    records.forEach(record => {
        const statusClass = `status-${record.attendance.toLowerCase().replace(/ /g, '-')}`;
        const gpsText = record.locationLat != null && record.locationLng != null ? `${record.locationLat.toFixed(6)}, ${record.locationLng.toFixed(6)}` : '-';
        const distanceText = record.distanceMeters != null ? `${record.distanceMeters.toFixed(1)} m` : '-';
        html += `<tr>
                <td>${record.studentName || '-'}</td>
                <td>${record.indexNumber || '-'}</td>
                <td>${record.courseOffering || '-'}</td>
                <td>${record.locationName || '-'}</td>
                <td>${gpsText}</td>
                <td>${distanceText}</td>
                <td><span class="status-badge ${statusClass}">${record.attendance || '-'}</span></td>
                <td>${record.classTime || '-'}</td>
                <td>${record.timestamp || '-'}</td>
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
    } else if (tabName === 'calibration') {
        document.getElementById('calibrationTab').classList.remove('hidden');
        document.querySelectorAll('.nav-btn')[3].classList.add('active');
        populateCalibrationLocationDropdown();
        displayCalibrationHistory();
    } else if (tabName === 'attendance-windows') {
        document.getElementById('attendanceWindowsTab').classList.remove('hidden');
        document.querySelectorAll('.nav-btn')[4].classList.add('active');
        displayAttendanceWindowsConfig();
    }
}

function displayAllRecords() {
    const records = JSON.parse(localStorage.getItem('attendanceRecords')) || [];
    document.getElementById('allRecordsTable').innerHTML = records.length === 0 ? '<div class="empty-state"><p>No attendance records found</p></div>' : generateRecordsTable(records.reverse());
}

function applyFilters() {
    const records = JSON.parse(localStorage.getItem('attendanceRecords')) || [];
    const course = document.getElementById('filterCourse').value;
    const status = document.getElementById('filterStatus').value;
    const studentName = document.getElementById('searchStudent').value.toLowerCase();

    const filtered = records.filter(r => {
        const matchCourse = !course || r.courseOffering === course;
        const matchStatus = !status || r.attendance === status;
        const matchStudent = !studentName || (r.studentName || '').toLowerCase().includes(studentName);
        return matchCourse && matchStatus && matchStudent;
    });

    document.getElementById('allRecordsTable').innerHTML = filtered.length === 0 ? '<div class="empty-state"><p>No records match your filters</p></div>' : generateRecordsTable(filtered.reverse());
}

function clearFilters() {
    document.getElementById('filterCourse').value = '';
    document.getElementById('filterStatus').value = '';
    document.getElementById('searchStudent').value = '';
    displayAllRecords();
}

function populateStudentList() {
    const records = JSON.parse(localStorage.getItem('attendanceRecords')) || [];
    const students = [...new Set(records.map(r => r.studentName || ''))].filter(Boolean);
    const select = document.getElementById('selectedStudent');
    const currentValue = select.value;

    select.innerHTML = '<option value="">-- Select a Student --</option>';
    students.forEach(student => {
        const option = document.createElement('option');
        option.value = student;
        option.textContent = student;
        select.appendChild(option);
    });
    select.value = currentValue;
}

function viewStudentActivity() {
    const selectedStudent = document.getElementById('selectedStudent').value;
    const records = JSON.parse(localStorage.getItem('attendanceRecords')) || [];
    const studentActivity = records.filter(r => r.studentName === selectedStudent);
    document.getElementById('studentActivityTable').innerHTML = studentActivity.length === 0 ? '<div class="empty-state"><p>No activity found for this student</p></div>' : generateRecordsTable(studentActivity.reverse());
}

/**
 * ADMIN CALIBRATION FEATURE
 * Allows admins to capture and update location coordinates
 */

function populateCalibrationLocationDropdown() {
    const select = document.getElementById('calibrationLocation');
    select.innerHTML = '<option value="">-- Select Location --</option>';
    
    const groupedLocations = window.getLocationsByCategory();
    Object.keys(groupedLocations)
        .sort()
        .forEach((category) => {
            const optGroup = document.createElement('optgroup');
            optGroup.label = category;
            
            groupedLocations[category]
                .sort((a, b) => a.name.localeCompare(b.name))
                .forEach((location) => {
                    const option = document.createElement('option');
                    option.value = location.id;
                    option.textContent = location.name;
                    optGroup.appendChild(option);
                });
            
            select.appendChild(optGroup);
        });
}

async function captureLocationGPS() {
    const selectedLocationId = document.getElementById('calibrationLocation').value;
    const calibrationStatus = document.getElementById('calibrationStatus');
    const calibrationStatusText = document.getElementById('calibrationStatusText');
    
    if (!selectedLocationId) {
        calibrationStatusText.textContent = 'Please select a location first.';
        calibrationStatus.style.display = 'block';
        return;
    }
    
    const location = window.getLocationById(selectedLocationId);
    if (!location) {
        calibrationStatusText.textContent = 'Invalid location selected.';
        calibrationStatus.style.display = 'block';
        return;
    }
    
    try {
        if (!window.isGeolocationSupported()) {
            throw new Error('Your browser does not support GPS location detection.');
        }
        
        calibrationStatusText.textContent = 'Capturing GPS coordinates...';
        calibrationStatus.style.display = 'block';
        
        const position = await window.getCurrentPositionPromise({
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0
        });
        
        const { latitude, longitude, accuracy } = position.coords;
        
        // Update the location master with new coordinates
        window.UENR_LOCATIONS_MASTER[selectedLocationId].latitude = latitude;
        window.UENR_LOCATIONS_MASTER[selectedLocationId].longitude = longitude;
        
        // Save calibration record
        const calibrationData = JSON.parse(localStorage.getItem('locationCalibrations')) || [];
        const calibrationRecord = {
            locationId: selectedLocationId,
            locationName: location.name,
            latitude,
            longitude,
            accuracy,
            timestamp: new Date().toLocaleString(),
            date: new Date().toISOString().split('T')[0],
            adminEmail: currentUser.email
        };
        
        calibrationData.push(calibrationRecord);
        localStorage.setItem('locationCalibrations', JSON.stringify(calibrationData));
        
        calibrationStatusText.innerHTML = `<strong>✓ Calibration Successful</strong><br>
            Location: ${location.name}<br>
            Latitude: ${latitude.toFixed(6)}<br>
            Longitude: ${longitude.toFixed(6)}<br>
            GPS Accuracy: ${accuracy.toFixed(0)}m<br>
            Time: ${calibrationRecord.timestamp}`;
        calibrationStatus.style.backgroundColor = '#d4edda';
        calibrationStatus.style.color = '#155724';
        calibrationStatus.style.borderColor = '#c3e6cb';
        
        displayCalibrationHistory();
        
        setTimeout(() => {
            document.getElementById('calibrationLocation').value = '';
            calibrationStatus.style.display = 'none';
        }, 3000);
    } catch (error) {
        let errorMessage = error.message;
        
        if (error.code === 1) {
            errorMessage = 'Location permission denied. Please allow GPS access.';
        } else if (error.code === 2) {
            errorMessage = 'Unable to determine your location. Please try again in an open area.';
        } else if (error.code === 3) {
            errorMessage = 'GPS request timed out. Please try again.';
        }
        
        calibrationStatusText.textContent = '✗ Calibration Failed: ' + errorMessage;
        calibrationStatus.style.backgroundColor = '#f8d7da';
        calibrationStatus.style.color = '#721c24';
        calibrationStatus.style.borderColor = '#f5c6cb';
        calibrationStatus.style.display = 'block';
    }
}

function displayCalibrationHistory() {
    const calibrationData = JSON.parse(localStorage.getItem('locationCalibrations')) || [];
    
    if (calibrationData.length === 0) {
        document.getElementById('calibrationTable').innerHTML = '<div class="empty-state"><p>No calibration history yet</p></div>';
        return;
    }
    
    let html = '<table><thead><tr><th>Location</th><th>Latitude</th><th>Longitude</th><th>GPS Accuracy</th><th>Admin</th><th>Date & Time</th></tr></thead><tbody>';
    
    calibrationData.reverse().forEach(record => {
        html += `<tr>
            <td>${record.locationName || '-'}</td>
            <td>${record.latitude.toFixed(6)}</td>
            <td>${record.longitude.toFixed(6)}</td>
            <td>${record.accuracy.toFixed(0)}m</td>
            <td>${record.adminEmail || '-'}</td>
            <td>${record.timestamp || '-'}</td>
        </tr>`;
    });
    
    html += '</tbody></table>';
    document.getElementById('calibrationTable').innerHTML = html;
}

function clearCalibrationData() {
    if (confirm('Are you sure you want to clear all calibration data? This action cannot be undone.')) {
        localStorage.removeItem('locationCalibrations');
        document.getElementById('calibrationLocation').value = '';
        document.getElementById('calibrationStatus').style.display = 'none';
        displayCalibrationHistory();
    }
}
