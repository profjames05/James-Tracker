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

    // Refresh time window status whenever course changes
    const courseOfferingEl = document.getElementById('courseOffering');
    if (courseOfferingEl) {
        courseOfferingEl.addEventListener('change', updateTimeWindowStatus);
    }

    // When location selection changes, re-evaluate GPS distance immediately
    const locationSelectEl = document.getElementById('attendanceLocation');
    if (locationSelectEl) {
        locationSelectEl.addEventListener('change', () => {
            const fix = window.getLatestGPSFix();
            if (fix) _onGPSUpdate(fix);
        });
    }
}

const getUsers = () => JSON.parse(localStorage.getItem('users')) || {};
const saveUsers = (users) => localStorage.setItem('users', JSON.stringify(users));
const getAdmins = () => JSON.parse(localStorage.getItem('lecturers')) || initializeAdmins();
const saveAdmins = (admins) => localStorage.setItem('lecturers', JSON.stringify(admins));

let currentUser = null;
let currentRole = 'student';
let liveClockInterval = null;

function initializeAdmins() {
    const admins = {
        'lecturer@uenr.edu.gh': { name: 'Dr. Lecturer', password: 'lecturer123', staffId: 'UENR-LEC-0001', department: 'Computer Science' }
    };
    saveAdmins(admins);
    return admins;
}

if (!localStorage.getItem('lecturers')) {
    initializeAdmins();
}

function selectRole(role) {
    currentRole = role;
    document.getElementById('studentRoleBtn').classList.toggle('active', role === 'student');
    document.getElementById('lecturerRoleBtn').classList.toggle('active', role === "lecturer");

    const toggleText = document.getElementById('toggleText');
    if (role === "lecturer") {
        toggleText.textContent = "Don't have an lecturer account? ";
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
        const roleText = currentRole === "lecturer" ? 'Lecturer Account' : 'Your Account';
        document.getElementById('authTitle').textContent = `Create ${roleText}`;
        document.getElementById('toggleText').textContent = 'Already have an account? ';
        document.getElementById('toggleBtn').textContent = 'Login';
    } else {
        document.getElementById('authTitle').textContent = 'Attendance Tracker';
        const toggleTextContent = currentRole === "lecturer" ? "Don't have an lecturer account? " : "Don't have an account? ";
        document.getElementById('toggleText').textContent = toggleTextContent;
        document.getElementById('toggleBtn').textContent = 'Sign Up';
    }
}

