const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { Event, EventDefinition, Contact, sequelize } = require('../../db/models/sequelize');
const { authenticate } = require('../../middleware/auth');
const { hasPermission } = require('../../middleware/rbac');

/**
 * @route   POST /api/events/track
 * @desc    Track a new event (used by webhooks and internal systems)
 * @access  Public/Webhook
 */
router.post('/track', async (req, res) => {
    try {
        const {
            contactId,
            eventType,
            eventName,
            source,
            sourceId,
            metadata = {},
            traits = {},
            sessionId,
            timestamp,
        } = req.body;

        const event = await Event.create({
            contactId,
            eventType,
            eventName,
            source,
            sourceId,
            metadata,
            traits,
            sessionId,
            timestamp: timestamp || new Date(),
        });

        res.status(201).json({ success: true, data: event });
    } catch (error) {
        console.error('Error tracking event:', error);
        res.status(500).json({ message: 'Failed to track event' });
    }
});

/**
 * @route   GET /api/events/button-clicks/analytics
 * @desc    Get button click analytics with aggregated metrics
 * @access  Private (analytics.view_events)
 */
router.get('/button-clicks/analytics', authenticate, hasPermission('analytics.view_events'), async (req, res) => {
    try {
        const { campaignId, workflowId, startDate, endDate } = req.query;

        const where = {
            eventType: 'button_click',
        };

        if (campaignId) {
            where.source = 'campaign';
            where.sourceId = campaignId;
        }

        if (workflowId) {
            where.source = 'workflow';
            where.sourceId = workflowId;
        }

        if (startDate || endDate) {
            where.timestamp = {};
            if (startDate) where.timestamp[Op.gte] = new Date(startDate);
            if (endDate) where.timestamp[Op.lte] = new Date(endDate);
        }

        // Get total clicks and unique users
        const totalClicks = await Event.count({ where });
        const uniqueUsers = await Event.count({
            where,
            distinct: true,
            col: 'contactId',
        });

        // Get button-wise analytics
        const buttonStats = await Event.findAll({
            where,
            attributes: [
                [sequelize.fn('COALESCE', sequelize.json('metadata.buttonId'), 'unknown'), 'buttonId'],
                [sequelize.fn('COALESCE', sequelize.json('metadata.buttonName'), sequelize.col('eventName')), 'buttonName'],
                [sequelize.fn('COALESCE', sequelize.json('metadata.buttonType'), 'quick_reply'), 'buttonType'],
                [sequelize.fn('COUNT', '*'), 'clicks'],
                [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('contactId'))), 'uniqueUsers'],
            ],
            group: [
                sequelize.fn('COALESCE', sequelize.json('metadata.buttonId'), 'unknown'),
                sequelize.fn('COALESCE', sequelize.json('metadata.buttonName'), sequelize.col('eventName')),
                sequelize.fn('COALESCE', sequelize.json('metadata.buttonType'), 'quick_reply'),
            ],
            raw: true,
        });

        // Calculate percentages
        const buttons = buttonStats.map((button) => ({
            buttonId: button.buttonId,
            buttonName: button.buttonName,
            buttonType: button.buttonType,
            clicks: parseInt(button.clicks),
            clickPercentage: totalClicks > 0 ? ((parseInt(button.clicks) / totalClicks) * 100).toFixed(2) : 0,
            uniqueUsers: parseInt(button.uniqueUsers),
        }));

        res.json({
            totalClicks,
            uniqueUsers,
            buttons,
        });
    } catch (error) {
        console.error('Error getting button analytics:', error);
        res.status(500).json({ message: 'Failed to retrieve button analytics' });
    }
});

/**
 * @route   GET /api/events/button-clicks/users
 * @desc    Get list of users who clicked a specific button
 * @access  Private (analytics.view_events)
 */
