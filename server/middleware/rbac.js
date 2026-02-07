/**
 * Role-Based Access Control (RBAC) Middleware
 * Defines permissions for each role and enforces access control
 */

// Permission matrix: defines what each role can access
const ROLE_PERMISSIONS = {
    'Admin': {
        modules: ['*'], // Full access
        actions: ['*']
    },
    'Sales Officer': {
        modules: ['customers', 'sales', 'products'],
        actions: ['read', 'create', 'update']
    },
    'Inventory Officer': {
        modules: ['products', 'suppliers', 'purchases'],
        actions: ['read', 'create', 'update']
    },
    'HR Officer': {
        modules: ['employees', 'attendance', 'payroll'],
        actions: ['read', 'create', 'update']
    },
    'Finance Officer': {
        modules: ['ledger', 'invoices', 'payroll'],
        actions: ['read', 'create', 'update']
    },
    'Project Manager': {
        modules: ['projects', 'tasks', 'employees'],
        actions: ['read', 'create', 'update', 'delete']
    },
    'Employee': {
        modules: ['tasks', 'attendance', 'payroll'],
        actions: ['read'],
        selfOnly: true // Can only view own data
    }
};

/**
 * Check if user has permission to access a module
 * @param {string} role - User role
 * @param {string} module - Module name
 * @param {string} action - Action type (read, create, update, delete)
 * @returns {boolean}
 */
function hasPermission(role, module, action = 'read') {
    const permissions = ROLE_PERMISSIONS[role];

    if (!permissions) {
        return false;
    }

    // Admin has full access
    if (permissions.modules.includes('*') && permissions.actions.includes('*')) {
        return true;
    }

    // Check module access
    if (!permissions.modules.includes(module) && !permissions.modules.includes('*')) {
        return false;
    }

    // Check action permission
    if (!permissions.actions.includes(action) && !permissions.actions.includes('*')) {
        return false;
    }

    return true;
}

/**
 * Create middleware to require specific role(s)
 * @param {...string} allowedRoles - Roles that are allowed
 * @returns {Function} Express middleware
 */
function requireRole(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        if (!allowedRoles.includes(req.user.role) && req.user.role !== 'Admin') {
            return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
        }

        next();
    };
}

/**
 * Create middleware to require module access
 * @param {string} module - Module name
 * @param {string} action - Action type
 * @returns {Function} Express middleware
 */
function requireAccess(module, action = 'read') {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        if (!hasPermission(req.user.role, module, action)) {
            return res.status(403).json({
                error: `Access denied. You don't have ${action} permission for ${module}.`
            });
        }

        // Check if user can only access their own data
        const permissions = ROLE_PERMISSIONS[req.user.role];
        if (permissions && permissions.selfOnly) {
            req.selfOnly = true;
        }

        next();
    };
}

/**
 * Get all accessible modules for a role
 * @param {string} role - User role
 * @returns {string[]} - Array of module names
 */
function getAccessibleModules(role) {
    const permissions = ROLE_PERMISSIONS[role];

    if (!permissions) {
        return [];
    }

    if (permissions.modules.includes('*')) {
        return ['users', 'employees', 'attendance', 'payroll', 'products', 'customers',
            'sales', 'invoices', 'suppliers', 'purchases', 'ledger', 'projects', 'tasks', 'audit'];
    }

    return permissions.modules;
}

module.exports = {
    ROLE_PERMISSIONS,
    hasPermission,
    requireRole,
    requireAccess,
    getAccessibleModules
};
