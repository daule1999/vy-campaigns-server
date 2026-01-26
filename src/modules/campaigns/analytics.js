/**
 * Campaign Analytics Routes
 * Provides detailed campaign performance metrics and user lists
 */

const express = require('express');
const router = express.Router();
const { Campaign, CampaignContact, Contact, Template, User } = require('../../db/models/sequelize');
const { authenticate } = require('../../middleware/auth');
const { hasPermission } = require('../../middleware/rbac');
const { Op } = require('sequelize');

/**
 * GET /api/campaigns/:id/analytics
 * Get comprehensive campaign analytics
 */
router.get('/:id/analytics', authenticate, hasPermission('campaign.view_custom_reports'), async (req, res) => {
    try {
        const campaign = await Campaign.findByPk(req.params.id, {
            include: [
                { model: Template, as: 'template' },
                { model: User, as: 'creator', attributes: ['id', 'name', 'email'] }
            ]
        });

        if (!campaign) {
            return res.status(404).json({
                success: false,
                message: 'Campaign not found'
            });
        }

        // Calculate percentages
        const total = campaign.totalContacts || 0;
        const attempted = campaign.attemptedCount || 0;
        const sent = campaign.sentCount || 0;
        const delivered = campaign.deliveredCount || 0;
        const read = campaign.readCount || 0;
        const replied = campaign.repliedCount || 0;
        const failedMeta = campaign.failedMetaCount || 0;
        const failedOther = campaign.failedOtherCount || 0;

        // Determine if still processing (campaign is running or recently completed)
        const isRunning = campaign.status === 'running';
        const recentlyCompleted = campaign.completedAt &&
            (new Date() - new Date(campaign.completedAt)) < 3600000; // Within 1 hour

        const processing = isRunning || recentlyCompleted;

        const analytics = {
            campaign: {
                id: campaign.id,
                name: campaign.name,
                status: campaign.status,
                category: campaign.category,
                totalContacts: total,
                totalCost: parseFloat(campaign.totalCost || 0),
                costPerMessage: parseFloat(campaign.costPerMessage || 0),
                startedAt: campaign.startedAt,
                completedAt: campaign.completedAt,
                template: campaign.template ? {
                    id: campaign.template.id,
                    name: campaign.template.templateName
                } : null
            },
            analytics: {
                attempted: {
                    count: attempted,
                    percentage: total > 0 ? ((attempted / total) * 100).toFixed(2) : 0
                },
                sent: {
                    count: sent,
                    percentage: total > 0 ? ((sent / total) * 100).toFixed(2) : 0
                },
                delivered: {
                    count: delivered,
                    percentage: total > 0 ? ((delivered / total) * 100).toFixed(2) : 0,
                    processing: processing && delivered < sent
                },
                read: {
                    count: read,
                    percentage: delivered > 0 ? ((read / delivered) * 100).toFixed(2) : 0,
                    processing: processing
                },
                replied: {
                    count: replied,
                    percentage: delivered > 0 ? ((replied / delivered) * 100).toFixed(2) : 0,
                    processing: processing
                },
                failedMeta: {
                    count: failedMeta,
                    percentage: total > 0 ? ((failedMeta / total) * 100).toFixed(2) : 0
                },
                failedOther: {
                    count: failedOther,
                    percentage: total > 0 ? ((failedOther / total) * 100).toFixed(2) : 0
                }
            },
            buttonTracking: {
                enabled: false, // Will be implemented later
                buttons: []
            }
        };

        res.json({
            success: true,
            data: analytics
        });
    } catch (error) {
        console.error('Error fetching campaign analytics:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching campaign analytics'
        });
    }
});

/**
 * GET /api/campaigns/:id/users/:status
 * Get list of users by status
 */