function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const authError = document.getElementById('authError');

    if (currentRole === "lecturer") {
        const admins = getAdmins();
        if (admins[email] && admins[email].password === password) {
            currentUser = { email, name: admins[email].name, role: "lecturer" };
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

    if (currentRole === "lecturer") {
        const admins = getAdmins();
        if (admins[email]) {
            authError.textContent = 'Email already registered as admin';
            authError.style.display = 'block';
            return;
        }
        admins[email] = { name, password };
        saveAdmins(admins);
        authError.style.display = 'none';
        currentUser = { email, name, role: "lecturer" };
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

    // Start continuous GPS watch — never use cached position
    window.startGPSWatch(
        (fix) => _onGPSUpdate(fix),
        (errMsg) => _onGPSError(errMsg)
    );
}

function showAdminSection() {
    document.getElementById('authSection').classList.add('hidden');
    document.getElementById('adminSection').classList.remove('hidden');

    // Populate header subtitle with lecturer name
    const subEl = document.getElementById('lectHeaderSub');
    if (subEl) subEl.textContent = `Welcome, ${currentUser.name} — UENR Attendance System`;

    loadDashboardData();
    populateStudentList();
    _populateProfileTab();
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
    const courseOfferingEl = document.getElementById('courseOffering');
    const timeWindowStatus = document.getElementById('timeWindowStatus');
    
    if (!courseOfferingEl || !timeWindowStatus) return;
    
    const courseId = courseOfferingEl.value;
    if (!courseId) {
        timeWindowStatus.textContent = 'Select a course to see attendance window information.';
        timeWindowStatus.style.backgroundColor = '#eef2ff';
        timeWindowStatus.style.color = '#1e3a8a';
        timeWindowStatus.style.borderColor = '#c7d2fe';
        return;
    }
    
    const attendanceWin = window.getAttendanceWindow(courseId);
    if (!attendanceWin) {
        timeWindowStatus.textContent = 'No attendance window configured for this course.';
        timeWindowStatus.style.backgroundColor = '#eef2ff';
        timeWindowStatus.style.color = '#1e3a8a';
        timeWindowStatus.style.borderColor = '#c7d2fe';
        return;
    }
    
    const timeStatus = window.isTimeInAttendanceWindow(attendanceWin.startTime, attendanceWin.endTime);
    const statusMessage = window.getTimeStatusMessage(timeStatus.status, timeStatus.minutesRemaining);

    // Determine if currently in the late zone
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const lateMinutes = window.parseTimeToMinutes(attendanceWin.lateTime);
    const startMinutes = window.parseTimeToMinutes(attendanceWin.startTime);
    const isLate = timeStatus.status === 'OPEN' && currentMinutes > lateMinutes;

    // Auto-status label shown to student
    const autoStatus = window.getAttendanceStatusByTime(attendanceWin.startTime, attendanceWin.lateTime, attendanceWin.endTime);
    const autoLabel = (autoStatus === 'Present' || autoStatus === 'Late')
        ? ` — your status will be recorded as <strong>${autoStatus}</strong>`
        : '';

    timeWindowStatus.innerHTML = `
        <strong>${isLate ? '⚠️ Late — ' : ''}${statusMessage}</strong>${autoLabel}<br>
        Window: ${attendanceWin.startTime}–${attendanceWin.endTime} | On-time before: ${attendanceWin.lateTime}
    `;
    
    // Colour coding: green = open on-time, amber = late, grey = not started, red = closed
    if (isLate) {
        timeWindowStatus.style.backgroundColor = '#fff3cd';
        timeWindowStatus.style.color = '#856404';
        timeWindowStatus.style.borderColor = '#ffc107';
    } else if (timeStatus.status === 'OPEN') {
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

    // Stop continuous GPS watch
    window.stopGPSWatch();

    document.getElementById('authSection').classList.remove('hidden');
    document.getElementById('attendanceSection').classList.add('hidden');
    document.getElementById('adminSection').classList.add('hidden');
    document.getElementById('loginForm').classList.remove('hidden');
    document.getElementById('signupForm').classList.add('hidden');
    document.getElementById('authTitle').textContent = 'Attendance Tracker';
    document.getElementById('toggleText').textContent = "Don't have an account? ";
    document.getElementById('toggleBtn').textContent = 'Sign Up';
    document.getElementById('studentRoleBtn').classList.add('active');
    document.getElementById('lecturerRoleBtn').classList.remove('active');
    document.getElementById('loginForm').reset();
    document.getElementById('authError').style.display = 'none';
}

/* ─── GPS update callbacks (called by watchPosition) ─── */

function _onGPSUpdate(fix) {
    const locationStatus = document.getElementById('locationStatus');
    const signalBar      = document.getElementById('gpsSignalText');
    if (!locationStatus) return;

    // ── Signal bar ──
    if (signalBar) {
        const accMsg    = window.getGPSAccuracyMessage(fix.accuracy);
        const sampleMsg = fix.readyForValidation
            ? `${fix.sampleCount} samples averaged`
            : `collecting ${fix.sampleCount||0}/${window.GPS_SAMPLES_REQUIRED}…`;
        signalBar.textContent = `${accMsg} | ${sampleMsg} | ${fix.lat.toFixed(5)}, ${fix.lng.toFixed(5)}`;
        const barEl = document.getElementById('gpsSignalBar');
        if (barEl) {
            if (!fix.readyForValidation) {
                barEl.style.cssText += ';background:#eef2ff;color:#1e3a8a;border-color:#c7d2fe';
            } else if (window.isGPSAccuracyAcceptable(fix.accuracy)) {
                barEl.style.cssText += ';background:#d4edda;color:#155724;border-color:#c3e6cb';
            } else {
                barEl.style.cssText += ';background:#fff3cd;color:#856404;border-color:#ffc107';
            }
        }
    }

    const selectedLocationId = document.getElementById('attendanceLocation').value;
    const sampleBar = `(${fix.sampleCount||0}/${window.GPS_SAMPLES_REQUIRED} samples)`;

    if (!fix.readyForValidation) {
        locationStatus.textContent = `📡 Acquiring GPS… ${sampleBar}`;
        _setLocationStatusStyle(locationStatus, 'pending');
        return;
    }

    const accMsg = window.getGPSAccuracyMessage(fix.accuracy);

    if (!selectedLocationId) {
        locationStatus.textContent = `${accMsg} — Select a location to verify distance.`;
        _setLocationStatusStyle(locationStatus, window.isGPSAccuracyAcceptable(fix.accuracy) ? 'ok' : 'warn');
        return;
    }

    const validation = window.validateGPSForAttendance(selectedLocationId);
    locationStatus.textContent = `${validation.reason} | ${accMsg}`;
    _setLocationStatusStyle(locationStatus, validation.valid ? 'ok' : 'fail');

    // Debug panel — only re-render when <details> is open (avoids wasted DOM work)
    const debugDetails = document.querySelector('details');
    if (debugDetails && debugDetails.open) {
        window.renderGPSDebugPanel('gpsDebugPanel', selectedLocationId);
    }

    // Nearest building
    const nearestEl = document.getElementById('nearestBuilding');
    if (nearestEl) {
        const nearest = window.findNearestBuilding(fix.lat, fix.lng);
        nearestEl.textContent = nearest
            ? `📍 Nearest: ${nearest.location.name} (${nearest.distance.toFixed(0)}m)`
            : '';
    }
}

function _onGPSError(errMsg) {
    const locationStatus = document.getElementById('locationStatus');
    if (locationStatus) {
        locationStatus.textContent = `⚠️ ${errMsg}`;
        _setLocationStatusStyle(locationStatus, 'fail');
    }
}

function _samplesCount() {
    const fix = window.getLatestGPSFix();
    return fix ? (fix.sampleCount || 0) : 0;
}

function _setLocationStatusStyle(el, state) {
    const styles = {
        ok      : { bg: '#d4edda', color: '#155724', border: '#c3e6cb' },
        fail    : { bg: '#f8d7da', color: '#721c24', border: '#f5c6cb' },
        warn    : { bg: '#fff3cd', color: '#856404', border: '#ffc107' },
        pending : { bg: '#eef2ff', color: '#1e3a8a', border: '#c7d2fe' }
    };
    const s = styles[state] || styles.pending;
    el.style.background   = s.bg;
    el.style.color        = s.color;
    el.style.borderColor  = s.border;
    el.style.border       = `1px solid ${s.border}`;
    el.style.borderRadius = '8px';
    el.style.padding      = '10px 12px';
}

async function handleLocationCheck() {
    const locationStatus     = document.getElementById('locationStatus');
    const selectedLocationId = document.getElementById('attendanceLocation').value;

    if (!selectedLocationId) {
        locationStatus.textContent = 'Please select a location first.';
        _setLocationStatusStyle(locationStatus, 'warn');
        return;
    }

    const fix = window.getLatestGPSFix();
    const err = window.getGPSWatchError();

    if (err && !fix) {
        locationStatus.textContent = `⚠️ ${err}`;
        _setLocationStatusStyle(locationStatus, 'fail');
        return;
    }

    if (!fix) {
        locationStatus.textContent = '📡 GPS is still acquiring signal. Please wait…';
        _setLocationStatusStyle(locationStatus, 'pending');
        return;
    }

    // Trigger an immediate UI refresh using the latest fix
    _onGPSUpdate(fix);
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
        // Check for time tampering — flag the record but don't block submission
        const tamperingCheck = window.checkForTimeTampering();

        // ── GPS VALIDATION (averaged live fix, ≤20m accuracy required) ──
        const gpsResult = window.validateGPSForAttendance(selectedLocationId);
        if (!gpsResult.valid) {
            attendanceError.textContent = gpsResult.reason;
            attendanceError.style.display = 'block';
            return;
        }
        const verification = await verifySelectedLocation();
        if (verification.accuracyIssue) {
            attendanceError.textContent = `GPS accuracy too weak (±${verification.accuracy.toFixed(0)}m). Please move outdoors and wait for a stronger signal.`;
            attendanceError.style.display = 'block';
            return;
        }
        if (!verification.isValid) {
            attendanceError.textContent = `You are ${window.formatDistanceMessage(verification.distanceMeters)} away from ${verification.locationName}. Maximum allowed: ${window.getLocationById(selectedLocationId).allowedRadius}m.`;
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
            const isEarly = timeStatus.status === 'NOT_STARTED';
            attendanceError.textContent = isEarly
                ? `Attendance window has not opened yet. It opens at ${attendanceWindow.startTime}.`
                : 'Attendance period has closed. You cannot submit attendance outside the designated time window.';
            attendanceError.style.display = 'block';
            return;
        }

        // Get current time info — captured at this exact moment (no manual entry)
        const timeInfo = window.getCurrentTimeInfo();

        // Determine final attendance status automatically from time window
        const attendanceStatusByTime = window.getAttendanceStatusByTime(
            attendanceWindow.startTime,
            attendanceWindow.lateTime,
            attendanceWindow.endTime
        );

        // Use auto-determined status; fall back to checked checkbox only if no window logic applies
        const finalStatus = (attendanceStatusByTime === 'Present' || attendanceStatusByTime === 'Late')
            ? attendanceStatusByTime
            : attendanceChecks[0].value;

        // All validations passed - create and save attendance record
        const newRecord = {
            // Student information
            studentName: currentUser.name,
            email: currentUser.email,
            indexNumber,
            
            // Attendance details
            courseOffering,
            attendance: finalStatus,
            attendanceStatusByTime,
            
            // Time information (automatic — captured by device clock at submission)
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
            locationLat: verification.latitude,
            locationLng: verification.longitude,
            targetLat: verification.targetLat,
            targetLng: verification.targetLng,
            
            // Distance and accuracy
            distanceMeters: verification.distanceMeters,
            gpsAccuracyMeters: verification.accuracy,
            allowedRadiusMeters: window.getLocationById(selectedLocationId).allowedRadius,
            
            // Security flags
            tamperingFlagged: tamperingCheck.isSuspicious,
            tamperingDetails: tamperingCheck.isSuspicious ? tamperingCheck.details : ''
        };

        // Save to localStorage
        const records = JSON.parse(localStorage.getItem('attendanceRecords')) || [];
        records.push(newRecord);
        localStorage.setItem('attendanceRecords', JSON.stringify(records));
        
        // Record submission time for tampering detection
        window.recordSubmissionTime(timeInfo.isoString);

        // Show success message
        let successText = `Attendance submitted successfully! Status: ${finalStatus} at ${timeInfo.time}`;
        if (tamperingCheck.isSuspicious) {
            successText += ' ⚠️ (Flagged for review — possible clock irregularity)';
        }
        successMessage.textContent = successText;
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

function verifySelectedLocation() {
    // Uses the averaged live GPS fix — no new network request, no cached position.
    const selectedLocationId = document.getElementById('attendanceLocation').value;
    const location           = window.getLocationById(selectedLocationId);

    if (!selectedLocationId || !location) {
        return Promise.reject(new Error('Please select a valid location from the list.'));
    }

    if (!window.isGeolocationSupported()) {
        return Promise.reject(new Error('Your browser does not support GPS location detection.'));
    }

    const fix = window.getLatestGPSFix();
    const err = window.getGPSWatchError();

    if (!fix) {
        const msg = err || 'GPS signal not yet acquired. Please wait for the location indicator to update.';
        return Promise.reject(new Error(msg));
    }

    if (!fix.readyForValidation) {
        return Promise.reject(new Error(
            `Collecting GPS samples (${fix.sampleCount || 0}/${window.GPS_SAMPLES_REQUIRED}). Please wait a few seconds.`
        ));
    }

    if (!window.isGPSAccuracyAcceptable(fix.accuracy)) {
        return Promise.resolve({
            locationId  : selectedLocationId,
            locationName: location.name,
            latitude    : fix.lat,
            longitude   : fix.lng,
            targetLat   : location.latitude,
            targetLng   : location.longitude,
            distanceMeters: 0,
            accuracy    : fix.accuracy,
            isValid     : false,
            accuracyIssue: true,
            sampleCount : fix.sampleCount
        });
    }

    const distanceMeters = window.getDistanceFromLatLonInMeters(
        fix.lat, fix.lng, location.latitude, location.longitude
    );
    const isValid = distanceMeters <= location.allowedRadius;

    return Promise.resolve({
        locationId    : selectedLocationId,
        locationName  : location.name,
        latitude      : fix.lat,
        longitude     : fix.lng,
        targetLat     : location.latitude,
        targetLng     : location.longitude,
        distanceMeters,
        accuracy      : fix.accuracy,
        isValid,
        accuracyIssue : false,
        sampleCount   : fix.sampleCount
    });
}

function loadDashboardData() {
    const records        = JSON.parse(localStorage.getItem('attendanceRecords')) || [];
    const today          = new Date().toISOString().split('T')[0];
    const uniqueStudents = new Set(records.map(r => r.email)).size;
    const todaysRecords  = records.filter(r => r.date === today);
    const presentToday   = todaysRecords.filter(r => r.attendance === 'Present').length;
    const absentToday    = todaysRecords.filter(r => r.attendance === 'Absent').length;
    const lateToday      = todaysRecords.filter(r => r.attendance === 'Late').length;

    document.getElementById('totalStudents').textContent = uniqueStudents;
    document.getElementById('totalRecords').textContent  = records.length;
    document.getElementById('presentToday').textContent  = presentToday;
    document.getElementById('absentToday').textContent   = absentToday;
    const lateTodayEl = document.getElementById('lateToday');
    if (lateTodayEl) lateTodayEl.textContent = lateToday;

    const recentRecordsDiv = document.getElementById('recentRecords');
    const recentRecs       = records.slice(-10).reverse();
    recentRecordsDiv.innerHTML = recentRecs.length === 0
        ? '<div class="empty-state"><p>No attendance records yet</p></div>'
        : generateRecordsTable(recentRecs);
}

function generateRecordsTable(records) {
    if (!records.length) {
        return '<div class="empty-state"><p>No records found</p></div>';
    }

    let html = '<table><thead><tr><th>Student Name</th><th>Index #</th><th>Course</th><th>Location</th><th>GPS</th><th>Distance</th><th>Status</th><th>Time Recorded</th><th>Timezone</th><th>Flag</th></tr></thead><tbody>';
    records.forEach(record => {
        // Normalise status to lower-kebab for CSS class
        const statusRaw = record.attendance || '-';
        const statusClass = `status-${statusRaw.toLowerCase().replace(/ /g, '-')}`;
        const gpsText = record.locationLat != null && record.locationLng != null
            ? `${Number(record.locationLat).toFixed(5)}, ${Number(record.locationLng).toFixed(5)}`
            : '-';
        const distanceText = record.distanceMeters != null ? `${Number(record.distanceMeters).toFixed(1)} m` : '-';
        const tamperCell = record.tamperingFlagged
            ? '<span style="color:#856404;font-weight:600" title="' + (record.tamperingDetails || '') + '">⚠️ Flagged</span>'
            : '<span style="color:#155724">✓</span>';

        html += `<tr>
                <td>${record.studentName || '-'}</td>
                <td>${record.indexNumber || '-'}</td>
                <td>${record.courseOffering || '-'}</td>
                <td>${record.locationName || '-'}</td>
                <td style="font-size:11px">${gpsText}</td>
                <td>${distanceText}</td>
                <td><span class="status-badge ${statusClass}">${statusRaw}</span></td>
                <td>${record.time || '-'}<br><small style="color:#999">${record.date || ''}</small></td>
                <td style="font-size:11px">${record.timeZone || '-'}<br><small style="color:#999">${record.utcOffset || ''}</small></td>
                <td>${tamperCell}</td>
            </tr>`;
    });
    html += '</tbody></table>';
    return html;
}

function showAdminTab(tabName) {
    document.querySelectorAll('.admin-tab').forEach(tab => tab.classList.add('hidden'));
    document.querySelectorAll('.lect-nav-btn').forEach(btn => btn.classList.remove('active'));

    const tabMap = {
        'overview'           : ['overviewTab',          0, loadDashboardData],
        'records'            : ['recordsTab',           1, displayAllRecords],
        'students'           : ['studentsTab',          2, populateStudentList],
        'attendance-windows' : ['attendanceWindowsTab', 3, displayAttendanceWindowsConfig],
        'calibration'        : ['calibrationTab',       4, () => { populateCalibrationLocationDropdown(); displayCalibrationHistory(); }],
        'reports'            : ['reportsTab',           5, null],
        'profile'            : ['profileTab',           6, _populateProfileTab]
    };

    const entry = tabMap[tabName];
    if (!entry) return;

    const [tabId, btnIdx, fn] = entry;
    document.getElementById(tabId).classList.remove('hidden');
    const btns = document.querySelectorAll('.lect-nav-btn');
    if (btns[btnIdx]) btns[btnIdx].classList.add('active');
    if (fn) fn();
}

function displayAllRecords() {
    const records = JSON.parse(localStorage.getItem('attendanceRecords')) || [];
    document.getElementById('allRecordsTable').innerHTML = records.length === 0 ? '<div class="empty-state"><p>No attendance records found</p></div>' : generateRecordsTable(records.reverse());
}

function applyFilters() {
    const records     = JSON.parse(localStorage.getItem('attendanceRecords')) || [];
    const course      = document.getElementById('filterCourse').value;
    const status      = document.getElementById('filterStatus').value;
    const studentName = document.getElementById('searchStudent').value.toLowerCase();
    const dateVal     = document.getElementById('filterDate').value;

    const filtered = records.filter(r => {
        const matchCourse   = !course       || r.courseOffering === course;
        const matchStatus   = !status       || r.attendance === status;
        const matchStudent  = !studentName  || (r.studentName || '').toLowerCase().includes(studentName);
        const matchDate     = !dateVal      || r.date === dateVal;
        return matchCourse && matchStatus && matchStudent && matchDate;
    });

    document.getElementById('allRecordsTable').innerHTML = filtered.length === 0
        ? '<div class="empty-state"><p>No records match your filters</p></div>'
        : generateRecordsTable(filtered.reverse());
}

function clearFilters() {
    document.getElementById('filterCourse').value  = '';
    document.getElementById('filterStatus').value  = '';
    document.getElementById('searchStudent').value = '';
    document.getElementById('filterDate').value    = '';
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

        calibrationStatusText.innerHTML = '📡 Capturing GPS — collecting 5 samples for accuracy…<br><small>Stand still inside the building.</small>';
        calibrationStatus.style.display = 'block';
        calibrationStatus.style.background   = '#eef2ff';
        calibrationStatus.style.color        = '#1e3a8a';
        calibrationStatus.style.borderColor  = '#c7d2fe';

        // Collect 5 independent readings and average them
        const SAMPLES = 5;
        const readings = [];
        for (let i = 0; i < SAMPLES; i++) {
            calibrationStatusText.innerHTML =
                `📡 Collecting sample ${i + 1} of ${SAMPLES}…<br><small>Stand still inside the building.</small>`;
            const pos = await window.getCurrentPositionPromise({ enableHighAccuracy: true, timeout: 20000, maximumAge: 0 });
            readings.push({ lat: pos.coords.latitude, lng: pos.coords.longitude, acc: pos.coords.accuracy });
            // Short pause between readings
            await new Promise(r => setTimeout(r, 800));
        }

        const latitude  = readings.reduce((s, r) => s + r.lat, 0) / SAMPLES;
        const longitude = readings.reduce((s, r) => s + r.lng, 0) / SAMPLES;
        const accuracy  = readings.reduce((s, r) => s + r.acc, 0) / SAMPLES;
        
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

/* ═══════════════════════════════════════════════════════
   ATTENDANCE WINDOWS CONFIGURATION  (Admin Tab)
   Allows lecturers to set start / late-cutoff / end times
   per course. Students outside the window are blocked.
═══════════════════════════════════════════════════════ */

const COURSE_LIST = [
    { id: 'CS101', name: 'CS101 - Introduction to Programming' },
    { id: 'CS202', name: 'CS202 - Data Structures' },
    { id: 'CS303', name: 'CS303 - Web Development' },
    { id: 'CS404', name: 'CS404 - Database Management' },
    { id: 'CS505', name: 'CS505 - Software Engineering' }
];

/**
 * Renders the full Attendance Windows configuration panel.
 * Called every time the admin opens the tab.
 */
function displayAttendanceWindowsConfig() {
    const container = document.getElementById('attendanceWindowsContainer');
    if (!container) return;

    const allWindows = window.getAllAttendanceWindows(); // { CS101: {...}, ... }

    let html = `
        <div class="aw-toolbar">
            <button class="filter-btn" onclick="openAddWindowModal()">＋ Add Window</button>
            <button class="filter-btn" style="background:#6c757d;margin-left:8px" onclick="clearAllAttendanceWindows()">Clear All</button>
        </div>`;

    if (Object.keys(allWindows).length === 0) {
        html += `<div class="empty-state" style="margin-top:20px">
                    <p>No attendance windows configured yet.</p>
                    <p style="font-size:13px;color:#aaa;margin-top:8px">Click <strong>＋ Add Window</strong> to set a period for a course.</p>
                 </div>`;
    } else {
        html += `<div class="table-container" style="margin-top:16px">
        <table>
            <thead>
                <tr>
                    <th>Course</th>
                    <th>Window Opens</th>
                    <th>Late After</th>
                    <th>Window Closes</th>
                    <th>Current Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>`;

        COURSE_LIST.forEach(course => {
            const win = allWindows[course.id];
            if (!win) return;

            const statusInfo = getWindowLiveStatus(win);

            html += `<tr>
                <td><strong>${course.name}</strong></td>
                <td>${win.startTime}</td>
                <td>${win.lateTime}</td>
                <td>${win.endTime}</td>
                <td>
                    <span class="status-badge ${statusInfo.badgeClass}">${statusInfo.label}</span>
                    <div style="font-size:11px;color:#666;margin-top:4px">${statusInfo.detail}</div>
                </td>
                <td>
                    <button class="filter-btn" style="padding:5px 12px;font-size:13px"
                        onclick="openEditWindowModal('${course.id}')">Edit</button>
                    <button class="filter-btn" style="padding:5px 12px;font-size:13px;background:#dc3545;margin-left:6px"
                        onclick="deleteAttendanceWindow('${course.id}')">Delete</button>
                </td>
            </tr>`;
        });

        html += `</tbody></table></div>`;
    }

    // Modal (hidden by default)
    html += buildWindowModal();

    container.innerHTML = html;
}

/**
 * Returns live status label + badge class for a window object.
 */
function getWindowLiveStatus(win) {
    const now = new Date();
    const cur = now.getHours() * 60 + now.getMinutes();
    const start = parseHHMM(win.startTime);
    const late  = parseHHMM(win.lateTime);
    const end   = parseHHMM(win.endTime);

    if (cur < start) {
        const mins = start - cur;
        return { label: 'Not Started', badgeClass: 'aw-badge-pending', detail: `Opens in ${formatMins(mins)}` };
    }
    if (cur <= late) {
        const rem = end - cur;
        return { label: 'Open — On Time', badgeClass: 'aw-badge-open', detail: `${formatMins(rem)} remaining` };
    }
    if (cur <= end) {
        const rem = end - cur;
        return { label: 'Open — Late', badgeClass: 'aw-badge-late', detail: `${formatMins(rem)} until close` };
    }
    return { label: 'Closed', badgeClass: 'aw-badge-closed', detail: `Closed at ${win.endTime}` };
}

function parseHHMM(str) {
    const [h, m] = str.split(':').map(Number);
    return h * 60 + m;
}

function formatMins(mins) {
    if (mins <= 0) return '0m';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

/**
 * Builds the add/edit modal HTML (hidden until triggered).
 */
function buildWindowModal() {
    return `
    <div id="awModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:1000;align-items:center;justify-content:center">
        <div style="background:#fff;border-radius:12px;padding:36px;width:100%;max-width:480px;box-shadow:0 20px 60px rgba(0,0,0,.3);position:relative">
            <h2 id="awModalTitle" style="margin-bottom:24px;color:#333;font-size:20px">Configure Attendance Window</h2>

            <div class="form-group">
                <label>Course</label>
                <select id="aw_course" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:6px;font-size:14px">
                    <option value="">-- Select Course --</option>
                    ${COURSE_LIST.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                </select>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:20px">
                <div>
                    <label style="display:block;margin-bottom:6px;font-size:13px;font-weight:600;color:#555">
                        Start Time
                        <span style="font-weight:400;color:#888;display:block;font-size:11px">Window opens</span>
                    </label>
                    <input type="time" id="aw_start" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:6px;font-size:14px">
                </div>
                <div>
                    <label style="display:block;margin-bottom:6px;font-size:13px;font-weight:600;color:#555">
                        Late After
                        <span style="font-weight:400;color:#888;display:block;font-size:11px">Present → Late</span>
                    </label>
                    <input type="time" id="aw_late" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:6px;font-size:14px">
                </div>
                <div>
                    <label style="display:block;margin-bottom:6px;font-size:13px;font-weight:600;color:#555">
                        End Time
                        <span style="font-weight:400;color:#888;display:block;font-size:11px">Window closes</span>
                    </label>
                    <input type="time" id="aw_end" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:6px;font-size:14px">
                </div>
            </div>

            <!-- Live preview -->
            <div id="aw_preview" style="background:#f8f9ff;border:1px solid #e0e4ff;border-radius:8px;padding:14px;margin-bottom:20px;font-size:13px;line-height:1.8">
                <strong style="color:#444">Preview:</strong><br>
                <span id="aw_preview_text" style="color:#666">Fill in times above to see the window preview.</span>
            </div>

            <div id="aw_modal_error" style="display:none;background:#f8d7da;color:#721c24;padding:10px;border-radius:6px;margin-bottom:16px;font-size:13px"></div>

            <div style="display:flex;gap:10px;justify-content:flex-end">
                <button onclick="closeWindowModal()" style="padding:10px 24px;background:#f0f0f0;color:#333;border:1px solid #ddd;border-radius:6px;font-size:14px;font-weight:600;cursor:pointer">Cancel</button>
                <button onclick="saveWindowFromModal()" style="padding:10px 24px;background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;border:none;border-radius:6px;font-size:14px;font-weight:600;cursor:pointer">Save Window</button>
            </div>
        </div>
    </div>`;
}

/* ── Modal open / close ── */

function openAddWindowModal() {
    document.getElementById('awModalTitle').textContent = 'Add Attendance Window';
    document.getElementById('aw_course').value  = '';
    document.getElementById('aw_course').disabled = false;
    document.getElementById('aw_start').value   = '';
    document.getElementById('aw_late').value    = '';
    document.getElementById('aw_end').value     = '';
    document.getElementById('aw_modal_error').style.display = 'none';
    updateWindowPreview();

    const modal = document.getElementById('awModal');
    modal.style.display = 'flex';

    // Wire live preview updates
    ['aw_start','aw_late','aw_end'].forEach(id => {
        document.getElementById(id).addEventListener('input', updateWindowPreview);
    });
}

function openEditWindowModal(courseId) {
    const win = window.getAttendanceWindow(courseId);
    if (!win) return;

    const course = COURSE_LIST.find(c => c.id === courseId);
    document.getElementById('awModalTitle').textContent = `Edit Window — ${course ? course.name : courseId}`;

    const courseSelect = document.getElementById('aw_course');
    courseSelect.value    = courseId;
    courseSelect.disabled = true; // can't change course while editing

    document.getElementById('aw_start').value = win.startTime;
    document.getElementById('aw_late').value  = win.lateTime;
    document.getElementById('aw_end').value   = win.endTime;
    document.getElementById('aw_modal_error').style.display = 'none';
    updateWindowPreview();

    const modal = document.getElementById('awModal');
    modal.style.display = 'flex';

    ['aw_start','aw_late','aw_end'].forEach(id => {
        document.getElementById(id).addEventListener('input', updateWindowPreview);
    });
}

function closeWindowModal() {
    document.getElementById('awModal').style.display = 'none';
}

/* ── Save from modal ── */

function saveWindowFromModal() {
    const courseId  = document.getElementById('aw_course').value;
    const startTime = document.getElementById('aw_start').value;
    const lateTime  = document.getElementById('aw_late').value;
    const endTime   = document.getElementById('aw_end').value;
    const errEl     = document.getElementById('aw_modal_error');

    errEl.style.display = 'none';

    // Validation
    if (!courseId)  return showModalError('Please select a course.');
    if (!startTime) return showModalError('Please set a Start Time.');
    if (!lateTime)  return showModalError('Please set a Late After time.');
    if (!endTime)   return showModalError('Please set an End Time.');

    const s = parseHHMM(startTime);
    const l = parseHHMM(lateTime);
    const e = parseHHMM(endTime);

    if (l <= s) return showModalError('Late After time must be after Start Time.');
    if (e <= l) return showModalError('End Time must be after Late After time.');
    if (e <= s) return showModalError('End Time must be after Start Time.');

    window.setAttendanceWindow(courseId, startTime, lateTime, endTime);

    closeWindowModal();
    displayAttendanceWindowsConfig(); // re-render table
}

function showModalError(msg) {
    const el = document.getElementById('aw_modal_error');
    el.textContent    = msg;
    el.style.display  = 'block';
}

/* ── Live preview in modal ── */

function updateWindowPreview() {
    const previewEl = document.getElementById('aw_preview_text');
    if (!previewEl) return;

    const startTime = document.getElementById('aw_start').value;
    const lateTime  = document.getElementById('aw_late').value;
    const endTime   = document.getElementById('aw_end').value;

    if (!startTime || !lateTime || !endTime) {
        previewEl.textContent = 'Fill in all three times to see the preview.';
        return;
    }

    const s = parseHHMM(startTime);
    const l = parseHHMM(lateTime);
    const e = parseHHMM(endTime);

    if (l <= s || e <= l) {
        previewEl.innerHTML = '<span style="color:#dc3545">⚠ Times are out of order — Late After must be between Start and End.</span>';
        return;
    }

    previewEl.innerHTML =
        `🟢 <strong>Present:</strong> ${startTime} – ${lateTime} (${formatMins(l - s)} window)<br>` +
        `🟡 <strong>Late:</strong> ${lateTime} – ${endTime} (${formatMins(e - l)} window)<br>` +
        `🔴 <strong>Absent:</strong> After ${endTime}`;
}

/* ── Delete single window ── */

function deleteAttendanceWindow(courseId) {
    const course = COURSE_LIST.find(c => c.id === courseId);
    if (!confirm(`Delete attendance window for ${course ? course.name : courseId}?`)) return;

    const allWindows = window.getAllAttendanceWindows();
    delete allWindows[courseId];
    localStorage.setItem('attendanceWindows', JSON.stringify(allWindows));

    displayAttendanceWindowsConfig();
}

/* ── Clear all windows ── */

function clearAllAttendanceWindows() {
    if (!confirm('Clear ALL attendance windows? This cannot be undone.')) return;
    localStorage.removeItem('attendanceWindows');
    displayAttendanceWindowsConfig();
}

/* ═══════════════════════════════════════════════════════
   REPORTS  (Lecturer Dashboard)
═══════════════════════════════════════════════════════ */

let _lastReportRecords = [];

function _getReportDateRange(type, from, to) {
    const now   = new Date();
    const today = now.toISOString().split('T')[0];

    if (from && to) return { from, to };

    if (type === 'daily') {
        return { from: today, to: today };
    }
    if (type === 'weekly') {
        const d = new Date(now); d.setDate(d.getDate() - 6);
        return { from: d.toISOString().split('T')[0], to: today };
    }
    if (type === 'monthly') {
        const d = new Date(now); d.setDate(d.getDate() - 29);
        return { from: d.toISOString().split('T')[0], to: today };
    }
    return { from: null, to: null };
}

function generateReport() {
    const course     = document.getElementById('reportCourse').value;
    const type       = document.getElementById('reportType').value;
    const manualFrom = document.getElementById('reportDateFrom').value;
    const manualTo   = document.getElementById('reportDateTo').value;
    const { from, to } = _getReportDateRange(type, manualFrom, manualTo);

    let records = JSON.parse(localStorage.getItem('attendanceRecords')) || [];

    if (course)  records = records.filter(r => r.courseOffering === course);
    if (from)    records = records.filter(r => r.date >= from);
    if (to)      records = records.filter(r => r.date <= to);

    _lastReportRecords = records;

    // Summary cards
    const total   = records.length;
    const present = records.filter(r => r.attendance === 'Present').length;
    const late    = records.filter(r => r.attendance === 'Late').length;
    const absent  = records.filter(r => r.attendance === 'Absent').length;
    const rate    = total > 0 ? ((present + late) / total * 100).toFixed(1) : '0.0';

    document.getElementById('reportSummaryCards').innerHTML = `
        <div class="stat-card"><div class="stat-icon">📄</div><h3>Total</h3><div class="stat-value">${total}</div></div>
        <div class="stat-card stat-card-green"><div class="stat-icon">✅</div><h3>Present</h3><div class="stat-value">${present}</div></div>
        <div class="stat-card stat-card-amber"><div class="stat-icon">⏰</div><h3>Late</h3><div class="stat-value">${late}</div></div>
        <div class="stat-card stat-card-red"><div class="stat-icon">❌</div><h3>Absent</h3><div class="stat-value">${absent}</div></div>
        <div class="stat-card"><div class="stat-icon">📊</div><h3>Attendance Rate</h3><div class="stat-value">${rate}%</div></div>
    `;

    document.getElementById('reportTable').innerHTML = records.length === 0
        ? '<div class="empty-state"><p>No records match the selected filters.</p></div>'
        : generateRecordsTable([...records].reverse());
}

function exportReportCSV() {
    const records = _lastReportRecords.length
        ? _lastReportRecords
        : (JSON.parse(localStorage.getItem('attendanceRecords')) || []);

    if (!records.length) {
        alert('No records to export. Generate a report first.');
        return;
    }

    const headers = [
        'Student Name','Index Number','Email','Course','Location',
        'Date','Time','Timezone','UTC Offset',
        'Status','GPS Lat','GPS Lng','Distance (m)','GPS Accuracy (m)',
        'Tampering Flagged'
    ];

    const rows = records.map(r => [
        `"${r.studentName||''}"`,
        `"${r.indexNumber||''}"`,
        `"${r.email||''}"`,
        `"${r.courseOffering||''}"`,
        `"${r.locationName||''}"`,
        `"${r.date||''}"`,
        `"${r.time||''}"`,
        `"${r.timeZone||''}"`,
        `"${r.utcOffset||''}"`,
        `"${r.attendance||''}"`,
        r.studentLat || '',
        r.studentLon || '',
        r.distanceMeters != null ? Number(r.distanceMeters).toFixed(2) : '',
        r.gpsAccuracyMeters != null ? Number(r.gpsAccuracyMeters).toFixed(2) : '',
        r.tamperingFlagged ? 'Yes' : 'No'
    ].join(','));

    const csv     = [headers.join(','), ...rows].join('\n');
    const blob    = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url     = URL.createObjectURL(blob);
    const link    = document.createElement('a');
    const date    = new Date().toISOString().split('T')[0];
    link.href     = url;
    link.download = `UENR_Attendance_Report_${date}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/* ═══════════════════════════════════════════════════════
   PROFILE  (Lecturer Dashboard)
═══════════════════════════════════════════════════════ */

function _populateProfileTab() {
    if (!currentUser) return;
    const lecturers = JSON.parse(localStorage.getItem('lecturers')) || {};
    const data      = lecturers[currentUser.email] || {};

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val || '—'; };
    set('profileName',    currentUser.name);
    set('profileEmail',   currentUser.email);
    set('profileStaffId', data.staffId || '—');
    set('profileDept',    data.department || '—');

    const editStaff = document.getElementById('editStaffId');
    const editDept  = document.getElementById('editDept');
    if (editStaff) editStaff.value = data.staffId || '';
    if (editDept)  editDept.value  = data.department || '';
}

function saveProfile() {
    if (!currentUser) return;
    const staffId = document.getElementById('editStaffId').value.trim();
    const dept    = document.getElementById('editDept').value.trim();

    const lecturers = JSON.parse(localStorage.getItem('lecturers')) || {};
    if (lecturers[currentUser.email]) {
        lecturers[currentUser.email].staffId    = staffId;
        lecturers[currentUser.email].department = dept;
        localStorage.setItem('lecturers', JSON.stringify(lecturers));
    }

    _populateProfileTab();

    const msg = document.getElementById('profileSaveMsg');
    if (msg) { msg.style.display = 'block'; setTimeout(() => msg.style.display = 'none', 3000); }
}
