/**
 * gps-validator.js  — UENR Attendance System
 * Advanced GPS module: watchPosition, multi-sample averaging,
 * 20m accuracy threshold, nearest-building detection, debug panel.
 */

/* ═══════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════ */
window.GPS_ACCURACY_THRESHOLD        = 20;   // hard limit – reject above this
window.GPS_ACCURACY_PREFERRED        = 10;   // ideal target
window.GPS_SAMPLES_REQUIRED          = 5;    // readings before averaged fix is trusted
window.GPS_WATCH_OPTIONS = {
    enableHighAccuracy: true,
    timeout           : 20000,
    maximumAge        : 0        // NEVER use cached position
};

/* ═══════════════════════════════════════
   WATCH STATE  (module-level)
═══════════════════════════════════════ */
let _watchId        = null;    // navigator.geolocation watchPosition id
let _samples        = [];      // rolling buffer of GPS readings
let _latestFix      = null;    // { lat, lng, accuracy, timestamp } – averaged
let _watchCallbacks = [];      // fns to call on each new fix
let _watchError     = null;    // last error string

/* ═══════════════════════════════════════
   SUPPORT CHECK
═══════════════════════════════════════ */
window.isGeolocationSupported = function () {
    return 'geolocation' in navigator;
};

/* ═══════════════════════════════════════
   HAVERSINE DISTANCE  (meters)
═══════════════════════════════════════ */
window.getDistanceFromLatLonInMeters = function (lat1, lon1, lat2, lon2) {
    const R  = 6371000;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    const a  = Math.sin(Δφ/2)**2 + Math.cos(φ1)*Math.cos(φ2)*Math.sin(Δλ/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
};

/* ═══════════════════════════════════════
   FORMAT HELPERS
═══════════════════════════════════════ */
window.formatDistanceMessage = function (m) {
    if (m === null || m === undefined) return '—';
    if (m < 1) return `${(m * 100).toFixed(0)} cm`;
    return `${m.toFixed(1)} m`;
};

window.isGPSAccuracyAcceptable = function (accuracy) {
    return accuracy <= window.GPS_ACCURACY_THRESHOLD;
};

window.getGPSAccuracyMessage = function (accuracy) {
    if (accuracy <= 10)  return `🟢 Excellent accuracy (±${accuracy.toFixed(0)}m)`;
    if (accuracy <= 20)  return `🟡 Good accuracy (±${accuracy.toFixed(0)}m)`;
    if (accuracy <= 35)  return `🟠 Weak signal (±${accuracy.toFixed(0)}m) — move outdoors`;
    return `🔴 Signal too poor (±${accuracy.toFixed(0)}m) — cannot accept attendance`;
};

/* ═══════════════════════════════════════
   MULTI-SAMPLE AVERAGE
═══════════════════════════════════════ */
function _computeAveragedFix(samples) {
    if (!samples.length) return null;
    const avgLat = samples.reduce((s, r) => s + r.lat, 0) / samples.length;
    const avgLng = samples.reduce((s, r) => s + r.lng, 0) / samples.length;
    const avgAcc = samples.reduce((s, r) => s + r.accuracy, 0) / samples.length;
    return { lat: avgLat, lng: avgLng, accuracy: avgAcc, sampleCount: samples.length };
}

/* ═══════════════════════════════════════
   watchPosition  — START / STOP
═══════════════════════════════════════ */
window.startGPSWatch = function (onUpdate, onError) {
    if (!window.isGeolocationSupported()) {
        const msg = 'GPS is not supported by your browser.';
        _watchError = msg;
        if (onError) onError(msg);
        return;
    }

    // Register callbacks
    if (onUpdate) _watchCallbacks.push(onUpdate);

    // Only start one watcher
    if (_watchId !== null) return;

    _samples   = [];
    _latestFix = null;
    _watchError = null;

    _watchId = navigator.geolocation.watchPosition(
        (position) => {
            const { latitude: lat, longitude: lng, accuracy } = position.coords;

            // Keep rolling window of last 10 samples
            _samples.push({ lat, lng, accuracy, ts: Date.now() });
            if (_samples.length > 10) _samples.shift();

            // Compute averaged fix from last N samples
            const recentSamples = _samples.slice(-window.GPS_SAMPLES_REQUIRED);
            _latestFix = _computeAveragedFix(recentSamples);
            _latestFix.rawLat      = lat;
            _latestFix.rawLng      = lng;
            _latestFix.rawAccuracy = accuracy;
            _latestFix.readyForValidation = _samples.length >= window.GPS_SAMPLES_REQUIRED;

            _watchError = null;

            // Notify all registered callbacks
            _watchCallbacks.forEach(cb => { try { cb(_latestFix); } catch(e){} });
        },
        (err) => {
            const messages = {
                1: 'Location access denied. Please enable GPS permission in your browser settings.',
                2: 'GPS signal unavailable. Please move outdoors or to an open area.',
                3: 'GPS request timed out. Retrying…'
            };
            _watchError = messages[err.code] || `GPS error: ${err.message}`;
            if (onError) onError(_watchError);
        },
        window.GPS_WATCH_OPTIONS
    );
};

window.stopGPSWatch = function () {
    if (_watchId !== null) {
        navigator.geolocation.clearWatch(_watchId);
        _watchId = null;
    }
    _watchCallbacks = [];
    _samples        = [];
    _latestFix      = null;
};

/** Returns the current averaged fix or null */
window.getLatestGPSFix = function () { return _latestFix; };

/** Returns the last watch error string or null */
window.getGPSWatchError = function () { return _watchError; };

/* ═══════════════════════════════════════
   SINGLE-SHOT (for calibration)
═══════════════════════════════════════ */
window.getCurrentPositionPromise = function (options = {}) {
    return new Promise((resolve, reject) => {
        if (!window.isGeolocationSupported()) {
            reject(new Error('Geolocation is not supported by this browser.'));
            return;
        }
        navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout           : 20000,
            maximumAge        : 0,
            ...options
        });
    });
};

