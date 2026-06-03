/**
 * GPS Validation Module
 * Handles geolocation detection and distance calculation using Haversine formula
 */

// GPS Accuracy requirement: maximum 30 meters
window.GPS_ACCURACY_THRESHOLD = 30;

/**
 * Check if geolocation is supported by the browser
 * @returns {boolean} - True if geolocation is supported
 */
window.isGeolocationSupported = function () {
    return 'geolocation' in navigator;
};

/**
 * Get current position as a Promise
 * @param {object} options - Geolocation options
 * @returns {Promise} - Promise that resolves with position or rejects with error
 */
window.getCurrentPositionPromise = function (options = {}) {
    return new Promise((resolve, reject) => {
        if (!window.isGeolocationSupported()) {
            reject(new Error('Geolocation is not supported by this browser.'));
            return;
        }

        navigator.geolocation.getCurrentPosition(resolve, reject, options);
    });
};

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} - Distance in meters
 */
window.getDistanceFromLatLonInMeters = function (lat1, lon1, lat2, lon2) {
    const toRadian = (value) => (value * Math.PI) / 180;
    const R = 6371000; // Earth's radius in meters
    const dLat = toRadian(lat2 - lat1);
    const dLon = toRadian(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadian(lat1)) * Math.cos(toRadian(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

/**
 * Format distance for display
 * @param {number} distanceMeters - Distance in meters
 * @returns {string} - Formatted distance string
 */
window.formatDistanceMessage = function (distanceMeters) {
    if (distanceMeters < 1) {
        return `${(distanceMeters * 100).toFixed(0)} cm`;
    }
    return `${distanceMeters.toFixed(1)} m`;
};

/**
 * Check if GPS accuracy is acceptable
 * @param {number} accuracy - GPS accuracy in meters
 * @returns {boolean} - True if accuracy is within threshold
 */
window.isGPSAccuracyAcceptable = function (accuracy) {
    return accuracy <= window.GPS_ACCURACY_THRESHOLD;
};

/**
 * Get GPS accuracy status message
 * @param {number} accuracy - GPS accuracy in meters
 * @returns {string} - Status message
 */
window.getGPSAccuracyMessage = function (accuracy) {
    if (accuracy <= 10) {
        return `Excellent GPS accuracy (${accuracy.toFixed(0)}m)`;
    } else if (accuracy <= 20) {
        return `Good GPS accuracy (${accuracy.toFixed(0)}m)`;
    } else if (accuracy <= 30) {
        return `Acceptable GPS accuracy (${accuracy.toFixed(0)}m)`;
    } else if (accuracy <= 50) {
        return `Waiting for better GPS accuracy (${accuracy.toFixed(0)}m)...`;
    } else {
        return `Waiting for accurate GPS location (${accuracy.toFixed(0)}m)...`;
    }
};
