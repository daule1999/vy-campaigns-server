/**
 * Quick Replies Routes
 * Manages reusable message templates for agents
 */

const express = require('express');
const router = express.Router();
const { QuickReply, User } = require('../../db/models/sequelize');
const { authenticate } = require('../../middleware/auth');
const { hasPermission } = require('../../middleware/rbac');
const { Op } = require('sequelize');

/**
 * GET /api/quick-replies
 * List quick replies (global + user's own)
 */
router.get('/', authenticate, async (req, res) => {
    try {
        const { category, search } = req.query;

        const where = {
            [Op.or]: [
                { isGlobal: true },
                { createdBy: req.user.id }
            ]
        };

        if (category) {
            where.category = category;
        }

        if (search) {
            where[Op.or] = [
                { title: { [Op.like]: `%${search}%` } },
                { content: { [Op.like]: `%${search}%` } }
            ];
        }

        const quickReplies = await QuickReply.findAll({
            where,
            include: [
                { model: User, as: 'creator', attributes: ['id', 'name', 'email'] }
            ],
            order: [['category', 'ASC'], ['title', 'ASC']]
        });

        res.json({
            success: true,
            data: quickReplies
        });
    } catch (error) {
        console.error('Error fetching quick replies:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching quick replies'
        });
    }
});

/**
 * GET /api/quick-replies/categories
 * Get list of categories
 */
router.get('/categories', authenticate, async (req, res) => {
    try {
        const categories = await QuickReply.findAll({
            attributes: ['category'],
            where: {
                category: { [Op.ne]: null }
            },
            group: ['category']
        });

        res.json({
            success: true,
            data: categories.map(c => c.category)
        });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching categories'
        });
    }
});

/**
 * POST /api/quick-replies
 * Create quick reply
 */
router.post('/', authenticate, async (req, res) => {
    try {
        const { title, content, category, isGlobal } = req.body;

        if (!title || !content) {
            return res.status(400).json({
                success: false,
                message: 'Title and content are required'
            });
        }

        // Only admins can create global quick replies
        const canCreateGlobal = isGlobal && req.user.permissions?.includes('settings.manage_tags');

        const quickReply = await QuickReply.create({
            title,
            content,
            category,
            isGlobal: canCreateGlobal || false,
            createdBy: req.user.id
        });

        res.status(201).json({
            success: true,
            message: 'Quick reply created',
            data: quickReply
        });
    } catch (error) {
        console.error('Error creating quick reply:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating quick reply'
        });
    }
});

/**
 * PUT /api/quick-replies/:id
 * Update quick reply
 */
router.put('/:id', authenticate, async (req, res) => {
    try {
        const { title, content, category, isGlobal } = req.body;

        const quickReply = await QuickReply.findByPk(req.params.id);
        if (!quickReply) {
            return res.status(404).json({
                success: false,
                message: 'Quick reply not found'
            });
        }

        // Only owner or admin can edit
        if (quickReply.createdBy !== req.user.id && !req.user.permissions?.includes('settings.manage_tags')) {
            return res.status(403).json({
                success: false,
                message: 'You can only edit your own quick replies'
            });
        }

        await quickReply.update({
            title: title || quickReply.title,
            content: content || quickReply.content,
            category: category !== undefined ? category : quickReply.category,
            isGlobal: isGlobal !== undefined ? isGlobal : quickReply.isGlobal
        });

        res.json({
            success: true,
            message: 'Quick reply updated',
            data: quickReply
        });
    } catch (error) {
        console.error('Error updating quick reply:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating quick reply'
        });
    }
});

/**
 * DELETE /api/quick-replies/:id
 * Delete quick reply
 */
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const quickReply = await QuickReply.findByPk(req.params.id);
        if (!quickReply) {
            return res.status(404).json({
                success: false,
                message: 'Quick reply not found'
            });
        }

        // Only owner or admin can delete
        if (quickReply.createdBy !== req.user.id && !req.user.permissions?.includes('settings.manage_tags')) {
            return res.status(403).json({
                success: false,
                message: 'You can only delete your own quick replies'
            });
        }

        await quickReply.destroy();

        res.json({
            success: true,
            message: 'Quick reply deleted'
        });
    } catch (error) {
        console.error('Error deleting quick reply:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting quick reply'
        });
    }
});

module.exports = router;
