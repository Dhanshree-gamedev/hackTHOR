const jwt = require('jsonwebtoken');

// Secret key for JWT signing (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'simple-erp-secret-key-change-in-production';
const JWT_EXPIRES_IN = '24h';

/**
 * Generate JWT token for user
 * @param {Object} user - User object with id, email, role
 * @returns {string} - JWT token
 */
function generateToken(user) {
    const payload = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
    };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verify JWT token
 * @param {string} token - JWT token
 * @returns {Object|null} - Decoded payload or null if invalid
 */
function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
}

/**
 * Decode JWT token without verification
 * @param {string} token - JWT token
 * @returns {Object|null} - Decoded payload
 */
function decodeToken(token) {
    try {
        return jwt.decode(token);
    } catch (error) {
        return null;
    }
}

module.exports = {
    generateToken,
    verifyToken,
    decodeToken,
    JWT_SECRET
};
