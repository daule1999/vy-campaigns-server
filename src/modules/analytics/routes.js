/**
 * Analytics Routes
 * Provides conversation and agent analytics endpoints
 */

const express = require('express');
const router = express.Router();
const { authenticate, requirePermission } = require('../../middleware');

// Get Conversation Analytics
router.get('/conversations', authenticate, requirePermission('analytics:read'), async (req, res) => {
    try {
        const { days = 7 } = req.query;

        // Import models
        const { sequelize } = require('../../db/models/sequelize');
        const { Op } = require('sequelize');

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));

        // Mock analytics data - in production, query actual conversation tables
        const stats = {
            totalConversations: Math.floor(Math.random() * 200) + 100,
            responded: Math.floor(Math.random() * 150) + 80,
            resolved: Math.floor(Math.random() * 120) + 60,
            closedWithoutResponse: Math.floor(Math.random() * 20) + 5,
            avgFirstResponseTime: (Math.random() * 10 + 2).toFixed(1),
            avgResponseTime: (Math.random() * 15 + 3).toFixed(1),
            avgResolutionTime: (Math.random() * 60 + 10).toFixed(1),
            dateRange: {
                start: startDate.toISOString(),
                end: new Date().toISOString()
            }
        };

        res.json({ success: true, data: stats });
    } catch (error) {
        console.error('Conversation analytics error:', error);
        res.status(500).json({ success: false, error: 'Failed to get conversation analytics' });
    }
});

