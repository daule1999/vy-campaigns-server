const express = require('express');
const { body, param } = require('express-validator');
const { permissionRepository, groupRepository, userRepository } = require('../../db/repositories');
const { authenticate, requirePermission, requireSuperAdmin, validate, auditLog } = require('../../middleware');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// ============================================================
// PERMISSIONS ENDPOINTS
// ============================================================

/**
 * Get all permissions
 * GET /api/rbac/permissions
 */
router.get('/permissions',
    requirePermission('rbac:read'),
    async (req, res) => {
        try {
            const { feature } = req.query;
            const filter = feature ? { feature } : {};
            const { rows: permissions, count } = await permissionRepository.findAll(filter);
            res.json({ success: true, data: permissions, total: count });
        } catch (error) {
            console.error('Get permissions error:', error);
            res.status(500).json({ success: false, error: 'Failed to get permissions' });
        }
    }
);

/**
 * Create permission (superadmin only)
 * POST /api/rbac/permissions
 */
router.post('/permissions',
    requireSuperAdmin,
    [
        body('name').trim().notEmpty().withMessage('Permission name is required'),
        body('feature').trim().notEmpty().withMessage('Feature is required'),
        body('description').optional().trim()
    ],
    validate,
    auditLog('PERMISSION_CREATE', 'permission'),
    async (req, res) => {
        try {
            const { name, feature, description } = req.body;

            // Check if permission exists
            const existing = await permissionRepository.findByName(name);
            if (existing) {
                return res.status(400).json({ success: false, error: 'Permission already exists' });
            }

            const permission = await permissionRepository.create({ name, feature, description });
            res.status(201).json({ success: true, data: permission });
        } catch (error) {
            console.error('Create permission error:', error);
            res.status(500).json({ success: false, error: 'Failed to create permission' });
        }
    }
);

/**
 * Update permission (superadmin only)
 * PUT /api/rbac/permissions/:id
 */
router.put('/permissions/:id',
    requireSuperAdmin,
    [
        param('id').isInt(),
        body('name').optional().trim().notEmpty(),
        body('feature').optional().trim().notEmpty(),
        body('description').optional().trim()
    ],
    validate,
    auditLog('PERMISSION_UPDATE', 'permission'),
    async (req, res) => {
        try {
            const { id } = req.params;
            const permission = await permissionRepository.findById(id);

            if (!permission) {
                return res.status(404).json({ success: false, error: 'Permission not found' });
            }

            const updated = await permissionRepository.updateById(id, req.body);
            res.json({ success: true, data: updated });
        } catch (error) {
            console.error('Update permission error:', error);
            res.status(500).json({ success: false, error: 'Failed to update permission' });
        }
    }
);

/**
 * Delete permission (superadmin only)
 * DELETE /api/rbac/permissions/:id
 */
router.delete('/permissions/:id',
    requireSuperAdmin,
    [param('id').isInt()],
    validate,
    auditLog('PERMISSION_DELETE', 'permission'),
    async (req, res) => {
        try {
            const { id } = req.params;
            const deleted = await permissionRepository.deleteById(id);

            if (!deleted) {
                return res.status(404).json({ success: false, error: 'Permission not found' });
            }

            res.json({ success: true, message: 'Permission deleted' });
        } catch (error) {
            console.error('Delete permission error:', error);
            res.status(500).json({ success: false, error: 'Failed to delete permission' });
        }
    }
);

// ============================================================
// GROUPS ENDPOINTS
// ============================================================

/**
 * Get all groups
 * GET /api/rbac/groups
 */
router.get('/groups',
    requirePermission('rbac:read'),
    async (req, res) => {
        try {
            const { rows: groups, count } = await groupRepository.findAll({}, {
                includePermissions: true,
                includeUsers: true
            });
            res.json({ success: true, data: groups, total: count });
        } catch (error) {
            console.error('Get groups error:', error);
            res.status(500).json({ success: false, error: 'Failed to get groups' });
        }
    }
);

/**
 * Get single group
 * GET /api/rbac/groups/:id
 */
