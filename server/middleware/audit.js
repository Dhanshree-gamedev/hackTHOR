const { run, query } = require('../config/database');

/**
 * Log an action to the audit trail
 */
function logAudit({ userId, action, entityType, entityId, oldValues, newValues, ipAddress }) {
    try {
        run(`INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [userId || null, action, entityType, entityId || null, oldValues ? JSON.stringify(oldValues) : null, newValues ? JSON.stringify(newValues) : null, ipAddress || null]);
    } catch (error) {
        console.error('Audit log error:', error.message);
    }
}

/**
 * Get client IP address from request
 */
function getClientIP(req) {
    return req.headers['x-forwarded-for']?.split(',')[0] ||
        req.connection?.remoteAddress ||
        req.socket?.remoteAddress ||
        'unknown';
}

/**
 * Middleware to automatically log requests
 */
function auditMiddleware(action, entityType) {
    return (req, res, next) => {
        const originalJson = res.json.bind(res);
        res.json = function (data) {
            if (res.statusCode >= 200 && res.statusCode < 300) {
                const entityId = data?.id || req.params?.id;
                logAudit({
                    userId: req.user?.id,
                    action: action,
                    entityType: entityType,
                    entityId: entityId,
                    newValues: req.body,
                    ipAddress: getClientIP(req)
                });
            }
            return originalJson(data);
        };
        next();
    };
}

/**
 * Get audit logs with filters
 */
function getAuditLogs(filters = {}) {
    let sql = `SELECT al.*, u.name as user_name, u.email as user_email FROM audit_logs al LEFT JOIN users u ON al.user_id = u.id WHERE 1=1`;
    const params = [];

    if (filters.userId) { sql += ' AND al.user_id = ?'; params.push(filters.userId); }
    if (filters.entityType) { sql += ' AND al.entity_type = ?'; params.push(filters.entityType); }
    if (filters.action) { sql += ' AND al.action = ?'; params.push(filters.action); }
    if (filters.startDate) { sql += ' AND DATE(al.created_at) >= ?'; params.push(filters.startDate); }
    if (filters.endDate) { sql += ' AND DATE(al.created_at) <= ?'; params.push(filters.endDate); }

    sql += ' ORDER BY al.created_at DESC';
    if (filters.limit) sql += ` LIMIT ${parseInt(filters.limit)}`;

    return query(sql, params);
}

module.exports = { logAudit, getClientIP, auditMiddleware, getAuditLogs };
