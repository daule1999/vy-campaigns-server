const express = require('express');
const { body, param } = require('express-validator');
const { userRepository, groupRepository } = require('../../db/repositories');
const { authenticate, requirePermission, validate, auditLog } = require('../../middleware');

const router = express.Router();

// All routes require authentication and admin:users permission
router.use(authenticate);
router.use(requirePermission('admin:users'));

/**
 * Get all users (filtered by hierarchy - you only see users you can manage)
 * GET /api/admin/users
 */
router.get('/users', async (req, res) => {
    try {
        // Use hierarchy-based filtering - manager sees only lower-ranked users
        const { rows: users, count } = await userRepository.getManagedUsers(req.user.id, {
            limit: 100,
            includeGroups: true
        });
        // Remove sensitive fields and add level info
        const safeUsers = users.map(u => ({
            id: u.id,
            username: u.username,
            email: u.email,
            name: u.name,
            isSuperAdmin: u.isSuperAdmin,
            isActive: u.isActive,
            groups: (u.groups || []).map(g => ({ id: g.id, name: g.name, level: g.level })),
            createdAt: u.createdAt
        }));
        res.json({ success: true, data: safeUsers, total: count });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ success: false, error: 'Failed to get users' });
    }
});

/**
 * Create new user
 * POST /api/admin/users
 */
router.post('/users',
    [
        body('username').notEmpty().trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
        body('password').notEmpty().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
        body('name').notEmpty().trim().withMessage('Name is required'),
        body('email').optional({ checkFalsy: true }).isEmail().withMessage('Invalid email'),
    ],
    validate,
    auditLog('USER_CREATE', 'user'),
    async (req, res) => {
        try {
            const { username, password, name, email, groupIds } = req.body;

            // Check if username already exists
            const existing = await userRepository.findByUsername(username);
            if (existing) {
                return res.status(400).json({ success: false, error: 'Username already exists' });
            }

            // Check email if provided
            if (email) {
                const existingEmail = await userRepository.findByEmail(email);
                if (existingEmail) {
                    return res.status(400).json({ success: false, error: 'Email already exists' });
                }
            }

            // Create user
            const passwordHash = await userRepository.hashPassword(password);
            const userData = {
                username,
                passwordHash,
                name,
                email: email && email.trim() ? email.trim() : null,
                isActive: true, // New users created by admin are active by default
                isSuperAdmin: false,
            };
            const newUser = await userRepository.create(userData);

            // Assign groups if provided
            if (groupIds && groupIds.length > 0) {
                await userRepository.setUserGroups(newUser.id, groupIds);
            }

            // Fetch user with groups
            const user = await userRepository.findById(newUser.id, { includeGroups: true });

            res.status(201).json({
                success: true,
                data: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    name: user.name,
                    isActive: user.isActive,
                    groups: (user.groups || []).map(g => ({ id: g.id, name: g.name })),
                }
            });
        } catch (error) {
            console.error('Create user error:', error);
            res.status(500).json({ success: false, error: 'Failed to create user' });
        }
    }
);

/**
 * Activate user
 * POST /api/admin/users/:id/activate
 */
router.post('/users/:id/activate',
    [param('id').notEmpty()],
    validate,
    auditLog('USER_ACTIVATE', 'user'),
    async (req, res) => {
        try {
            const user = await userRepository.findById(req.params.id, { includeGroups: true });
            if (!user) {
                return res.status(404).json({ success: false, error: 'User not found' });
            }

            // Hierarchy check - can only activate juniors
            const myLevel = await userRepository.getUserLevel(req.user.id);
            const targetLevel = await userRepository.getUserLevel(req.params.id);
            if (myLevel >= targetLevel && myLevel !== 0) {
                return res.status(403).json({ success: false, error: 'Cannot manage users at your level or above' });
            }

            await userRepository.updateById(req.params.id, { isActive: true });
            res.json({ success: true, message: 'User activated' });
        } catch (error) {
            console.error('Activate user error:', error);
            res.status(500).json({ success: false, error: 'Failed to activate user' });
        }
    }
);

/**
 * Deactivate user
 * POST /api/admin/users/:id/deactivate
 */