router.get('/groups/:id',
    requirePermission('rbac:read'),
    [param('id').isInt()],
    validate,
    async (req, res) => {
        try {
            const group = await groupRepository.findById(req.params.id, {
                includePermissions: true,
                includeUsers: true
            });

            if (!group) {
                return res.status(404).json({ success: false, error: 'Group not found' });
            }

            res.json({ success: true, data: group });
        } catch (error) {
            console.error('Get group error:', error);
            res.status(500).json({ success: false, error: 'Failed to get group' });
        }
    }
);

/**
 * Get group members
 * GET /api/rbac/groups/:id/members
 */
router.get('/groups/:id/members',
    requirePermission('rbac:read', 'workqueue:access'),
    [param('id').isInt()],
    validate,
    async (req, res) => {
        try {
            const members = await userRepository.getGroupMembers(req.params.id);
            res.json({ success: true, data: members });
        } catch (error) {
            console.error('Get group members error:', error);
            res.status(500).json({ success: false, error: 'Failed to get group members' });
        }
    }
);

/**
 * Create group
 * POST /api/rbac/groups
 */
router.post('/groups',
    requirePermission('rbac:write'),
    [
        body('name').trim().notEmpty().withMessage('Group name is required'),
        body('description').optional().trim()
    ],
    validate,
    auditLog('GROUP_CREATE', 'group'),
    async (req, res) => {
        try {
            const { name, description } = req.body;

            // Check if group exists
            const existing = await groupRepository.findByName(name);
            if (existing) {
                return res.status(400).json({ success: false, error: 'Group already exists' });
            }

            const group = await groupRepository.create({ name, description });
            res.status(201).json({ success: true, data: group });
        } catch (error) {
            console.error('Create group error:', error);
            res.status(500).json({ success: false, error: 'Failed to create group' });
        }
    }
);

/**
 * Update group
 * PUT /api/rbac/groups/:id
 */
router.put('/groups/:id',
    requirePermission('rbac:write'),
    [
        param('id').isInt(),
        body('name').optional().trim().notEmpty(),
        body('description').optional().trim()
    ],
    validate,
    auditLog('GROUP_UPDATE', 'group'),
    async (req, res) => {
        try {
            const { id } = req.params;
            const group = await groupRepository.findById(id);

            if (!group) {
                return res.status(404).json({ success: false, error: 'Group not found' });
            }

            const updated = await groupRepository.updateById(id, req.body);
            res.json({ success: true, data: updated });
        } catch (error) {
            console.error('Update group error:', error);
            res.status(500).json({ success: false, error: 'Failed to update group' });
        }
    }
);

/**
 * Delete group (superadmin only)
 * DELETE /api/rbac/groups/:id
 */
router.delete('/groups/:id',
    requireSuperAdmin,
    [param('id').isInt()],
    validate,
    auditLog('GROUP_DELETE', 'group'),
    async (req, res) => {
        try {
            const { id } = req.params;
            const deleted = await groupRepository.deleteById(id);

            if (!deleted) {
                return res.status(404).json({ success: false, error: 'Group not found' });
            }

            res.json({ success: true, message: 'Group deleted' });
        } catch (error) {
            console.error('Delete group error:', error);
            res.status(500).json({ success: false, error: 'Failed to delete group' });
        }
    }
);

// ============================================================
// GROUP PERMISSIONS MANAGEMENT
// ============================================================

/**
 * Assign permissions to group
 * POST /api/rbac/groups/:id/permissions
 */
router.post('/groups/:id/permissions',
    requirePermission('rbac:write'),
    [
        param('id').isInt(),
        body('permissionIds').isArray().withMessage('permissionIds must be an array')
    ],
    validate,
    auditLog('GROUP_PERMISSIONS_UPDATE', 'group'),
    async (req, res) => {
        try {
            const { id } = req.params;
            const { permissionIds } = req.body;

            const group = await groupRepository.addPermissions(id, permissionIds);
            res.json({ success: true, data: group });
        } catch (error) {
            console.error('Add permissions error:', error);
            res.status(500).json({ success: false, error: error.message || 'Failed to add permissions' });
        }
    }
);

/**
 * Set permissions for group (replace all)
 * PUT /api/rbac/groups/:id/permissions
 */
