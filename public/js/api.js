/**
 * API Helper Module
 * Handles all API requests with authentication
 */

const API_BASE = '/api';

/**
 * Make an authenticated API request
 */
async function apiRequest(endpoint, options = {}) {
    const token = localStorage.getItem('erp_token');

    const config = {
        method: options.method || 'GET',
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
            ...options.headers
        }
    };

    if (options.body) {
        config.body = JSON.stringify(options.body);
    }

    try {
        const response = await fetch(`${API_BASE}${endpoint}`, config);
        const data = await response.json();

        if (response.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('erp_token');
            localStorage.removeItem('erp_user');
            window.location.href = 'index.html';
            return { error: 'Session expired. Please login again.' };
        }

        if (!response.ok) {
            return { error: data.error || 'An error occurred', status: response.status };
        }

        return { data, status: response.status };
    } catch (error) {
        console.error('API Error:', error);
        return { error: 'Network error. Please try again.' };
    }
}

// Convenience methods
const api = {
    get: (endpoint) => apiRequest(endpoint),
    post: (endpoint, body) => apiRequest(endpoint, { method: 'POST', body }),
    put: (endpoint, body) => apiRequest(endpoint, { method: 'PUT', body }),
    delete: (endpoint) => apiRequest(endpoint, { method: 'DELETE' })
};