/* ═══════════════════════════════════════
   NEAREST BUILDING DETECTION
═══════════════════════════════════════ */
window.findNearestBuilding = function (lat, lng) {
    if (!window.UENR_LOCATIONS_MASTER) return null;
    let nearest = null;
    let minDist = Infinity;

    Object.values(window.UENR_LOCATIONS_MASTER).forEach(loc => {
        const d = window.getDistanceFromLatLonInMeters(lat, lng, loc.latitude, loc.longitude);
        if (d < minDist) { minDist = d; nearest = loc; }
    });

    return nearest ? { location: nearest, distance: minDist } : null;
};

/* ═══════════════════════════════════════
   FULL VALIDATION (called at submission)
   Uses the averaged fix, not a single sample.
═══════════════════════════════════════ */
window.validateGPSForAttendance = function (selectedLocationId) {
    const fix = _latestFix;

    if (!fix) {
        return {
            valid: false,
            reason: 'GPS not ready. Please wait for location to be detected.',
            fix: null
        };
    }

    if (!fix.readyForValidation) {
        const remaining = window.GPS_SAMPLES_REQUIRED - _samples.length;
        return {
            valid: false,
            reason: `Collecting GPS samples… (${_samples.length}/${window.GPS_SAMPLES_REQUIRED}). Please wait.`,
            fix
        };
    }

    if (!window.isGPSAccuracyAcceptable(fix.accuracy)) {
        return {
            valid: false,
            reason: `GPS signal is not accurate enough (±${fix.accuracy.toFixed(0)}m). Please move outdoors or wait for a stronger signal.`,
            fix
        };
    }

    const location = window.getLocationById(selectedLocationId);
    if (!location) {
        return { valid: false, reason: 'Invalid location selected.', fix };
    }

    const distance = window.getDistanceFromLatLonInMeters(
        fix.lat, fix.lng, location.latitude, location.longitude
    );

    const isWithinRadius = distance <= location.allowedRadius;

    return {
        valid           : isWithinRadius,
        reason          : isWithinRadius
            ? `✅ Verified — ${distance.toFixed(1)}m from ${location.name} (limit: ${location.allowedRadius}m)`
            : `❌ Too far — you are ${distance.toFixed(1)}m from ${location.name} (limit: ${location.allowedRadius}m)`,
        fix,
        distance,
        location,
        isWithinRadius
    };
};

