/**
 * Validator Utility Functions
 * Handles input validation and data verification
 */

/**
 * Validate year format (must be "XXXX H / YYYY M" format)
 * @param {string} year - Year string to validate
 * @param {string} fieldName - Field name for error message
 * @throws {Error} If year format is invalid
 */
function validateYearOrFail(year, fieldName = 'tahun') {
    const yearRegex = /^\d{4} H \/ \d{4} M$/;
    
    if (!year || !yearRegex.test(year)) {
        throw new Error(`${fieldName} must be in format "XXXX H / YYYY M"`);
    }
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate phone number (Indonesian format)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid phone
 */
function isValidPhoneID(phone) {
    const phoneRegex = /^(\+62|62|0)[0-9]{9,12}$/;
    return phoneRegex.test(phone.replace(/\D/g, ''));
}

/**
 * Check if value is empty/null/undefined
 * @param {*} value - Value to check
 * @returns {boolean} True if empty
 */
function isEmpty(value) {
    return value === null || value === undefined || String(value).trim() === '';
}

/**
 * Validate numeric range
 * @param {number} value - Value to check
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {boolean} True if within range
 */
function isInRange(value, min, max) {
    const num = parseFloat(value);
    return !isNaN(num) && num >= min && num <= max;
}

/**
 * Validate array has items
 * @param {Array} arr - Array to check
 * @returns {boolean} True if array is not empty
 */
function hasItems(arr) {
    return Array.isArray(arr) && arr.length > 0;
}

/**
 * Validate required fields in object
 * @param {Object} obj - Object to validate
 * @param {Array} requiredFields - Array of required field names
 * @returns {Object} {isValid: boolean, errors: Array}
 */
function validateRequiredFields(obj, requiredFields) {
    const errors = [];
    
    requiredFields.forEach(field => {
        if (isEmpty(obj[field])) {
            errors.push(`${field} is required`);
        }
    });
    
    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Parse and validate JSON
 * @param {string} jsonString - JSON string to parse
 * @returns {Object} {success: boolean, data: *, error: string}
 */
function safeParseJSON(jsonString) {
    try {
        return {
            success: true,
            data: JSON.parse(jsonString)
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}
