/**
 * Formatter Utility Functions
 * Handles data formatting for display
 */

/**
 * Get current Hijri year based on Gregorian year
 * Formula: Hijri = Gregorian - 579 (approximate)
 * @param {number} gregorianYear - Gregorian year
 * @returns {number} Hijri year
 */
function getCurrentHijriYear(gregorianYear) {
    return gregorianYear - 579;
}

/**
 * Format year for display (e.g., "1447 H / 2026 M")
 * @param {number} hijri - Hijri year
 * @param {number} gregorian - Gregorian year
 * @returns {string} Formatted year string
 */
function formatYearDisplay(hijri, gregorian) {
    return `${hijri} H / ${gregorian} M`;
}

/**
 * Get 3 consecutive years (previous, current, next)
 * @returns {Array} Array of {hijri, gregorian} objects
 */
function getDynamicYears() {
    const currentYear = new Date().getFullYear();
    const years = [];
    
    for (let i = -1; i <= 1; i++) {
        const gregorian = currentYear + i;
        const hijri = getCurrentHijriYear(gregorian);
        years.push({ hijri, gregorian });
    }
    
    return years;
}

/**
 * Format owners list for export/display
 * @param {string|Array} pemilik - Owner data (string or array)
 * @returns {string} Formatted owners string
 */
function formatOwnersForExport(pemilik) {
    if (Array.isArray(pemilik)) {
        return pemilik.join(', ');
    }
    return pemilik || '-';
}

/**
 * Format currency/number with thousand separator
 * @param {number} number - Number to format
 * @param {number} decimals - Decimal places (default: 0)
 * @returns {string} Formatted number string
 */
function formatCurrency(number, decimals = 0) {
    return new Intl.NumberFormat('id-ID', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(number);
}

/**
 * Format date to readable format
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date string (DD/MM/YYYY)
 */
function formatDate(date) {
    if (!date) return '-';
    
    const d = new Date(date);
    if (isNaN(d.getTime())) return '-';
    
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    
    return `${day}/${month}/${year}`;
}

/**
 * Format weight/mass with appropriate unit
 * @param {number} kg - Weight in kilograms
 * @returns {string} Formatted weight string
 */
function formatWeight(kg) {
    if (kg === null || kg === undefined) return '-';
    
    const num = parseFloat(kg);
    if (isNaN(num)) return '-';
    
    return `${num.toFixed(2)} KG`;
}

/**
 * Truncate string to specified length
 * @param {string} str - String to truncate
 * @param {number} length - Max length
 * @param {string} suffix - Suffix if truncated (default: '...')
 * @returns {string} Truncated string
 */
function truncateString(str, length, suffix = '...') {
    if (!str || str.length <= length) return str;
    return str.substring(0, length) + suffix;
}