router.get('/button-clicks/users', authenticate, hasPermission('analytics.view_events'), async (req, res) => {
    try {
        const { buttonId, buttonName, campaignId, workflowId, page = 1, limit = 25, search = '' } = req.query;

        const where = {
            eventType: 'button_click',
        };

        if (buttonId && buttonId !== 'unknown') {
            where['metadata.buttonId'] = buttonId;
        }

        if (buttonName) {
            where.eventName = buttonName;
        }

        if (campaignId) {
            where.source = 'campaign';
            where.sourceId = campaignId;
        }

        if (workflowId) {
            where.source = 'workflow';
            where.sourceId = workflowId;
        }

        // Get events with contact info
        const offset = (page - 1) * limit;
        const { rows: events, count: total } = await Event.findAndCountAll({
            where,
            include: [
                {
                    model: Contact,
                    as: 'contact',
                    attributes: ['id', 'name', 'phone', 'email'],
                    where: search ? {
                        [Op.or]: [
                            { name: { [Op.iLike]: `%${search}%` } },
                            { phone: { [Op.iLike]: `%${search}%` } },
                        ],
                    } : undefined,
                },
            ],
            attributes: ['contactId', [sequelize.fn('COUNT', '*'), 'clickCount'], [sequelize.fn('MAX', sequelize.col('Event.timestamp')), 'lastClickedAt']],
            group: ['contactId', 'contact.id'],
            limit: parseInt(limit),
            offset,
            order: [[sequelize.fn('COUNT', '*'), 'DESC']],
            subQuery: false,
        });

        const users = events.map((event) => ({
            contact: event.contact,
            clickCount: parseInt(event.getDataValue('clickCount')),
            lastClickedAt: event.getDataValue('lastClickedAt'),
        }));

        res.json({
            users,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / limit),
        });
    } catch (error) {
        console.error('Error getting button click users:', error);
        res.status(500).json({ message: 'Failed to retrieve users' });
    }
});

/**
 * @route   GET /api/events
 * @desc    Get all events with filtering
 * @access  Private (analytics.view_events)
 */
router.get('/', authenticate, hasPermission('analytics.view_events'), async (req, res) => {
    try {
        const {
            eventType,
            contactId,
            source,
            sourceId,
            startDate,
            endDate,
            page = 1,
            limit = 50,
        } = req.query;

        const where = {};

        if (eventType) where.eventType = eventType;
        if (contactId) where.contactId = contactId;
        if (source) where.source = source;
        if (sourceId) where.sourceId = sourceId;

        if (startDate || endDate) {
            where.timestamp = {};
            if (startDate) where.timestamp[Op.gte] = new Date(startDate);
            if (endDate) where.timestamp[Op.lte] = new Date(endDate);
        }

        const offset = (page - 1) * limit;
        const { rows: events, count: total } = await Event.findAndCountAll({
            where,
            include: [
                {
                    model: Contact,
                    as: 'contact',
                    attributes: ['id', 'name', 'phone'],
                },
            ],
            limit: parseInt(limit),
            offset,
            order: [['timestamp', 'DESC']],
        });

        res.json({
            events,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / limit),
        });
    } catch (error) {
        console.error('Error getting events:', error);
        res.status(500).json({ message: 'Failed to retrieve events' });
    }
});

/**
 * @route   GET /api/events/analytics/overview
 * @desc    Get comprehensive events analytics overview
 * @access  Private (analytics.view_events)
 */
router.get('/analytics/overview', authenticate, hasPermission('analytics.view_events'), async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const where = {};
        if (startDate || endDate) {
            where.timestamp = {};
            if (startDate) where.timestamp[Op.gte] = new Date(startDate);
            if (endDate) where.timestamp[Op.lte] = new Date(endDate);
        }

        // Total events
        const totalEvents = await Event.count({ where });

        // Events by type
        const eventsByType = await Event.findAll({
            where,
            attributes: [
                'eventType',
                [sequelize.fn('COUNT', '*'), 'count'],
            ],
            group: ['eventType'],
            raw: true,
        });

        // Top events
        const topEvents = await Event.findAll({
            where,
            attributes: [
                'eventName',
                [sequelize.fn('COUNT', '*'), 'count'],
            ],
            group: ['eventName'],
            order: [[sequelize.fn('COUNT', '*'), 'DESC']],
            limit: 10,
            raw: true,
        });

        // Recent events
        const recentEvents = await Event.findAll({
            where,
            include: [
                {
                    model: Contact,
                    as: 'contact',
                    attributes: ['id', 'name', 'phone'],
                },
            ],
            limit: 20,
            order: [['timestamp', 'DESC']],
        });

        res.json({
            totalEvents,
            eventsByType,
            topEvents,
            recentEvents,
        });
    } catch (error) {
        console.error('Error getting events overview:', error);
        res.status(500).json({ message: 'Failed to retrieve events overview' });
    }
});

module.exports = router;
