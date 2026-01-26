/**
 * Role Management Routes
 */

const express = require('express');
const router = express.Router();
const { Role, Permission, UserRole, User } = require('../../db/models/sequelize');
const { authenticate } = require('../../middleware/auth');
const { hasPermission, isOwnerOrSuperAdmin } = require('../../middleware/rbac');

/**
 * GET /api/roles
 * List all roles
 */
router.get('/', authenticate, hasPermission('agent.view'), async (req, res) => {
    try {
        const roles = await Role.findAll({
            include: [{
                model: Permission,
                as: 'permissions',
                attributes: ['id', 'name', 'description', 'feature'],
                through: { attributes: [] }
            }],
            order: [['id', 'ASC']]
        });

        res.json({
            success: true,
            data: roles
        });
    } catch (error) {
        console.error('Error fetching roles:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching roles'
        });
    }
});

/**
 * GET /api/roles/:id
 * Get role by ID with permissions
 */
router.get('/:id', authenticate, hasPermission('agent.view'), async (req, res) => {
    try {
        const role = await Role.findByPk(req.params.id, {
            include: [{
                model: Permission,
                as: 'permissions',
                attributes: ['id', 'name', 'description', 'feature'],
                through: { attributes: [] }
            }]
        });

        if (!role) {
            return res.status(404).json({
                success: false,
                message: 'Role not found'
            });
        }

        res.json({
            success: true,
            data: role
        });
    } catch (error) {
        console.error('Error fetching role:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching role'
        });
    }
});

/**
 * POST /api/roles
 * Create a new role (owner/super admin only)
 */
router.post('/', authenticate, isOwnerOrSuperAdmin(), async (req, res) => {
    try {
        const { name, displayName, description } = req.body;

        if (!name || !displayName) {
            return res.status(400).json({
                success: false,
                message: 'Name and display name are required'
            });
        }

        // Check if role already exists
        const existingRole = await Role.findOne({ where: { name } });
        if (existingRole) {
            return res.status(400).json({
                success: false,
                message: 'Role with this name already exists'
            });
        }

        const role = await Role.create({
            name,
            displayName,
            description,
            isSystem: false
        });

        res.status(201).json({
            success: true,
            message: 'Role created successfully',
            data: role
        });
    } catch (error) {
        console.error('Error creating role:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating role'
        });
    }
});

/**
 * PUT /api/roles/:id
 * Update role (owner/super admin only)
 */
router.put('/:id', authenticate, isOwnerOrSuperAdmin(), async (req, res) => {
    try {
        const { displayName, description } = req.body;

        const role = await Role.findByPk(req.params.id);
        if (!role) {
            return res.status(404).json({
                success: false,
                message: 'Role not found'
            });
        }

        // Prevent modification of system roles' core properties
        if (role.isSystem) {
            return res.status(403).json({
                success: false,
                message: 'Cannot modify system roles. You can only update permissions.'
            });
        }

        await role.update({
            displayName: displayName || role.displayName,
            description: description !== undefined ? description : role.description
        });

        res.json({
            success: true,
            message: 'Role updated successfully',
            data: role
        });
    } catch (error) {
        console.error('Error updating role:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating role'
        });
    }
});

/**
 * DELETE /api/roles/:id
 * Delete role (owner/super admin only, cannot delete system roles)
 */
