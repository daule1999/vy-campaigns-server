/**
 * RBAC Middleware
 * Provides permission-based and role-based authorization
 */

const { Role, Permission, User } = require('../db/models/sequelize');

/**
 * Get user's effective permissions from all their roles
 * @param {number} userId - User ID
 * @returns {Promise<string[]>} Array of permission names
 */
async function getUserPermissions(userId) {
    try {
        const user = await User.findByPk(userId, {
            include: [{
                model: Role,
                as: 'roles',
                include: [{
                    model: Permission,
                    as: 'permissions',
                    attributes: ['name']
                }]
            }]
        });

        if (!user || !user.roles) {
            return [];
        }

        // Flatten permissions from all roles and deduplicate
        const permissions = new Set();
        user.roles.forEach(role => {
            if (role.permissions) {
                role.permissions.forEach(perm => {
                    permissions.add(perm.name);
                });
            }
        });

        return Array.from(permissions);
    } catch (error) {
        console.error('Error getting user permissions:', error);
        return [];
    }
}

/**
 * Get user's roles
 * @param {number} userId - User ID
 * @returns {Promise<string[]>} Array of role names
 */
async function getUserRoles(userId) {
    try {
        const user = await User.findByPk(userId, {
            include: [{
                model: Role,
                as: 'roles',
                attributes: ['name']
            }]
        });

        if (!user || !user.roles) {
            return [];
        }

        return user.roles.map(role => role.name);
    } catch (error) {
        console.error('Error getting user roles:', error);
        return [];
    }
}

/**
 * Middleware to check if user has specific permission(s)
 * @param {...string} requiredPermissions - Permission names required
 * @returns {Function} Express middleware
 */
const hasPermission = (...requiredPermissions) => {
    return async (req, res, next) => {
        try {
            // Check if user is authenticated
            if (!req.user || !req.user.id) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }

            // Check if user is superadmin - bypass all permission checks
            if (req.user.isSuperAdmin) {
                req.userPermissions = ['*'];
                return next();
            }

            const userId = req.user.id;
            const userPermissions = await getUserPermissions(userId);

            // Check if user has all required permissions
            const hasAllPermissions = requiredPermissions.every(
                perm => userPermissions.includes(perm)
            );

            if (!hasAllPermissions) {
                return res.status(403).json({
                    success: false,
                    message: 'Insufficient permissions',
                    required: requiredPermissions,
                    userHas: userPermissions
                });
            }

            // Attach permissions to request for later use
            req.userPermissions = userPermissions;
            next();
        } catch (error) {
            console.error('Permission check error:', error);
            return res.status(500).json({
                success: false,
                message: 'Error checking permissions'
            });
        }
    };
};

/**
 * Middleware to check if user has ANY of the specified permissions
 * @param {...string} permissions - Permission names
 * @returns {Function} Express middleware
 */
const hasAnyPermission = (...permissions) => {
    return async (req, res, next) => {
        try {
            if (!req.user || !req.user.id) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }

            const userId = req.user.id;
            const userPermissions = await getUserPermissions(userId);

            // Check if user has at least one of the required permissions
            const hasAtLeastOne = permissions.some(
                perm => userPermissions.includes(perm)
            );

            if (!hasAtLeastOne) {
                return res.status(403).json({
                    success: false,
                    message: 'Insufficient permissions',
                    requiredAnyOf: permissions,
                    userHas: userPermissions
                });
            }

            req.userPermissions = userPermissions;
            next();
        } catch (error) {
            console.error('Permission check error:', error);
            return res.status(500).json({
                success: false,
                message: 'Error checking permissions'
            });
        }
    };
};

/**
 * Middleware to check if user has specific role(s)
 * @param {...string} requiredRoles - Role names required
 * @returns {Function} Express middleware
 */
const hasRole = (...requiredRoles) => {
    return async (req, res, next) => {
        try {
            if (!req.user || !req.user.id) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }

            const userId = req.user.id;
            const userRoles = await getUserRoles(userId);

            // Check if user has any of the required roles
            const hasRequiredRole = requiredRoles.some(
                role => userRoles.includes(role)
            );

            if (!hasRequiredRole) {
                return res.status(403).json({
                    success: false,
                    message: 'Insufficient role privileges',
                    required: requiredRoles,
                    userHas: userRoles
                });
            }

            // Attach roles to request for later use
            req.userRoles = userRoles;
            next();
        } catch (error) {
            console.error('Role check error:', error);
            return res.status(500).json({
                success: false,
                message: 'Error checking roles'
            });
        }
    };
};

/**
 * Check if user is owner or super admin (for critical operations)
 * @returns {Function} Express middleware
 */
const isOwnerOrSuperAdmin = () => {
    return hasRole('owner', 'super_admin');
};

/**
 * Check if user is admin level (owner, super_admin, or admin)
 * @returns {Function} Express middleware
 */
const isAdmin = () => {
    return hasRole('owner', 'super_admin', 'admin');
};

module.exports = {
    getUserPermissions,
    getUserRoles,
    hasPermission,
    hasAnyPermission,
    hasRole,
    isOwnerOrSuperAdmin,
    isAdmin
};
