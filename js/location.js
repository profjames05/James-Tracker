/**
 * UENR Location Management Module
 * Handles location dropdown population and location lookup
 */

window.populateLocationDropdown = function () {
    const locationSelect = document.getElementById('attendanceLocation');
    if (!locationSelect) return;

    // Get grouped locations by category from locations.js
    const groupedLocations = window.getLocationsByCategory();

    // Clear existing options except the placeholder
    locationSelect.innerHTML = '<option value="">-- Select Location --</option>';

    // Add locations grouped by category
    Object.keys(groupedLocations)
        .sort() // Sort categories alphabetically
        .forEach((category) => {
            const optGroup = document.createElement('optgroup');
            optGroup.label = category;
            
            // Sort locations within category
            groupedLocations[category]
                .sort((a, b) => a.name.localeCompare(b.name))
                .forEach((location) => {
                    const option = document.createElement('option');
                    option.value = location.id;
                    option.textContent = location.name;
                    optGroup.appendChild(option);
                });
            
            locationSelect.appendChild(optGroup);
        });
};

/**
 * Get location by ID (primary lookup method)
 * @param {string} locationId - The location ID (e.g., 'SH1', 'LT1', 'ENGINEERING_BLOCK')
 * @returns {object|null} - Location object or null if not found
 */
window.getLocationById = function (locationId) {
    return window.UENR_LOCATIONS_MASTER[locationId] || null;
};

/**
 * Legacy method for backwards compatibility
 * Get location by name
 * @param {string} name - The location name (e.g., 'SH1', 'Engineering Block')
 * @returns {object|null} - Location object or null if not found
 */
window.getLocationByName = function (name) {
    return Object.values(window.UENR_LOCATIONS_MASTER).find(
        (location) => location.name === name || location.id === name
    ) || null;
};