router.delete('/:id', authenticate, isOwnerOrSuperAdmin(), async (req, res) => {
    try {
        const role = await Role.findByPk(req.params.id);
        if (!role) {
            return res.status(404).json({
                success: false,
                message: 'Role not found'
            });
        }

        if (role.isSystem) {
            return res.status(403).json({
                success: false,
                message: 'Cannot delete system roles'
            });
        }

        // Check if any users have this role
        const usersWithRole = await UserRole.count({ where: { roleId: role.id } });
        if (usersWithRole > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete role. ${usersWithRole} user(s) currently have this role.`
            });
        }

        await role.destroy();

        res.json({
            success: true,
            message: 'Role deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting role:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting role'
        });
    }
});

/**
 * POST /api/roles/:id/permissions
 * Assign permissions to role (owner/super admin only)
 */
router.post('/:id/permissions', authenticate, isOwnerOrSuperAdmin(), async (req, res) => {
    try {
        const { permissionIds } = req.body;

        if (!Array.isArray(permissionIds)) {
            return res.status(400).json({
                success: false,
                message: 'permissionIds must be an array'
            });
        }

        const role = await Role.findByPk(req.params.id);
        if (!role) {
            return res.status(404).json({
                success: false,
                message: 'Role not found'
            });
        }

        // Verify all permissions exist
        const permissions = await Permission.findAll({
            where: { id: permissionIds }
        });

        if (permissions.length !== permissionIds.length) {
            return res.status(400).json({
                success: false,
                message: 'One or more permission IDs are invalid'
            });
        }

        // Set permissions (this replaces existing permissions)
        await role.setPermissions(permissions);

        res.json({
            success: true,
            message: 'Permissions assigned to role successfully',
            data: { roleId: role.id, permissionCount: permissions.length }
        });
    } catch (error) {
        console.error('Error assigning permissions:', error);
        res.status(500).json({
            success: false,
            message: 'Error assigning permissions'
        });
    }
});

/**
 * DELETE /api/roles/:roleId/permissions/:permissionId
 * Remove permission from role (owner/super admin only)
 */
router.delete('/:roleId/permissions/:permissionId', authenticate, isOwnerOrSuperAdmin(), async (req, res) => {
    try {
        const { roleId, permissionId } = req.params;

        const role = await Role.findByPk(roleId);
        if (!role) {
            return res.status(404).json({
                success: false,
                message: 'Role not found'
            });
        }

        const permission = await Permission.findByPk(permissionId);
        if (!permission) {
            return res.status(404).json({
                success: false,
                message: 'Permission not found'
            });
        }

        await role.removePermission(permission);

        res.json({
            success: true,
            message: 'Permission removed from role successfully'
        });
    } catch (error) {
        console.error('Error removing permission:', error);
        res.status(500).json({
            success: false,
            message: 'Error removing permission'
        });
    }
});

/**
 * POST /api/roles/:roleId/users/:userId
 * Assign role to user
 */
router.post('/:roleId/users/:userId', authenticate, hasPermission('agent.manage_roles'), async (req, res) => {
    try {
        const { roleId, userId } = req.params;

        const role = await Role.findByPk(roleId);
        if (!role) {
            return res.status(404).json({
                success: false,
                message: 'Role not found'
            });
        }

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if user already has this role
        const existingUserRole = await UserRole.findOne({
            where: { userId, roleId }
        });

        if (existingUserRole) {
            return res.status(400).json({
                success: false,
                message: 'User already has this role'
            });
        }

        await UserRole.create({ userId, roleId });

        res.json({
            success: true,
            message: 'Role assigned to user successfully'
        });
    } catch (error) {
        console.error('Error assigning role to user:', error);
        res.status(500).json({
            success: false,
            message: 'Error assigning role'
        });
    }
});

/**
 * DELETE /api/roles/:roleId/users/:userId
 * Remove role from user
 */
router.delete('/:roleId/users/:userId', authenticate, hasPermission('agent.manage_roles'), async (req, res) => {
    try {
        const { roleId, userId } = req.params;

        const userRole = await UserRole.findOne({
            where: { userId, roleId }
        });

        if (!userRole) {
            return res.status(404).json({
                success: false,
                message: 'User does not have this role'
            });
        }

        await userRole.destroy();

        res.json({
            success: true,
            message: 'Role removed from user successfully'
        });
    } catch (error) {
        console.error('Error removing role from user:', error);
        res.status(500).json({
            success: false,
            message: 'Error removing role'
        });
    }
});

/**
 * GET /api/roles/user/:userId
 * Get user's roles and permissions
 */
router.get('/user/:userId', authenticate, async (req, res) => {
    try {
        const { userId } = req.params;

        // Users can only view their own roles unless they have agent.view permission
        if (req.user.id !== parseInt(userId)) {
            const { getUserPermissions } = require('../middleware/rbac');
            const permissions = await getUserPermissions(req.user.id);
            if (!permissions.includes('agent.view')) {
                return res.status(403).json({
                    success: false,
                    message: 'You can only view your own roles'
                });
            }
        }

        const user = await User.findByPk(userId, {
            include: [{
                model: Role,
                as: 'roles',
                include: [{
                    model: Permission,
                    as: 'permissions',
                    attributes: ['id', 'name', 'description', 'feature'],
                    through: { attributes: [] }
                }]
            }]
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Flatten and deduplicate permissions
        const allPermissions = new Set();
        user.roles.forEach(role => {
            role.permissions.forEach(perm => {
                allPermissions.add(JSON.stringify(perm));
            });
        });

        const uniquePermissions = Array.from(allPermissions).map(p => JSON.parse(p));

        res.json({
            success: true,
            data: {
                userId: user.id,
                roles: user.roles.map(r => ({
                    id: r.id,
                    name: r.name,
                    displayName: r.displayName,
                    description: r.description
                })),
                permissions: uniquePermissions
            }
        });
    } catch (error) {
        console.error('Error fetching user roles:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user roles'
        });
    }
});

module.exports = router;
