/**
 * Custom Contact Fields Routes
 * Manages custom field definitions for contacts
 */

const express = require('express');
const router = express.Router();
const { ContactField, User } = require('../../db/models/sequelize');
const { authenticate } = require('../../middleware/auth');
const { hasPermission } = require('../../middleware/rbac');
const { Op } = require('sequelize');

/**
 * GET /api/contact-fields
 * List all contact fields
 */
router.get('/', authenticate, hasPermission('contact.view_all'), async (req, res) => {
    try {
        const { isActive } = req.query;

        const where = {};
        if (isActive !== undefined) {
            where.isActive = isActive === 'true';
        }

        const fields = await ContactField.findAll({
            where,
            include: [
                { model: User, as: 'creator', attributes: ['id', 'name', 'email'] }
            ],
            order: [['displayOrder', 'ASC'], ['createdAt', 'ASC']]
        });

        res.json({
            success: true,
            data: fields
        });
    } catch (error) {
        console.error('Error fetching contact fields:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching contact fields'
        });
    }
});

/**
 * POST /api/contact-fields
 * Create new custom field
 */
router.post('/', authenticate, hasPermission('settings.manage_tags'), async (req, res) => {
    try {
        const {
            name, label, fieldType, options, defaultValue,
            isRequired, displayOrder
        } = req.body;

        if (!name || !label || !fieldType) {
            return res.status(400).json({
                success: false,
                message: 'name, label, and fieldType are required'
            });
        }

        // Check for duplicate field name
        const existing = await ContactField.findOne({ where: { name } });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'Field with this name already exists'
            });
        }

        const field = await ContactField.create({
            name,
            label,
            fieldType,
            options,
            defaultValue,
            isRequired: isRequired || false,
            displayOrder: displayOrder || 0,
            createdBy: req.user.id
        });

        res.status(201).json({
            success: true,
            message: 'Custom field created',
            data: field
        });
    } catch (error) {
        console.error('Error creating contact field:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating contact field'
        });
    }
});

/**
 * PUT /api/contact-fields/:id
 * Update custom field
 */
router.put('/:id', authenticate, hasPermission('settings.manage_tags'), async (req, res) => {
    try {
        const field = await ContactField.findByPk(req.params.id);
        if (!field) {
            return res.status(404).json({
                success: false,
                message: 'Contact field not found'
            });
        }

        const {
            label, options, defaultValue, isRequired, isActive, displayOrder
        } = req.body;

        await field.update({
            label: label !== undefined ? label : field.label,
            options: options !== undefined ? options : field.options,
            defaultValue: defaultValue !== undefined ? defaultValue : field.defaultValue,
            isRequired: isRequired !== undefined ? isRequired : field.isRequired,
            isActive: isActive !== undefined ? isActive : field.isActive,
            displayOrder: displayOrder !== undefined ? displayOrder : field.displayOrder
        });

        res.json({
            success: true,
            message: 'Custom field updated',
            data: field
        });
    } catch (error) {
        console.error('Error updating contact field:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating contact field'
        });
    }
});

/**
 * DELETE /api/contact-fields/:id
 * Delete custom field
 */
router.delete('/:id', authenticate, hasPermission('settings.manage_tags'), async (req, res) => {
    try {
        const field = await ContactField.findByPk(req.params.id);
        if (!field) {
            return res.status(404).json({
                success: false,
                message: 'Contact field not found'
            });
        }

        await field.destroy();

        res.json({
            success: true,
            message: 'Custom field deleted'
        });
    } catch (error) {
        console.error('Error deleting contact field:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting contact field'
        });
    }
});

module.exports = router;
