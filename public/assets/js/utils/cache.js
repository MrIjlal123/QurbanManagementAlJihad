/**
 * Cache Utility Functions
 * Handles localStorage caching with TTL support
 */

const CACHE_TTL = 3600000; // 1 hour in milliseconds

/**
 * Store value in localStorage with TTL
 * @param {string} key - Cache key
 * @param {*} value - Value to cache
 * @param {number} ttl - Time to live in milliseconds (default: 1 hour)
 */
function cacheSet(key, value, ttl = CACHE_TTL) {
    try {
        const cacheData = {
            value,
            timestamp: Date.now(),
            ttl
        };
        localStorage.setItem(key, JSON.stringify(cacheData));
    } catch (error) {
        console.warn('Cache set failed:', error);
    }
}

/**
 * Get value from localStorage if not expired
 * @param {string} key - Cache key
 * @returns {*} Cached value or null if expired/not found
 */
function cacheGet(key) {
    try {
        const cached = localStorage.getItem(key);
        if (!cached) return null;
        
        const { value, timestamp, ttl } = JSON.parse(cached);
        
        // Check if cache has expired
        if (Date.now() - timestamp > ttl) {
            localStorage.removeItem(key);
            return null;
        }
        
        return value;
    } catch (error) {
        console.warn('Cache get failed:', error);
        return null;
    }
}

/**
 * Delete cache entry
 * @param {string} key - Cache key
 */
function cacheDelete(key) {
    try {
        localStorage.removeItem(key);
    } catch (error) {
        console.warn('Cache delete failed:', error);
    }
}

/**
 * Clear all cache entries
 */
function cacheClear() {
    try {
        localStorage.clear();
    } catch (error) {
        console.warn('Cache clear failed:', error);
    }
}
