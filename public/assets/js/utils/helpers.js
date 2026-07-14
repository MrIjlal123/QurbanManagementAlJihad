/**
 * Helper Utility Functions
 * General purpose helper functions
 */

/**
 * Parse comma-separated or array owner names
 * @param {string|Array} pemilik - Owner data
 * @returns {Array} Array of owner names
 */
function parseOwnerNames(pemilik) {
    if (Array.isArray(pemilik)) {
        return pemilik.map(name => String(name || '').trim()).filter(name => name !== '');
    }
    if (typeof pemilik === 'string') {
        return pemilik.split(',').map(name => name.trim()).filter(name => name !== '');
    }
    return [];
}

/**
 * Normalize owner names (ensure array format)
 * @param {string|Array} pemilik - Owner data
 * @returns {Array} Normalized array of owner names
 */
function normalizeOwners(pemilik) {
    if (Array.isArray(pemilik)) {
        const names = pemilik.map(item => {
            if (typeof item === 'object' && item.nama) {
                return item.nama;
            }
            return String(item || '').trim();
        });
        return names.filter(v => v !== '');
    }
    if (typeof pemilik === 'string') {
        const parts = pemilik.split(',').map(p => p.trim());
        return parts.filter(p => p !== '');
    }
    return [];
}

/**
 * Count number of owners
 * @param {string|Array} pemilik - Owner data
 * @returns {number} Number of owners
 */
function countOwners(pemilik) {
    return normalizeOwners(pemilik).length;
}

/**
 * Normalize RT values for consistent display and comparison
 * @param {string|number|null|undefined} rt - Raw RT value
 * @returns {string} Normalized RT digits or empty string when invalid
 */
function normalizeRtValue(rt) {
    const rawValue = String(rt ?? '').trim();
    if (!rawValue || rawValue === '-' || rawValue.toLowerCase() === 'semuart') return '';

    const digitsOnly = rawValue.replace(/\D/g, '');
    if (digitsOnly) {
        return digitsOnly.padStart(2, '0');
    }

    return rawValue;
}

/**
 * Format an RT label consistently as "RT XX"
 * @param {string|number|null|undefined} rt - Raw RT value
 * @returns {string} Formatted RT label or "RT -" when invalid
 */
function formatRtLabel(rt) {
    const normalizedRt = normalizeRtValue(rt);
    return normalizedRt ? `RT ${normalizedRt}` : 'RT -';
}

/**
 * Parse JSON response from API with fallback
 * @param {Response} response - Fetch response object
 * @returns {Promise<Object>} Parsed JSON or error object
 */
async function parseJsonResponse(response) {
    try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return await response.json();
        } else {
            return { success: false, message: 'Invalid response format' };
        }
    } catch (error) {
        return { success: false, message: error.message };
    }
}

/**
 * Match animal type (jenis) with source filter
 * @param {string} jenis - Animal type (Sapi, Kambing, Domba)
 * @param {string} source - Source filter (lowercased)
 * @returns {boolean} True if matches
 */
function matchesSource(jenis, source) {
    const jenisLower = String(jenis || '').toLowerCase().trim();
    
    if (source === 'sapi') return jenisLower === 'sapi';
    if (source === 'kambing') return jenisLower === 'kambing';
    if (source === 'domba') return jenisLower === 'domba';
    if (source === 'ruminan') return jenisLower === 'kambing' || jenisLower === 'domba';
    if (source === 'campuran') return ['sapi', 'kambing', 'domba'].includes(jenisLower);
    
    return false;
}

/**
 * Deep clone object
 * @param {Object} obj - Object to clone
 * @returns {Object} Cloned object
 */
function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj);
    if (obj instanceof Array) return obj.map(item => deepClone(item));
    
    const cloned = {};
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            cloned[key] = deepClone(obj[key]);
        }
    }
    return cloned;
}

/**
 * Merge objects (shallow merge)
 * @param {Object} target - Target object
 * @param {Object} source - Source object
 * @returns {Object} Merged object
 */
function mergeObjects(target, source) {
    return { ...target, ...source };
}

/**
 * Get query parameter from URL
 * @param {string} paramName - Parameter name
 * @returns {string|null} Parameter value or null
 */
function getQueryParam(paramName) {
    const params = new URLSearchParams(window.location.search);
    return params.get(paramName);
}

/**
 * Debounce function (delay execution)
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Show toast notification
 * @param {string} message - Notification message
 * @param {string} type - Type: 'success', 'error', 'warning', 'info'
 * @param {number} duration - Duration in milliseconds (default: 3000)
 */
function showToast(message, type = 'info', duration = 3000) {
    const toastHtml = `
        <div class="alert alert-${getBootstrapAlertClass(type)} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    
    const container = document.getElementById('toastContainer') || createToastContainer();
    const toastEl = document.createElement('div');
    toastEl.innerHTML = toastHtml;
    container.appendChild(toastEl);
    
    if (duration > 0) {
        setTimeout(() => {
            toastEl.remove();
        }, duration);
    }
}

/**
 * Map notification type to Bootstrap alert class
 * @param {string} type - Notification type
 * @returns {string} Bootstrap alert class
 */
function getBootstrapAlertClass(type) {
    const mapping = {
        'success': 'success',
        'error': 'danger',
        'warning': 'warning',
        'info': 'info'
    };
    return mapping[type] || 'info';
}

/**
 * Create toast container if not exists
 * @returns {Element} Toast container element
 */
function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toastContainer';
    document.body.appendChild(container);
    return container;
}

/**
 * Check internet connection status
 * @returns {boolean} True if online
 */
function isOnline() {
    return navigator.onLine;
}

/**
 * Wait/delay execution
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise} Promise that resolves after delay
 */
function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Expose commonly used helpers to global scope for legacy scripts
if (typeof window !== 'undefined') {
    window.normalizeRtValue = normalizeRtValue;
    window.formatRtLabel = formatRtLabel;
}