router.get('/:id/users/:status', authenticate, hasPermission('campaign.view_custom_reports'), async (req, res) => {
    try {
        const { status } = req.params;
        const { page = 1, limit = 50, search } = req.query;

        const validStatuses = [
            'attempted', 'sent', 'delivered', 'read',
            'replied', 'failed_meta', 'failed_other', 'all'
        ];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }

        const where = { campaignId: req.params.id };

        if (status !== 'all') {
            where.status = status;
        }

        // Build contact search filter
        let contactWhere = {};
        if (search) {
            contactWhere = {
                [Op.or]: [
                    { name: { [Op.like]: `%${search}%` } },
                    { phoneNumber: { [Op.like]: `%${search}%` } }
                ]
            };
        }

        const offset = (parseInt(page) - 1) * parseInt(limit);

        const result = await CampaignContact.findAndCountAll({
            where,
            include: [
                {
                    model: Contact,
                    as: 'contact',
                    attributes: ['id', 'name', 'phoneNumber', 'email'],
                    where: contactWhere
                }
            ],
            limit: parseInt(limit),
            offset,
            order: [
                ['sentAt', 'DESC'],
                ['createdAt', 'DESC']
            ]
        });

        const users = result.rows.map(cc => ({
            id: cc.id,
            contact: cc.contact,
            status: cc.status,
            whatsappMessageId: cc.whatsappMessageId,
            attemptedAt: cc.attemptedAt,
            sentAt: cc.sentAt,
            deliveredAt: cc.deliveredAt,
            readAt: cc.readAt,
            repliedAt: cc.repliedAt,
            failureReason: cc.failureReason,
            retryCount: cc.retryCount,
            buttonClicks: cc.buttonClicks || []
        }));

        res.json({
            success: true,
            data: {
                users,
                total: result.count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(result.count / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error fetching campaign users:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching campaign users'
        });
    }
});

/**
 * POST /api/campaigns/:id/refresh
 * Manually refresh campaign analytics (useful for live updates)
 */
router.post('/:id/refresh', authenticate, hasPermission('campaign.view_all'), async (req, res) => {
    try {
        const campaign = await Campaign.findByPk(req.params.id);
        if (!campaign) {
            return res.status(404).json({
                success: false,
                message: 'Campaign not found'
            });
        }

        // Recalculate all counters from campaign_contacts
        const counts = await CampaignContact.findAll({
            where: { campaignId: campaign.id },
            attributes: [
                'status',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            group: ['status'],
            raw: true
        });

        const counters = {
            attemptedCount: 0,
            sentCount: 0,
            deliveredCount: 0,
            readCount: 0,
            repliedCount: 0,
            failedMetaCount: 0,
            failedOtherCount: 0
        };

        counts.forEach(c => {
            switch (c.status) {
                case 'attempted':
                    counters.attemptedCount = parseInt(c.count);
                    break;
                case 'sent':
                    counters.sentCount = parseInt(c.count);
                    break;
                case 'delivered':
                    counters.deliveredCount = parseInt(c.count);
                    break;
                case 'read':
                    counters.readCount = parseInt(c.count);
                    break;
                case 'replied':
                    counters.repliedCount = parseInt(c.count);
                    break;
                case 'failed_meta':
                    counters.failedMetaCount = parseInt(c.count);
                    break;
                case 'failed_other':
                    counters.failedOtherCount = parseInt(c.count);
                    break;
            }
        });

        await campaign.update(counters);

        res.json({
            success: true,
            message: 'Campaign analytics refreshed',
            data: counters
        });
    } catch (error) {
        console.error('Error refreshing campaign:', error);
        res.status(500).json({
            success: false,
            message: 'Error refreshing campaign'
        });
    }
});

/**
 * GET /api/campaigns/:id/export
 * Export campaign report
 */
router.get('/:id/export', authenticate, hasPermission('campaign.export_report'), async (req, res) => {
    try {
        const campaign = await Campaign.findByPk(req.params.id, {
            include: [{ model: Template, as: 'template' }]
        });

        if (!campaign) {
            return res.status(404).json({
                success: false,
                message: 'Campaign not found'
            });
        }

        const contacts = await CampaignContact.findAll({
            where: { campaignId: campaign.id },
            include: [
                {
                    model: Contact,
                    as: 'contact',
                    attributes: ['id', 'name', 'phoneNumber', 'email']
                }
            ],
            order: [['createdAt', 'ASC']]
        });

        // Generate CSV
        const csvRows = [];
        csvRows.push([
            'Contact Name',
            'Phone Number',
            'Email',
            'Status',
            'Attempted At',
            'Sent At',
            'Delivered At',
            'Read At',
            'Replied At',
            'Failure Reason',
            'Retry Count'
        ].join(','));

        contacts.forEach(cc => {
            csvRows.push([
                cc.contact?.name || '',
                cc.contact?.phoneNumber || '',
                cc.contact?.email || '',
                cc.status,
                cc.attemptedAt || '',
                cc.sentAt || '',
                cc.deliveredAt || '',
                cc.readAt || '',
                cc.repliedAt || '',
                (cc.failureReason || '').replace(/,/g, ';'),
                cc.retryCount || 0
            ].join(','));
        });

        const csv = csvRows.join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="campaign_${campaign.id}_report.csv"`);
        res.send(csv);
    } catch (error) {
        console.error('Error exporting campaign:', error);
        res.status(500).json({
            success: false,
            message: 'Error exporting campaign'
        });
    }
});

/**
 * POST /api/campaigns/:id/retry-failed
 * Retry failed messages (only failed_other, not Meta failures)
 */
router.post('/:id/retry-failed', authenticate, hasPermission('campaign.create'), async (req, res) => {
    try {
        const campaign = await Campaign.findByPk(req.params.id);
        if (!campaign) {
            return res.status(404).json({
                success: false,
                message: 'Campaign not found'
            });
        }

        const failedContacts = await CampaignContact.findAll({
            where: {
                campaignId: campaign.id,
                status: 'failed_other'
            }
        });

        if (failedContacts.length === 0) {
            return res.json({
                success: true,
                message: 'No failed messages to retry',
                data: { retried: 0 }
            });
        }

        // Reset status to pending for retry
        for (const contact of failedContacts) {
            await contact.update({
                status: 'pending',
                retryCount: contact.retryCount + 1,
                error: null,
                failureReason: null
            });
        }

        // TODO: Add to message queue for retry

        res.json({
            success: true,
            message: `${failedContacts.length} messages queued for retry`,
            data: { retried: failedContacts.length }
        });
    } catch (error) {
        console.error('Error retrying failed messages:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrying failed messages'
        });
    }
});

module.exports = router;
