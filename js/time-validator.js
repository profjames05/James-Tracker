/**
 * Time Validation Module
 * Handles automatic time detection, timezone management, and attendance window validation
 */

/**
 * Get current date and time information
 * @returns {object} - Object containing date, time, timezone, and UTC offset
 */
window.getCurrentTimeInfo = function() {
    const now = new Date();
    
    // Get timezone name
    const timeZoneName = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    // Calculate UTC offset
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timeZoneName,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
    
    const parts = formatter.formatToParts(now);
    const partsObject = {};
    parts.forEach(part => {
        partsObject[part.type] = part.value;
    });
    
    // Calculate UTC offset in minutes
    const localDate = new Date(partsObject.year, partsObject.month - 1, partsObject.day, 
                               partsObject.hour, partsObject.minute, partsObject.second);
    const utcOffset = Math.round((localDate - now) / 60000);
    const offsetHours = Math.floor(Math.abs(utcOffset) / 60);
    const offsetMinutes = Math.abs(utcOffset) % 60;
    const offsetSign = utcOffset <= 0 ? '+' : '-';
    const offsetString = `UTC${offsetSign}${String(offsetHours).padStart(2, '0')}:${String(offsetMinutes).padStart(2, '0')}`;
    
    return {
        date: now.toISOString().split('T')[0], // YYYY-MM-DD
        time: now.toLocaleTimeString('en-US', { hour12: false }), // HH:MM:SS
        timeZone: timeZoneName,
        utcOffset: offsetString,
        timestamp: now.toLocaleString(),
        isoString: now.toISOString(),
        dateObject: now
    };
};

/**
 * Format time for display (HH:MM:SS)
 * @param {Date} date - Date object to format
 * @returns {string} - Formatted time string
 */
