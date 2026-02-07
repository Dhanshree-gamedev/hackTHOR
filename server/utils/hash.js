const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 10;

/**
 * Hash a plain text password
 * @param {string} password - Plain text password
 * @returns {Promise<string>} - Hashed password
 */
async function hashPassword(password) {
    return await bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Hash a plain text password (synchronous)
 * @param {string} password - Plain text password
 * @returns {string} - Hashed password
 */
function hashPasswordSync(password) {
    return bcrypt.hashSync(password, SALT_ROUNDS);
}

/**
 * Compare plain text password with hash
 * @param {string} password - Plain text password
 * @param {string} hash - Password hash
 * @returns {Promise<boolean>} - True if match
 */
async function comparePassword(password, hash) {
    return await bcrypt.compare(password, hash);
}

/**
 * Compare plain text password with hash (synchronous)
 * @param {string} password - Plain text password
 * @param {string} hash - Password hash
 * @returns {boolean} - True if match
 */
function comparePasswordSync(password, hash) {
    return bcrypt.compareSync(password, hash);
}

module.exports = {
    hashPassword,
    hashPasswordSync,
    comparePassword,
    comparePasswordSync
};
