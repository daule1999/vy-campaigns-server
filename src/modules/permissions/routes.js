/**
 * Permission Management Routes
 */

const express = require('express');
const router = express.Router();
const { Permission } = require('../../db/models/sequelize');
const { authenticate } = require('../../middleware/auth');
const { hasPermission } = require('../../middleware/rbac');

/**
 * GET /api/permissions
 * List all permissions (grouped by feature)
 */
router.get('/', authenticate, hasPermission('agent.view'), async (req, res) => {
    try {
        const permissions = await Permission.findAll({
            order: [['feature', 'ASC'], ['name', 'ASC']]
        });

        // Group by feature
        const groupedPermissions = permissions.reduce((acc, perm) => {
            const feature = perm.feature;
            if (!acc[feature]) {
                acc[feature] = [];
            }
            acc[feature].push(perm);
            return acc;
        }, {});

        res.json({
            success: true,
            data: {
                all: permissions,
                grouped: groupedPermissions
            }
        });
    } catch (error) {
        console.error('Error fetching permissions:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching permissions'
        });
    }
});

/**
 * GET /api/permissions/features
 * Get list of all features
 */
router.get('/features', authenticate, hasPermission('agent.view'), async (req, res) => {
    try {
        const features = await Permission.findAll({
            attributes: ['feature'],
            group: ['feature'],
            order: [['feature', 'ASC']]
        });

        res.json({
            success: true,
            data: features.map(f => f.feature)
        });
    } catch (error) {
        console.error('Error fetching features:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching features'
        });
    }
});

/**
 * GET /api/permissions/feature/:feature
 * Get permissions for a specific feature
 */
router.get('/feature/:feature', authenticate, hasPermission('agent.view'), async (req, res) => {
    try {
        const permissions = await Permission.findAll({
            where: { feature: req.params.feature },
            order: [['name', 'ASC']]
        });

        res.json({
            success: true,
            data: permissions
        });
    } catch (error) {
        console.error('Error fetching permissions:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching permissions'
        });
    }
});

module.exports = router;
