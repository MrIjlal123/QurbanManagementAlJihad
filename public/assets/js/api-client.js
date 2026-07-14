/**
 * API Client
 * Centralized wrapper for all API calls
 * Handles fetch, error handling, and response parsing
 */

class ApiClient {
    constructor(baseUrl = '../api/index.php') {
        this.baseUrl = baseUrl;
        this.defaultHeaders = {
            'Content-Type': 'application/json'
        };
    }

    /**
     * Generic request method
     * @param {string} action - API action
     * @param {string} method - HTTP method (GET, POST, etc)
     * @param {Object} params - Query parameters or request body
     * @returns {Promise<Object>} API response
     */
    async request(action, method = 'GET', params = null) {
        try {
            const url = this._buildUrl(action, method === 'GET' ? params : null);
            const options = {
                method,
                headers: this.defaultHeaders
            };

            if (method !== 'GET' && params) {
                options.body = JSON.stringify(params);
            }

            const response = await fetch(url, options);
            return await this._handleResponse(response);
        } catch (error) {
            return this._handleError(error);
        }
    }

    /**
     * Build full URL with query parameters
     * @private
     */
    _buildUrl(action, params = null) {
        let url = `${this.baseUrl}?action=${encodeURIComponent(action)}`;

        if (params && typeof params === 'object') {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== null && value !== undefined) {
                    url += `&${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
                }
            });
        }

        return url;
    }

    /**
     * Handle API response
     * @private
     */
    async _handleResponse(response) {
        try {
            const data = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    message: data.message || `HTTP ${response.status}`,
                    data: null
                };
            }

            return data;
        } catch (error) {
            return {
                success: false,
                message: 'Failed to parse response',
                data: null
            };
        }
    }

    /**
     * Handle errors
     * @private
     */
    _handleError(error) {
        console.error('API Error:', error);
        return {
            success: false,
            message: error.message || 'Network error',
            data: null
        };
    }

    // ============== HEWAN ENDPOINTS ==============

    async getHewan(page = 1, limit = 50) {
        return this.request('getHewan', 'GET', { page, limit });
    }

    async addHewan(data) {
        return this.request('addHewan', 'POST', data);
    }

    async updateHewan(data) {
        return this.request('updateHewan', 'POST', data);
    }

    async deleteHewan(id) {
        return this.request('deleteHewan', 'GET', { id });
    }

    // ============== PENERIMA ENDPOINTS ==============

    async getPenerima(page = 1, limit = 50) {
        return this.request('getPenerima', 'GET', { page, limit });
    }

    async addPenerima(data) {
        return this.request('addPenerima', 'POST', data);
    }

    async updatePenerima(data) {
        return this.request('updatePenerima', 'POST', data);
    }

    async deletePenerima(id) {
        return this.request('deletePenerima', 'GET', { id });
    }

    // ============== KEUANGAN ENDPOINTS ==============

    async getKeuangan(page = 1, limit = 50) {
        return this.request('getKeuangan', 'GET', { page, limit });
    }

    async addKeuangan(data) {
        return this.request('addKeuangan', 'POST', data);
    }

    async updateKeuangan(data) {
        return this.request('updateKeuangan', 'POST', data);
    }

    async deleteKeuangan(id) {
        return this.request('deleteKeuangan', 'GET', { id });
    }

    // ============== PANITIA ENDPOINTS ==============

    async getPanitia(page = 1, limit = 50) {
        return this.request('getPanitia', 'GET', { page, limit });
    }

    async addPanitia(data) {
        return this.request('addPanitia', 'POST', data);
    }

    async updatePanitia(data) {
        return this.request('updatePanitia', 'POST', data);
    }

    async deletePanitia(id) {
        return this.request('deletePanitia', 'GET', { id });
    }

    // ============== DISTRIBUSI ENDPOINTS ==============

    async getDistribusi(page = 1, limit = 50) {
        return this.request('getDistribusi', 'GET', { page, limit });
    }

    async saveDistribusi(rows) {
        return this.request('saveDistribusi', 'POST', { rows });
    }

    async deleteDistribusi(id) {
        return this.request('deleteDistribusi', 'GET', { id });
    }

    // ============== UTILITY ENDPOINTS ==============

    async getTahun() {
        return this.request('getTahun', 'GET');
    }

    async getRTList(tahun = '') {
        return this.request('getRTList', 'GET', { tahun });
    }

    async getWargaCountPerRT(tahun, rt) {
        return this.request('getWargaCountPerRT', 'GET', { tahun, rt });
    }

    async getPerhitungan() {
        return this.request('getPerhitungan', 'GET');
    }

    // ============== DEBUG ENDPOINTS ==============

    async getDatabaseInfo() {
        return this.request('debugDatabaseInfo', 'GET');
    }

    async getPenerimaCount() {
        return this.request('debugPenerimaCount', 'GET');
    }
}

// Create global instance
const api = new ApiClient();
