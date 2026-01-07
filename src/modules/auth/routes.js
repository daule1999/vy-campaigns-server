const express = require('express');
const { body } = require('express-validator');
const jwt = require('jsonwebtoken');
const config = require('../../config');
const { userRepository, permissionRepository } = require('../../db/repositories');
const { validate, authenticate, auditLog } = require('../../middleware');

const router = express.Router();

/**
 * Register new user
 * POST /api/auth/register
 */
router.post('/register',
    [
        body('username').trim().notEmpty().withMessage('Username is required')
            .isLength({ min: 3, max: 50 }).withMessage('Username must be 3-50 characters'),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
        body('name').trim().notEmpty().withMessage('Name is required'),
        body('email').optional({ checkFalsy: true }).isEmail().normalizeEmail().withMessage('Valid email required'),
    ],
    validate,
    auditLog('USER_REGISTER', 'user'),
    async (req, res) => {
        try {
            const { username, password, name, email } = req.body;

            // Check if username exists
            const existingUsername = await userRepository.findByUsername(username);
            if (existingUsername) {
                return res.status(400).json({
                    success: false,
                    error: 'Username already taken',
                    code: 'USERNAME_EXISTS'
                });
            }

            // Check if email exists (if provided)
            if (email) {
                const existingEmail = await userRepository.findByEmail(email);
                if (existingEmail) {
                    return res.status(400).json({
                        success: false,
                        error: 'Email already registered',
                        code: 'EMAIL_EXISTS'
                    });
                }
            }

            // Hash password
            const passwordHash = await userRepository.hashPassword(password);

            // Create user (first user is superadmin and active, others inactive)
            const userCount = await userRepository.count();
            const isFirstUser = userCount === 0;

            const user = await userRepository.create({
                username,
                email: (email && email.trim()) ? email.trim() : null,
                passwordHash,
                name,
                isSuperAdmin: isFirstUser,
                isActive: isFirstUser  // Only first user (superadmin) is active
            });

            // Generate tokens
            const tokens = generateTokens(user.id, user.username);

            // Save refresh token
            await userRepository.updateById(user.id, { refreshToken: tokens.refreshToken });

            // If not first user, don't give tokens (account pending activation)
            if (!isFirstUser) {
                return res.status(201).json({
                    success: true,
                    message: 'Registration successful. Your account is pending admin approval.',
                    data: {
                        user: {
                            id: user.id,
                            username: user.username,
                            name: user.name,
                            isActive: false
                        }
                    }
                });
            }

            // Get permissions for response
            const permissions = await userRepository.getUserPermissions(user.id);

            res.status(201).json({
                success: true,
                data: {
                    user: {
                        id: user.id,
                        username: user.username,
                        email: user.email,
                        name: user.name,
                        isSuperAdmin: user.isSuperAdmin,
                        isActive: user.isActive,
                        permissions
                    },
                    ...tokens
                }
            });
        } catch (error) {
            console.error('Register error:', error);
            res.status(500).json({ success: false, error: 'Registration failed' });
        }
    }
);

/**
 * Login
 * POST /api/auth/login
 */
router.post('/login',
    [
        body('username').trim().notEmpty().withMessage('Username is required'),
        body('password').notEmpty().withMessage('Password is required'),
    ],
    validate,
    auditLog('USER_LOGIN', 'user'),
    async (req, res) => {
        try {
            const { username, password } = req.body;

            // Get user with raw model for password check
            const userData = await userRepository.findByUsername(username, {
                includeGroups: true,
                includePermissions: true
            });

            if (!userData) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid credentials',
                    code: 'INVALID_CREDENTIALS'
                });
            }

            // Verify password using raw model instance
            const validPassword = await userData._raw.checkPassword(password);
            if (!validPassword) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid credentials',
                    code: 'INVALID_CREDENTIALS'
                });
            }

            // Check if user is active
            if (userData.isActive === false) {
                return res.status(403).json({
                    success: false,
                    error: 'Your account is inactive. Please contact admin for activation.',
                    code: 'ACCOUNT_INACTIVE'
                });
            }

            // Generate tokens
            const tokens = generateTokens(userData.id, userData.username);

            // Save refresh token
            await userRepository.updateById(userData.id, { refreshToken: tokens.refreshToken });

            // Get permissions
            const permissions = await userRepository.getUserPermissions(userData.id);

            res.json({
                success: true,
                data: {
                    user: {
                        id: userData.id,
                        username: userData.username,
                        email: userData.email,
                        name: userData.name,
                        isSuperAdmin: userData.isSuperAdmin,
                        isActive: userData.isActive,
                        groups: (userData.groups || []).map(g => ({ id: g.id, name: g.name })),
                        permissions
                    },
                    ...tokens
                }
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ success: false, error: 'Login failed' });
        }
    }
);

/**
 * Refresh access token
 * POST /api/auth/refresh
 */
router.post('/refresh',
    [body('refreshToken').notEmpty()],
    validate,
    async (req, res) => {
        try {
            const { refreshToken } = req.body;

            // Verify refresh token
            const decoded = jwt.verify(refreshToken, config.jwt.secret);

            // Check if token matches stored token
            const user = await userRepository.findOne({
                refreshToken: refreshToken
            }, { includeGroups: true, includePermissions: true });

            if (!user || user.id.toString() !== decoded.userId.toString()) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid refresh token',
                    code: 'INVALID_REFRESH_TOKEN'
                });
            }

            // Generate new tokens
            const tokens = generateTokens(user.id, user.username);

            // Save new refresh token
            await userRepository.updateById(user.id, { refreshToken: tokens.refreshToken });

            res.json({
                success: true,
                data: tokens
            });
        } catch (error) {
            res.status(401).json({
                success: false,
                error: 'Invalid refresh token',
                code: 'INVALID_REFRESH_TOKEN'
            });
        }
    }
);

/**
 * Get current user
 * GET /api/auth/me
 */
router.get('/me', authenticate, async (req, res) => {
    const permissions = await userRepository.getUserPermissions(req.user.id);
    res.json({
        success: true,
        data: {
            ...req.user,
            permissions
        }
    });
});

/**
 * Logout
 * POST /api/auth/logout
 */
router.post('/logout', authenticate, auditLog('USER_LOGOUT', 'user'), async (req, res) => {
    try {
        await userRepository.updateById(req.user.id, { refreshToken: null });
        res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Logout failed' });
    }
});

/**
 * Generate JWT tokens
 */
function generateTokens(userId, username) {
    const accessToken = jwt.sign(
        { userId, username },
        config.jwt.secret,
        { expiresIn: config.jwt.accessExpiry }
    );

    const refreshToken = jwt.sign(
        { userId, username, type: 'refresh' },
        config.jwt.secret,
        { expiresIn: config.jwt.refreshExpiry }
    );

    return { accessToken, refreshToken };
}

module.exports = router;
