/**
 * Inbox Settings Routes
 * Manages automation settings (welcome message, OOO, working hours)
 */

const express = require('express');
const router = express.Router();
const { InboxSetting } = require('../../db/models/sequelize');
const { authenticate } = require('../../middleware/auth');
const { hasPermission } = require('../../middleware/rbac');

/**
 * GET /api/inbox-settings
 * Get current inbox settings
 */
router.get('/', authenticate, async (req, res) => {
    try {
        let settings = await InboxSetting.findOne({
            order: [['createdAt', 'DESC']]
        });

        // Create default if doesn't exist
        if (!settings) {
            settings = await InboxSetting.create({
                createdBy: req.user.id
            });
        }

        res.json({
            success: true,
            data: settings
        });
    } catch (error) {
        console.error('Error fetching inbox settings:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching inbox settings'
        });
    }
});

/**
 * PUT /api/inbox-settings/welcome-message
 * Update welcome message settings
 */
router.put('/welcome-message', authenticate, hasPermission('automation.manage_welcome_message'), async (req, res) => {
    try {
        const { enabled, text } = req.body;

        let settings = await InboxSetting.findOne({ order: [['createdAt', 'DESC']] });
        if (!settings) {
            settings = await InboxSetting.create({ createdBy: req.user.id });
        }

        await settings.update({
            welcomeMessageEnabled: enabled !== undefined ? enabled : settings.welcomeMessageEnabled,
            welcomeMessageText: text !== undefined ? text : settings.welcomeMessageText
        });

        res.json({
            success: true,
            message: 'Welcome message settings updated',
            data: settings
        });
    } catch (error) {
        console.error('Error updating welcome message:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating welcome message'
        });
    }
});

/**
 * PUT /api/inbox-settings/out-of-office
 * Update out of office settings
 */
router.put('/out-of-office', authenticate, hasPermission('automation.manage_ooo_message'), async (req, res) => {
    try {
        const { enabled, message, schedule } = req.body;

        let settings = await InboxSetting.findOne({ order: [['createdAt', 'DESC']] });
        if (!settings) {
            settings = await InboxSetting.create({ createdBy: req.user.id });
        }

        await settings.update({
            oooEnabled: enabled !== undefined ? enabled : settings.oooEnabled,
            oooMessage: message !== undefined ? message : settings.oooMessage,
            oooSchedule: schedule !== undefined ? schedule : settings.oooSchedule
        });

        res.json({
            success: true,
            message: 'Out of office settings updated',
            data: settings
        });
    } catch (error) {
        console.error('Error updating OOO settings:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating OOO settings'
        });
    }
});

/**
 * PUT /api/inbox-settings/delayed-response
 * Update delayed response settings
 */
router.put('/delayed-response', authenticate, hasPermission('automation.manage_delayed_message'), async (req, res) => {
    try {
        const { enabled, time, message } = req.body;

        let settings = await InboxSetting.findOne({ order: [['createdAt', 'DESC']] });
        if (!settings) {
            settings = await InboxSetting.create({ createdBy: req.user.id });
        }

        await settings.update({
            delayedResponseEnabled: enabled !== undefined ? enabled : settings.delayedResponseEnabled,
            delayedResponseTime: time !== undefined ? time : settings.delayedResponseTime,
            delayedResponseMessage: message !== undefined ? message : settings.delayedResponseMessage
        });

        res.json({
            success: true,
            message: 'Delayed response settings updated',
            data: settings
        });
    } catch (error) {
        console.error('Error updating delayed response:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating delayed response'
        });
    }
});

/**
 * PUT /api/inbox-settings/working-hours
 * Update working hours configuration
 */
router.put('/working-hours', authenticate, hasPermission('automation.manage_welcome_message'), async (req, res) => {
    try {
        const { workingHours } = req.body;

        if (!workingHours) {
            return res.status(400).json({
                success: false,
                message: 'workingHours configuration is required'
            });
        }

        let settings = await InboxSetting.findOne({ order: [['createdAt', 'DESC']] });
        if (!settings) {
            settings = await InboxSetting.create({ createdBy: req.user.id });
        }

        await settings.update({ workingHours });

        res.json({
            success: true,
            message: 'Working hours updated',
            data: settings
        });
    } catch (error) {
        console.error('Error updating working hours:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating working hours'
        });
    }
});

/**
 * PUT /api/inbox-settings/auto-assignment
 * Update auto-assignment settings
 */
router.put('/auto-assignment', authenticate, hasPermission('inbox.assign'), async (req, res) => {
    try {
        const { enabled, type } = req.body;

        let settings = await InboxSetting.findOne({ order: [['createdAt', 'DESC']] });
        if (!settings) {
            settings = await InboxSetting.create({ createdBy: req.user.id });
        }

        await settings.update({
            autoAssignmentEnabled: enabled !== undefined ? enabled : settings.autoAssignmentEnabled,
            autoAssignmentType: type !== undefined ? type : settings.autoAssignmentType
        });

        res.json({
            success: true,
            message: 'Auto-assignment settings updated',
            data: settings
        });
    } catch (error) {
        console.error('Error updating auto-assignment:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating auto-assignment'
        });
    }
});

/**
 * POST /api/inbox-settings/test
 * Test automation messages
 */
router.post('/test', authenticate, hasPermission('automation.view_workflows'), async (req, res) => {
    try {
        const { type, phoneNumber } = req.body;

        if (!type || !phoneNumber) {
            return res.status(400).json({
                success: false,
                message: 'type and phoneNumber are required'
            });
        }

        const settings = await InboxSetting.findOne({ order: [['createdAt', 'DESC']] });
        if (!settings) {
            return res.status(404).json({
                success: false,
                message: 'No inbox settings found'
            });
        }

        let message;
        switch (type) {
            case 'welcome':
                message = settings.welcomeMessageText;
                break;
            case 'ooo':
                message = settings.oooMessage;
                break;
            case 'delayed':
                message = settings.delayedResponseMessage;
                break;
            default:
                return res.status(400).json({
                    success: false,
                    message: 'Invalid message type'
                });
        }

        if (!message) {
            return res.status(400).json({
                success: false,
                message: `${type} message not configured`
            });
        }

        // TODO: Send test message via WhatsApp
        // const whatsapp = require('../../services/whatsapp');
        // await whatsapp.sendMessage(phoneNumber, { text: message });

        res.json({
            success: true,
            message: 'Test message sent',
            data: { type, message, phoneNumber }
        });
    } catch (error) {
        console.error('Error sending test message:', error);
        res.status(500).json({
            success: false,
            message: 'Error sending test message'
        });
    }
});

module.exports = router;