router.put('/groups/:id/permissions',
    requirePermission('rbac:write'),
    [
        param('id').isInt(),
        body('permissionIds').isArray().withMessage('permissionIds must be an array')
    ],
    validate,
    auditLog('GROUP_PERMISSIONS_SET', 'group'),
    async (req, res) => {
        try {
            const { id } = req.params;
            const { permissionIds } = req.body;

            const group = await groupRepository.setPermissions(id, permissionIds);
            res.json({ success: true, data: group });
        } catch (error) {
            console.error('Set permissions error:', error);
            res.status(500).json({ success: false, error: error.message || 'Failed to set permissions' });
        }
    }
);

/**
 * Remove permission from group
 * DELETE /api/rbac/groups/:id/permissions/:permissionId
 */
router.delete('/groups/:id/permissions/:permissionId',
    requirePermission('rbac:write'),
    [
        param('id').isInt(),
        param('permissionId').isInt()
    ],
    validate,
    auditLog('GROUP_PERMISSION_REMOVE', 'group'),
    async (req, res) => {
        try {
            const { id, permissionId } = req.params;
            const deleted = await groupRepository.removePermission(id, permissionId);

            if (!deleted) {
                return res.status(404).json({ success: false, error: 'Permission not assigned to group' });
            }

            res.json({ success: true, message: 'Permission removed from group' });
        } catch (error) {
            console.error('Remove permission error:', error);
            res.status(500).json({ success: false, error: 'Failed to remove permission' });
        }
    }
);

// ============================================================
// GROUP USERS MANAGEMENT
// ============================================================

/**
 * Add users to group
 * POST /api/rbac/groups/:id/users
 */
router.post('/groups/:id/users',
    requirePermission('rbac:write'),
    [
        param('id').isInt(),
        body('userIds').isArray().withMessage('userIds must be an array')
    ],
    validate,
    auditLog('GROUP_USERS_ADD', 'group'),
    async (req, res) => {
        try {
            const { id } = req.params;
            const { userIds } = req.body;

            const group = await groupRepository.addUsers(id, userIds);
            res.json({ success: true, data: group });
        } catch (error) {
            console.error('Add users error:', error);
            res.status(500).json({ success: false, error: error.message || 'Failed to add users' });
        }
    }
);

/**
 * Remove user from group
 * DELETE /api/rbac/groups/:id/users/:userId
 */
router.delete('/groups/:id/users/:userId',
    requirePermission('rbac:write'),
    [
        param('id').isInt(),
        param('userId').isInt()
    ],
    validate,
    auditLog('GROUP_USER_REMOVE', 'group'),
    async (req, res) => {
        try {
            const { id, userId } = req.params;
            const deleted = await groupRepository.removeUser(id, userId);

            if (!deleted) {
                return res.status(404).json({ success: false, error: 'User not in group' });
            }

            res.json({ success: true, message: 'User removed from group' });
        } catch (error) {
            console.error('Remove user error:', error);
            res.status(500).json({ success: false, error: 'Failed to remove user' });
        }
    }
);

// ============================================================
// USER GROUP MANAGEMENT
// ============================================================

/**
 * Set user's groups
 * PUT /api/rbac/users/:userId/groups
 */
router.put('/users/:userId/groups',
    requirePermission('rbac:write'),
    [
        param('userId').isInt(),
        body('groupIds').isArray().withMessage('groupIds must be an array')
    ],
    validate,
    auditLog('USER_GROUPS_SET', 'user'),
    async (req, res) => {
        try {
            const { userId } = req.params;
            const { groupIds } = req.body;

            const user = await userRepository.setGroups(userId, groupIds);
            res.json({ success: true, data: user });
        } catch (error) {
            console.error('Set user groups error:', error);
            res.status(500).json({ success: false, error: error.message || 'Failed to set user groups' });
        }
    }
);

/**
 * Get user's permissions
 * GET /api/rbac/users/:userId/permissions
 */
router.get('/users/:userId/permissions',
    requirePermission('rbac:read'),
    [param('userId').isInt()],
    validate,
    async (req, res) => {
        try {
            const { userId } = req.params;
            const permissions = await userRepository.getUserPermissions(userId);
            res.json({ success: true, data: permissions });
        } catch (error) {
            console.error('Get user permissions error:', error);
            res.status(500).json({ success: false, error: 'Failed to get user permissions' });
        }
    }
);

module.exports = router;
