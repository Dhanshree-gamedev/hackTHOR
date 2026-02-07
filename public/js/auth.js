/**
 * Authentication Module
 */

const AUTH_TOKEN_KEY = 'erp_token';
const AUTH_USER_KEY = 'erp_user';

/**
 * Login user
 */
async function login(email, password) {
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            return { success: false, error: data.error || 'Login failed' };
        }

        // Store token and user
        localStorage.setItem(AUTH_TOKEN_KEY, data.token);
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));

        return { success: true, user: data.user };
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, error: 'Connection error. Please try again.' };
    }
}

/**
 * Logout user
 */
async function logout() {
    try {
        await fetch('/api/auth/logout', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem(AUTH_TOKEN_KEY)}`
            }
        });
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(AUTH_USER_KEY);
        window.location.href = 'index.html';
    }
}

/**
 * Get current user
 */
function getCurrentUser() {
    const userStr = localStorage.getItem(AUTH_USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
}

/**
 * Check if user is authenticated
 */
function isAuthenticated() {
    return !!localStorage.getItem(AUTH_TOKEN_KEY);
}

/**
 * Check if user has required role
 */
function hasRole(...roles) {
    const user = getCurrentUser();
    if (!user) return false;
    if (user.role === 'Admin') return true;
    return roles.includes(user.role);
}
