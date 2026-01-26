/**
 * Tags Routes
 * Manages tags for contact organization
 */

const express = require('express');
const router = express.Router();
const { Tag, Contact, ContactTag, User } = require('../../db/models/sequelize');
const { authenticate } = require('../../middleware/auth');
const { hasPermission } = require('../../middleware/rbac');
const { Op } = require('sequelize');

/**
 * GET /api/tags
 * List all tags
 */
router.get('/', authenticate, async (req, res) => {
    try {
        const { category, search } = req.query;

        const where = {};
        if (category) {
            where.category = category;
        }
        if (search) {
            where.name = { [Op.like]: `%${search}%` };
        }

        const tags = await Tag.findAll({
            where,
            order: [['category', 'ASC'], ['name', 'ASC']]
        });

        res.json({
            success: true,
            data: tags
        });
    } catch (error) {
        console.error('Error fetching tags:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching tags'
        });
    }
});

/**
 * GET /api/tags/categories
 * Get list of tag categories
 */
router.get('/categories', authenticate, async (req, res) => {
    try {
        const categories = await Tag.findAll({
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
 * POST /api/tags
 * Create new tag
 */
router.post('/', authenticate, hasPermission('settings.manage_tags'), async (req, res) => {
    try {
        const { name, color, description, category } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Tag name is required'
            });
        }

        // Check for duplicate
        const existing = await Tag.findOne({ where: { name } });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'Tag with this name already exists'
            });
        }

        const tag = await Tag.create({
            name,
            color: color || '#3B82F6',
            description,
            category,
            createdBy: req.user.id
        });

        res.status(201).json({
            success: true,
            message: 'Tag created',
            data: tag
        });
    } catch (error) {
        console.error('Error creating tag:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating tag'
        });
    }
});

/**
 * PUT /api/tags/:id
 * Update tag
 */
router.put('/:id', authenticate, hasPermission('settings.manage_tags'), async (req, res) => {
    try {
        const tag = await Tag.findByPk(req.params.id);
        if (!tag) {
            return res.status(404).json({
                success: false,
                message: 'Tag not found'
            });
        }

        if (tag.isSystem) {
            return res.status(403).json({
                success: false,
                message: 'System tags cannot be modified'
            });
        }

        const { name, color, description, category } = req.body;

        await tag.update({
            name: name || tag.name,
            color: color || tag.color,
            description: description !== undefined ? description : tag.description,
            category: category !== undefined ? category : tag.category
        });

        res.json({
            success: true,
            message: 'Tag updated',
            data: tag
        });
    } catch (error) {
        console.error('Error updating tag:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating tag'
        });
    }
});

/**
 * DELETE /api/tags/:id
 * Delete tag
 */
router.delete('/:id', authenticate, hasPermission('settings.manage_tags'), async (req, res) => {
    try {
        const tag = await Tag.findByPk(req.params.id);
        if (!tag) {
            return res.status(404).json({
                success: false,
                message: 'Tag not found'
            });
        }

        if (tag.isSystem) {
            return res.status(403).json({
                success: false,
                message: 'System tags cannot be deleted'
            });
        }

        await tag.destroy();

        res.json({
            success: true,
            message: 'Tag deleted'
        });
    } catch (error) {
        console.error('Error deleting tag:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting tag'
        });
    }
});

/**
 * POST /api/tags/:id/contacts
 * Add tag to multiple contacts
 */
router.post('/:id/contacts', authenticate, hasPermission('contact.manage_tags'), async (req, res) => {
    try {
        const { contactIds } = req.body;

        if (!Array.isArray(contactIds) || contactIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'contactIds array is required'
            });
        }

        const tag = await Tag.findByPk(req.params.id);
        if (!tag) {
            return res.status(404).json({
                success: false,
                message: 'Tag not found'
            });
        }

        let added = 0;
        for (const contactId of contactIds) {
            try {
                await ContactTag.findOrCreate({
                    where: { contactId, tagId: tag.id },
                    defaults: { addedBy: req.user.id }
                });
                added++;
            } catch (e) {
                console.error(`Failed to add tag to contact ${contactId}:`, e);
            }
        }

        res.json({
            success: true,
            message: `Tag added to ${added} contacts`,
            data: { added }
        });
    } catch (error) {
        console.error('Error adding tag to contacts:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding tag to contacts'
        });
    }
});

/**
 * DELETE /api/tags/:id/contacts/:contactId
 * Remove tag from contact
 */
router.delete('/:id/contacts/:contactId', authenticate, hasPermission('contact.manage_tags'), async (req, res) => {
    try {
        const deleted = await ContactTag.destroy({
            where: {
                tagId: req.params.id,
                contactId: req.params.contactId
            }
        });

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'Tag association not found'
            });
        }

        res.json({
            success: true,
            message: 'Tag removed from contact'
        });
    } catch (error) {
        console.error('Error removing tag from contact:', error);
        res.status(500).json({
            success: false,
            message: 'Error removing tag from contact'
        });
    }
});

module.exports = router;