/* ═══════════════════════════════════════
   DEBUG PANEL  (lecturer calibration)
═══════════════════════════════════════ */
window.renderGPSDebugPanel = function (containerId, selectedLocationId) {
    const el = document.getElementById(containerId);
    if (!el) return;

    const fix      = _latestFix;
    const location = selectedLocationId ? window.getLocationById(selectedLocationId) : null;
    const distance = (fix && location)
        ? window.getDistanceFromLatLonInMeters(fix.lat, fix.lng, location.latitude, location.longitude)
        : null;
    const nearest  = fix ? window.findNearestBuilding(fix.lat, fix.lng) : null;
    const accOk    = fix && window.isGPSAccuracyAcceptable(fix.accuracy);
    const ready    = fix && fix.readyForValidation;

    const row = (label, value, ok) => `
        <tr>
            <td style="padding:6px 10px;color:#666;font-size:12px;white-space:nowrap">${label}</td>
            <td style="padding:6px 10px;font-size:12px;font-weight:600;color:${ok === true ? '#155724' : ok === false ? '#721c24' : '#222'}">${value}</td>
        </tr>`;

    el.innerHTML = `
        <div style="background:#1a1a2e;color:#e0f5e0;border-radius:8px;padding:14px;font-family:'Courier New',monospace;font-size:12px">
            <div style="color:#4ade80;font-weight:700;margin-bottom:10px;font-size:13px">🛰 GPS Debug Panel</div>
            <table style="width:100%;border-collapse:collapse">
                ${row('Samples collected',
                    fix ? `${_samples.length} / ${window.GPS_SAMPLES_REQUIRED}` : 'Waiting…',
                    ready)}
                ${row('Device Lat (avg)',
                    fix ? fix.lat.toFixed(7) : '—', null)}
                ${row('Device Lng (avg)',
                    fix ? fix.lng.toFixed(7) : '—', null)}
                ${row('Raw Lat',
                    fix ? fix.rawLat.toFixed(7) : '—', null)}
                ${row('Raw Lng',
                    fix ? fix.rawLng.toFixed(7) : '—', null)}
                ${row('GPS Accuracy',
                    fix ? `±${fix.accuracy.toFixed(1)}m` : '—', accOk)}
                ${row('Target Lat',
                    location ? location.latitude.toFixed(7) : '—', null)}
                ${row('Target Lng',
                    location ? location.longitude.toFixed(7) : '—', null)}
                ${row('Distance to target',
                    distance !== null ? `${distance.toFixed(2)}m` : '—',
                    distance !== null ? distance <= (location?.allowedRadius || 0) : null)}
                ${row('Allowed radius',
                    location ? `${location.allowedRadius}m` : '—', null)}
                ${row('Nearest building',
                    nearest ? `${nearest.location.name} (${nearest.distance.toFixed(1)}m)` : '—', null)}
                ${row('Validation status',
                    !fix ? 'No fix yet' :
                    !ready ? 'Collecting samples…' :
                    !accOk ? 'Accuracy too low' :
                    distance === null ? 'Select location' :
                    distance <= (location?.allowedRadius||0) ? '✅ PASS' : '❌ FAIL',
                    distance !== null && ready && accOk
                        ? distance <= (location?.allowedRadius||0) : null)}
                ${row('Last update',
                    fix ? new Date().toLocaleTimeString() : '—', null)}
                ${row('Watch active',
                    _watchId !== null ? 'Yes' : 'No',
                    _watchId !== null)}
            </table>
        </div>`;
};