// Get Response Times
router.get('/response-times', authenticate, requirePermission('analytics:read'), async (req, res) => {
    try {
        const { days = 7 } = req.query;

        // Mock response time data
        const data = {
            avgFirstResponse: 3.5,
            avgResponse: 5.2,
            mediaFirstResponse: 2.8,
            timeline: Array.from({ length: parseInt(days) }, (_, i) => ({
                date: new Date(Date.now() - (days - i - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                avgResponse: (Math.random() * 5 + 2).toFixed(1)
            }))
        };

        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to get response times' });
    }
});

// Get Resolution Times
router.get('/resolution-times', authenticate, requirePermission('analytics:read'), async (req, res) => {
    try {
        const { days = 7 } = req.query;

        const data = {
            avgResolution: 24.5,
            medianResolution: 18.2,
            timeline: Array.from({ length: parseInt(days) }, (_, i) => ({
                date: new Date(Date.now() - (days - i - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                avgResolution: (Math.random() * 30 + 10).toFixed(1)
            }))
        };

        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to get resolution times' });
    }
});

// Get Agent Stats
router.get('/agents', authenticate, requirePermission('analytics:read'), async (req, res) => {
    try {
        const { days = 7 } = req.query;
        const { User } = require('../../db/models/sequelize');

        const users = await User.findAll({
            where: { role: { [require('sequelize').Op.ne]: 'superadmin' } },
            attributes: ['id', 'name', 'email', 'status', 'lastLoginAt']
        });

        const agentStats = users.map(user => ({
            id: user.id,
            name: user.name,
            email: user.email,
            status: user.status || 'active',
            lastLogin: user.lastLoginAt,
            conversationsHandled: Math.floor(Math.random() * 100) + 20,
            avgResponseTime: (Math.random() * 10 + 2).toFixed(1),
            resolutionRate: Math.floor(Math.random() * 30) + 70,
            satisfaction: (Math.random() * 1 + 4).toFixed(1)
        }));

        const overall = {
            totalAgents: users.length,
            activeAgents: users.filter(u => u.status === 'active' || !u.status).length,
            totalConversationsHandled: agentStats.reduce((sum, a) => sum + a.conversationsHandled, 0),
            avgHandlingTime: 12.5
        };

        res.json({ success: true, data: { overall, agents: agentStats } });
    } catch (error) {
        console.error('Agent analytics error:', error);
        res.status(500).json({ success: false, error: 'Failed to get agent stats' });
    }
});

// Get Single Agent Performance
router.get('/agents/:agentId', authenticate, requirePermission('analytics:read'), async (req, res) => {
    try {
        const { agentId } = req.params;
        const { days = 7 } = req.query;
        const { User } = require('../../db/models/sequelize');

        const user = await User.findByPk(agentId);
        if (!user) {
            return res.status(404).json({ success: false, error: 'Agent not found' });
        }

        const performance = {
            agent: { id: user.id, name: user.name, email: user.email },
            conversationsHandled: Math.floor(Math.random() * 100) + 20,
            avgResponseTime: (Math.random() * 10 + 2).toFixed(1),
            resolutionRate: Math.floor(Math.random() * 30) + 70,
            satisfaction: (Math.random() * 1 + 4).toFixed(1),
            timeline: Array.from({ length: parseInt(days) }, (_, i) => ({
                date: new Date(Date.now() - (days - i - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                conversations: Math.floor(Math.random() * 20) + 5
            }))
        };

        res.json({ success: true, data: performance });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to get agent performance' });
    }
});

// Get Campaign Summary
router.get('/campaigns/summary', authenticate, requirePermission('analytics:read'), async (req, res) => {
    try {
        const { days = 30 } = req.query;
        const { Campaign, CampaignContact } = require('../../db/models/sequelize');

        const campaigns = await Campaign.findAll({
            limit: 10,
            order: [['createdAt', 'DESC']]
        });

        const summary = {
            totalCampaigns: campaigns.length,
            totalSent: campaigns.reduce((sum, c) => sum + (c.statsTotal || 0), 0),
            totalDelivered: campaigns.reduce((sum, c) => sum + (c.statsDelivered || 0), 0),
            totalRead: campaigns.reduce((sum, c) => sum + (c.statsRead || 0), 0),
            totalReplied: campaigns.reduce((sum, c) => sum + (c.statsReplied || 0), 0),
            campaigns: campaigns.map(c => ({
                id: c.id,
                name: c.name,
                status: c.status,
                sent: c.statsTotal || 0,
                delivered: c.statsDelivered || 0,
                read: c.statsRead || 0
            }))
        };

        res.json({ success: true, data: summary });
    } catch (error) {
        console.error('Campaign summary error:', error);
        res.status(500).json({ success: false, error: 'Failed to get campaign summary' });
    }
});

// Export Conversations Data
router.get('/conversations/export', authenticate, requirePermission('analytics:export'), async (req, res) => {
    try {
        const { days = 7 } = req.query;

        // Generate CSV content
        const csvRows = [
            ['Date', 'Total', 'Responded', 'Resolved', 'Avg Response Time'].join(',')
        ];

        for (let i = 0; i < parseInt(days); i++) {
            const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            csvRows.push([
                date,
                Math.floor(Math.random() * 50) + 10,
                Math.floor(Math.random() * 45) + 8,
                Math.floor(Math.random() * 40) + 5,
                (Math.random() * 10 + 2).toFixed(1)
            ].join(','));
        }

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=conversation_analytics_${days}d.csv`);
        res.send(csvRows.join('\n'));
    } catch (error) {
        res.status(500).json({ success: false, error: 'Export failed' });
    }
});

// Export Agent Stats
router.get('/agents/export', authenticate, requirePermission('analytics:export'), async (req, res) => {
    try {
        const { User } = require('../../db/models/sequelize');
        const users = await User.findAll({ attributes: ['id', 'name', 'email'] });

        const csvRows = [
            ['Agent Name', 'Email', 'Conversations', 'Avg Response Time', 'Resolution Rate'].join(',')
        ];

        users.forEach(user => {
            csvRows.push([
                user.name,
                user.email,
                Math.floor(Math.random() * 100) + 20,
                (Math.random() * 10 + 2).toFixed(1),
                `${Math.floor(Math.random() * 30) + 70}%`
            ].join(','));
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=agent_performance.csv');
        res.send(csvRows.join('\n'));
    } catch (error) {
        res.status(500).json({ success: false, error: 'Export failed' });
    }
});

module.exports = router;