router.post('/users/:id/deactivate',
    [param('id').notEmpty()],
    validate,
    auditLog('USER_DEACTIVATE', 'user'),
    async (req, res) => {
        try {
            const user = await userRepository.findById(req.params.id, { includeGroups: true });
            if (!user) {
                return res.status(404).json({ success: false, error: 'User not found' });
            }

            // Prevent self-deactivation
            if (user.id.toString() === req.user.id.toString()) {
                return res.status(400).json({ success: false, error: 'Cannot deactivate yourself' });
            }

            // Prevent deactivating superadmin
            if (user.isSuperAdmin) {
                return res.status(400).json({ success: false, error: 'Cannot deactivate superadmin' });
            }

            // Hierarchy check - can only deactivate juniors
            const myLevel = await userRepository.getUserLevel(req.user.id);
            const targetLevel = await userRepository.getUserLevel(req.params.id);
            if (myLevel >= targetLevel && myLevel !== 0) {
                return res.status(403).json({ success: false, error: 'Cannot manage users at your level or above' });
            }

            await userRepository.updateById(req.params.id, { isActive: false });
            res.json({ success: true, message: 'User deactivated' });
        } catch (error) {
            console.error('Deactivate user error:', error);
            res.status(500).json({ success: false, error: 'Failed to deactivate user' });
        }
    }
);

/**
 * Update user groups
 * PUT /api/admin/users/:id/groups
 */
router.put('/users/:id/groups',
    [
        param('id').notEmpty(),
        body('groupIds').isArray()
    ],
    validate,
    auditLog('USER_GROUPS_UPDATE', 'user'),
    async (req, res) => {
        try {
            const user = await userRepository.findById(req.params.id);
            if (!user) {
                return res.status(404).json({ success: false, error: 'User not found' });
            }

            const updated = await userRepository.setGroups(req.params.id, req.body.groupIds);
            res.json({ success: true, data: updated });
        } catch (error) {
            console.error('Update groups error:', error);
            res.status(500).json({ success: false, error: 'Failed to update user groups' });
        }
    }
);

/**
 * Generate API key for user
 * POST /api/admin/users/:id/api-key
 */
router.post('/users/:id/api-key',
    [param('id').notEmpty()],
    validate,
    auditLog('USER_API_KEY_GENERATE', 'user'),
    async (req, res) => {
        try {
            const user = await userRepository.findById(req.params.id);
            if (!user) {
                return res.status(404).json({ success: false, error: 'User not found' });
            }

            const apiKey = await userRepository.generateApiKey();
            await userRepository.updateById(req.params.id, { apiKey });

            res.json({ success: true, data: { apiKey } });
        } catch (error) {
            console.error('Generate API key error:', error);
            res.status(500).json({ success: false, error: 'Failed to generate API key' });
        }
    }
);

/**
 * Delete user
 * DELETE /api/admin/users/:id
 */
router.delete('/users/:id',
    [param('id').notEmpty()],
    validate,
    auditLog('USER_DELETE', 'user'),
    async (req, res) => {
        try {
            const user = await userRepository.findById(req.params.id);
            if (!user) {
                return res.status(404).json({ success: false, error: 'User not found' });
            }

            // Prevent self-deletion
            if (user.id.toString() === req.user.id.toString()) {
                return res.status(400).json({ success: false, error: 'Cannot delete yourself' });
            }

            // Prevent deleting superadmin
            if (user.isSuperAdmin) {
                return res.status(400).json({ success: false, error: 'Cannot delete superadmin' });
            }

            // Deactivate instead of hard delete
            await userRepository.updateById(req.params.id, { isActive: false });
            res.json({ success: true, message: 'User deleted' });
        } catch (error) {
            console.error('Delete user error:', error);
            res.status(500).json({ success: false, error: 'Failed to delete user' });
        }
    }
);

/**
 * Get all groups (for dropdown)
 * GET /api/admin/groups
 */
router.get('/groups', async (req, res) => {
    try {
        const { rows: groups } = await groupRepository.findAll({}, { limit: 100 });
        res.json({ success: true, data: groups });
    } catch (error) {
        console.error('Get groups error:', error);
        res.status(500).json({ success: false, error: 'Failed to get groups' });
    }
});

/**
 * Reset user password (Superadmin only)
 * PUT /api/admin/users/:id/reset-password
 */
router.put('/users/:id/reset-password',
    [
        param('id').notEmpty(),
        body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    ],
    validate,
    auditLog('USER_PASSWORD_RESET', 'user'),
    async (req, res) => {
        try {
            // Only superadmin can reset passwords
            if (!req.user.isSuperAdmin) {
                return res.status(403).json({ success: false, error: 'Only superadmin can reset passwords' });
            }

            const user = await userRepository.findById(req.params.id);
            if (!user) {
                return res.status(404).json({ success: false, error: 'User not found' });
            }

            const { newPassword } = req.body;
            const passwordHash = await userRepository.hashPassword(newPassword);
            await userRepository.updateById(req.params.id, { passwordHash });

            res.json({ success: true, message: 'Password reset successfully' });
        } catch (error) {
            console.error('Reset password error:', error);
            res.status(500).json({ success: false, error: 'Failed to reset password' });
        }
    }
);

module.exports = router;
