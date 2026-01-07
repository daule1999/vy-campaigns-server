const jwt = require('jsonwebtoken');
const config = require('../config');
const { userRepository } = require('../db/repositories');

/**
 * Authentication middleware - verifies JWT token and loads user with permissions
 */
async function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            error: 'Access token required',
            code: 'AUTH_TOKEN_MISSING'
        });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, config.jwt.secret);

        // Get user from database with groups and permissions
        const user = await userRepository.findById(decoded.userId, {
            includeGroups: true,
            includePermissions: true
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'User not found',
                code: 'AUTH_USER_NOT_FOUND'
            });
        }

        // Check if user is active
        if (user.isActive === false) {
            return res.status(403).json({
                success: false,
                error: 'Account is inactive',
                code: 'ACCOUNT_INACTIVE'
            });
        }

        req.user = {
            id: user.id,
            username: user.username,
            email: user.email,
            name: user.name,
            isSuperAdmin: user.isSuperAdmin,
            permissions: user.permissions || [],
            groups: (user.groups || []).map(g => ({ id: g.id, name: g.name }))
        };
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                error: 'Token expired',
                code: 'AUTH_TOKEN_EXPIRED'
            });
        }

        return res.status(401).json({
            success: false,
            error: 'Invalid token',
            code: 'AUTH_TOKEN_INVALID'
        });
    }
}

/**
 * Permission-based authorization middleware
 * Checks if user has the required permission
 */
function requirePermission(...permissions) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required',
                code: 'AUTH_REQUIRED'
            });
        }

        // Superadmin has all permissions
        if (req.user.isSuperAdmin) {
            return next();
        }

        // Check if user has '*' (all permissions) or any of the required permissions
        const userPerms = req.user.permissions || [];
        const hasPermission = userPerms.includes('*') ||
            permissions.some(p => userPerms.includes(p));

        if (!hasPermission) {
            return res.status(403).json({
                success: false,
                error: 'Insufficient permissions',
                code: 'AUTH_FORBIDDEN',
                required: permissions
            });
        }

        next();
    };
}

/**
 * Superadmin-only middleware
 */
function requireSuperAdmin(req, res, next) {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: 'Authentication required',
            code: 'AUTH_REQUIRED'
        });
    }

    if (!req.user.isSuperAdmin) {
        return res.status(403).json({
            success: false,
            error: 'Superadmin access required',
            code: 'AUTH_SUPERADMIN_REQUIRED'
        });
    }

    next();
}

/**
 * Legacy role-based authorization (for backward compatibility)
 * Maps old roles to permissions
 */
function authorize(...roles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required',
                code: 'AUTH_REQUIRED'
            });
        }

        // Superadmin always passes
        if (req.user.isSuperAdmin) {
            return next();
        }

        // For backward compatibility: 'admin' role = has admin:users permission
        if (roles.includes('admin')) {
            const userPerms = req.user.permissions || [];
            if (userPerms.includes('*') || userPerms.includes('admin:users')) {
                return next();
            }
        }

        return res.status(403).json({
            success: false,
            error: 'Insufficient permissions',
            code: 'AUTH_FORBIDDEN'
        });
    };
}

/**
 * Optional authentication - doesn't fail if no token
 */
async function optionalAuth(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next();
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, config.jwt.secret);
        const user = await userRepository.findById(decoded.userId, {
            includeGroups: true,
            includePermissions: true
        });

        if (user && user.isActive !== false) {
            req.user = {
                id: user.id,
                username: user.username,
                email: user.email,
                name: user.name,
                isSuperAdmin: user.isSuperAdmin,
                permissions: user.permissions || [],
                groups: (user.groups || []).map(g => ({ id: g.id, name: g.name }))
            };
        }
    } catch (error) {
        // Ignore errors for optional auth
    }

    next();
}

module.exports = {
    authenticate,
    authorize,
    requirePermission,
    requireSuperAdmin,
    optionalAuth
};