window.formatTimeDisplay = function(date) {
    return date.toLocaleTimeString('en-US', { 
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
};

/**
 * Format date for display (YYYY-MM-DD)
 * @param {Date} date - Date object to format
 * @returns {string} - Formatted date string
 */
window.formatDateDisplay = function(date) {
    return date.toISOString().split('T')[0];
};

/**
 * Parse time string (HH:MM) to minutes since midnight
 * @param {string} timeString - Time in format "HH:MM" or "HH:MM:SS"
 * @returns {number} - Minutes since midnight
 */
window.parseTimeToMinutes = function(timeString) {
    const parts = timeString.split(':');
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    return hours * 60 + minutes;
};

/**
 * Check if current time is within attendance window
 * @param {string} startTime - Start time in format "HH:MM"
 * @param {string} endTime - End time in format "HH:MM"
 * @returns {object} - { isValid, status, minutesIntoWindow, minutesRemaining }
 */
window.isTimeInAttendanceWindow = function(startTime, endTime) {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const startMinutes = window.parseTimeToMinutes(startTime);
    const endMinutes = window.parseTimeToMinutes(endTime);
    
    const beforeWindow = currentMinutes < startMinutes;
    const inWindow = currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    const afterWindow = currentMinutes > endMinutes;
    
    let status = 'CLOSED';
    let minutesIntoWindow = 0;
    let minutesRemaining = 0;
    
    if (beforeWindow) {
        status = 'NOT_STARTED';
        minutesRemaining = startMinutes - currentMinutes;
    } else if (inWindow) {
        status = 'OPEN';
        minutesIntoWindow = currentMinutes - startMinutes;
        minutesRemaining = endMinutes - currentMinutes;
    } else if (afterWindow) {
        status = 'CLOSED';
    }
    
    return {
        isValid: inWindow,
        status,
        minutesIntoWindow,
        minutesRemaining,
        currentMinutes,
        startMinutes,
        endMinutes
    };
};

/**
 * Get attendance status based on time window position
 * @param {string} startTime - Attendance window start time (HH:MM)
 * @param {string} lateTime - Late cutoff time (HH:MM)
 * @param {string} endTime - Attendance window end time (HH:MM)
 * @returns {string} - Status: "PRESENT", "LATE", or "ABSENT"
 */
window.getAttendanceStatusByTime = function(startTime, lateTime, endTime) {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const startMinutes = window.parseTimeToMinutes(startTime);
    const lateMinutes = window.parseTimeToMinutes(lateTime);
    const endMinutes = window.parseTimeToMinutes(endTime);
    
    if (currentMinutes < startMinutes) {
        return 'Early'; // Before attendance window opens
    } else if (currentMinutes <= lateMinutes) {
        return 'Present'; // In on-time window
    } else if (currentMinutes <= endMinutes) {
        return 'Late'; // In late window
    } else {
        return 'Absent'; // After attendance window closes
    }
};

/**
 * Check for time tampering (device clock manipulation)
 * @returns {object} - { isSuspicious, details }
 */
window.checkForTimeTampering = function() {
    const currentTime = new Date();
    const lastSubmissionTimes = JSON.parse(localStorage.getItem('lastSubmissionTimes')) || [];
    
    let isSuspicious = false;
    let details = '';
    
    // Check if current time is earlier than last submission
    if (lastSubmissionTimes.length > 0) {
        const lastTime = new Date(lastSubmissionTimes[lastSubmissionTimes.length - 1]);
        if (currentTime < lastTime) {
            isSuspicious = true;
            details = 'Device time appears to have moved backwards. Time tampering suspected.';
        }
        
        // Check if multiple submissions in same second (impossible with real GPS check)
        if (lastSubmissionTimes.length > 1) {
            const previousTime = new Date(lastSubmissionTimes[lastSubmissionTimes.length - 1]);
            const secondPreviousTime = new Date(lastSubmissionTimes[lastSubmissionTimes.length - 2]);
            
            const timeDiff = (previousTime - secondPreviousTime) / 1000; // in seconds
            if (timeDiff < 5) {
                isSuspicious = true;
                details = 'Multiple submissions in very short time span. Possible clock manipulation or system abuse.';
            }
        }
    }
    
    return {
        isSuspicious,
        details,
        currentTime: currentTime.toISOString(),
        lastSubmissionCount: lastSubmissionTimes.length
    };
};

/**
 * Record submission time for tampering detection
 * @param {string} timestamp - ISO timestamp string
 */
window.recordSubmissionTime = function(timestamp) {
    const lastSubmissionTimes = JSON.parse(localStorage.getItem('lastSubmissionTimes')) || [];
    lastSubmissionTimes.push(timestamp);
    
    // Keep only last 50 submissions to avoid storage overflow
    if (lastSubmissionTimes.length > 50) {
        lastSubmissionTimes.shift();
    }
    
    localStorage.setItem('lastSubmissionTimes', JSON.stringify(lastSubmissionTimes));
};

/**
 * Get attendance window configuration for a course
 * @param {string} courseId - Course ID (e.g., 'CS101')
 * @returns {object|null} - Attendance window object or null if not configured
 */
window.getAttendanceWindow = function(courseId) {
    const windows = JSON.parse(localStorage.getItem('attendanceWindows')) || {};
    return windows[courseId] || null;
};

/**
 * Get all attendance windows
 * @returns {object} - All configured attendance windows
 */
window.getAllAttendanceWindows = function() {
    return JSON.parse(localStorage.getItem('attendanceWindows')) || {};
};

/**
 * Set attendance window for a course (admin only)
 * @param {string} courseId - Course ID
 * @param {string} startTime - Start time (HH:MM)
 * @param {string} lateTime - Late cutoff time (HH:MM)
 * @param {string} endTime - End time (HH:MM)
 */
window.setAttendanceWindow = function(courseId, startTime, lateTime, endTime) {
    const windows = JSON.parse(localStorage.getItem('attendanceWindows')) || {};
    windows[courseId] = {
        courseId,
        startTime,
        lateTime,
        endTime,
        createdAt: new Date().toISOString()
    };
    localStorage.setItem('attendanceWindows', JSON.stringify(windows));
};

/**
 * Get time window status message
 * @param {string} status - Status from isTimeInAttendanceWindow
 * @param {number} minutesRemaining - Minutes remaining in window
 * @returns {string} - User-friendly message
 */
window.getTimeStatusMessage = function(status, minutesRemaining, minutesIntoWindow, lateTime, startTime) {
    switch(status) {
        case 'NOT_STARTED':
            const hours = Math.floor(minutesRemaining / 60);
            const mins = minutesRemaining % 60;
            if (hours > 0) {
                return `Attendance window opens in ${hours}h ${mins}m`;
            }
            return `Attendance window opens in ${mins}m`;
        case 'OPEN':
            if (minutesRemaining <= 5) {
                return `⏰ Attendance window closing in ${minutesRemaining}m`;
            }
            return `✓ Attendance window is open`;
        case 'CLOSED':
            return `✗ Attendance period has closed`;
        default:
            return 'Checking time window...';
    }
};

/**
 * Initialize attendance windows with defaults (if not already set)
 */
window.initializeDefaultAttendanceWindows = function() {
    const windows = JSON.parse(localStorage.getItem('attendanceWindows')) || {};
    
    const courses = ['CS101', 'CS202', 'CS303', 'CS404', 'CS505'];
    const needsInitialization = courses.some(course => !windows[course]);
    
    if (needsInitialization) {
        // Default windows (can be customized by admin)
        const defaults = {
            'CS101': { startTime: '08:00', lateTime: '08:10', endTime: '08:30' },
            'CS202': { startTime: '10:00', lateTime: '10:10', endTime: '10:30' },
            'CS303': { startTime: '13:00', lateTime: '13:10', endTime: '13:30' },
            'CS404': { startTime: '14:00', lateTime: '14:10', endTime: '14:30' },
            'CS505': { startTime: '15:00', lateTime: '15:10', endTime: '15:30' }
        };
        
        Object.keys(defaults).forEach(courseId => {
            if (!windows[courseId]) {
                const config = defaults[courseId];
                windows[courseId] = {
                    courseId,
                    startTime: config.startTime,
                    lateTime: config.lateTime,
                    endTime: config.endTime,
                    createdAt: new Date().toISOString()
                };
            }
        });
        
        localStorage.setItem('attendanceWindows', JSON.stringify(windows));
    }
};
