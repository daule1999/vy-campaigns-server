const express = require('express');
const router = express.Router();
const { autoresponderRepository, templateRepository } = require('../../db/repositories');
const { sendInteractiveButtons, sendFreeTextMessage, sendImageMessage } = require('../../services/whatsapp');
const config = require('../../config');
const { WebhookEvent } = require('../../db/models/sequelize');
const { authenticate } = require('../../middleware');
const { validateWebhookPayload } = require('../../validators/webhookSchemas');
const { webhookValidationError, createGraphAPIError } = require('../../utils/graphAPIError');


/**
 * Webhook verification (GET)
 */
router.get('/', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    console.log('📋 Webhook Verification Request:');
    console.log('  Mode:', mode);
    console.log('  Token (received):', token);
    console.log('  Token (expected):', config.webhook.verifyToken);
    console.log('  Challenge:', challenge);

    // Check if a token and mode is in the query string of the request
    if (mode && token) {
        // Check the mode and token sent is correct
        if (mode === 'subscribe' && token === config.webhook.verifyToken) {
            // Respond with the challenge token from the request
            console.log('✅ Webhook verified successfully!');
            res.status(200).send(challenge);
        } else {
            // Responds with '403 Forbidden' if verify tokens do not match
            console.log('❌ Webhook verification failed: Token mismatch');
            res.sendStatus(403);
        }
    } else {
        console.log('❌ Webhook verification failed: Missing mode or token');
        res.sendStatus(400);
    }
});

/**
 * TEST Webhook endpoint - Returns sample webhook payload
 */
router.get('/test', (req, res) => {
    const samplePayload = {
        object: 'whatsapp_business_account',
        entry: [{
            id: 'WHATSAPP_BUSINESS_ACCOUNT_ID',
            changes: [{
                value: {
                    messaging_product: 'whatsapp',
                    metadata: {
                        display_phone_number: '16505551111',
                        phone_number_id: '123456789'
                    },
                    contacts: [{
                        profile: { name: 'Test User' },
                        wa_id: '16505551234'
                    }],
                    messages: [{
                        from: '16505551234',
                        id: 'wamid.TEST_MESSAGE_ID',
                        timestamp: Math.floor(Date.now() / 1000).toString(),
                        type: 'text',
                        text: { body: 'Test message' }
                    }]
                },
                field: 'messages'
            }]
        }]
    };

    res.json({
        status: 'success',
        message: 'Webhook test endpoint',
        endpoint: {
            verification: 'GET /webhook',
            events: 'POST /webhook',
            test: 'GET /webhook/test',
            recent: 'GET /webhook/recent (requires auth)'
        },
        config: {
            verifyToken: config.webhook.verifyToken ? '✅ Configured' : '❌ Not configured',
            whatsappToken: config.whatsapp.token ? '✅ Configured' : '❌ Not configured',
            phoneNumberId: config.whatsapp.phoneNumberId || 'Not configured'
        },
        samplePayload
    });
});

/**
 * Poll for recent webhook events (Frontend real-time updates)
 */
router.get('/recent', authenticate, async (req, res) => {
    try {
        const since = req.query.since ? new Date(parseInt(req.query.since)) : new Date(Date.now() - 60000);
        const limit = parseInt(req.query.limit) || 50;

        const events = await WebhookEvent.findAll({
            where: {
                createdAt: {
                    [require('sequelize').Op.gt]: since
                }
            },
            order: [['createdAt', 'DESC']],
            limit: limit
        });

        // Transform for frontend
        const formattedEvents = events.map(event => ({
            id: event.id,
            eventType: event.eventType,
            from: event.from,
            messageType: event.messageType,
            messageText: event.messageText,
            templateName: event.templateName,
            templateStatus: event.templateStatus,
            timestamp: event.createdAt,
            preview: generateEventPreview(event)
        }));

        res.json({
            success: true,
            count: formattedEvents.length,
            events: formattedEvents
        });
    } catch (error) {
        console.error('❌ Error fetching webhook events:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch webhook events'
        });
    }
});

/**
 * Get webhook event statistics
 */
router.get('/stats', authenticate, async (req, res) => {
    try {
        const { Op } = require('sequelize');
        const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const [totalEvents, messageEvents, templateEvents, last24HoursCount] = await Promise.all([
            WebhookEvent.count(),
            WebhookEvent.count({ where: { eventType: 'messages' } }),
            WebhookEvent.count({ where: { eventType: 'message_template_status_update' } }),
            WebhookEvent.count({ where: { createdAt: { [Op.gt]: last24Hours } } })
        ]);

        res.json({
            success: true,
            stats: {
                total: totalEvents,
                messages: messageEvents,
                templateUpdates: templateEvents,
                last24Hours: last24HoursCount
            }
        });
    } catch (error) {
        console.error('❌ Error fetching webhook stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch webhook statistics'
        });
    }
});

/**
 * Webhook event listener (POST)
 */
router.post('/', async (req, res) => {
    try {
        const body = req.body;

        console.log('📨 Webhook POST received');
        console.log('📦 Payload:', JSON.stringify(body, null, 2));

        // Validate webhook payload
        const validation = validateWebhookPayload(body);
        if (!validation.valid) {
            console.error('❌ Webhook validation failed:', validation.errors);
            const error = webhookValidationError(validation.errors);
            return res.status(400).json(error);
        }

        // Respond 200 OK immediately (required by WhatsApp)
        res.sendStatus(200);

        // Process webhook asynchronously
        if (body.object === 'whatsapp_business_account') {
            if (body.entry && body.entry[0].changes && body.entry[0].changes[0].value) {
                const change = body.entry[0].changes[0];
                const value = change.value;
                const field = change.field;

                console.log(`🔔 Webhook Event: ${field}`);

                // Log event to database
                await logWebhookEvent(field, value, body);

                // Handle different event types
                switch (field) {
                    case 'messages':
                        await handleMessagesEvent(value);
                        break;

                    case 'message_template_status_update':
                        await handleTemplateStatusUpdate(value);
                        break;

                    case 'account_review_update':
                        await handleAccountReviewUpdate(value);
                        break;

                    case 'phone_number_quality_update':
                        await handlePhoneQualityUpdate(value);
                        break;

                    case 'account_alerts':
                        await handleAccountAlerts(value);
                        break;

                    default:
                        console.log(`ℹ️ Unhandled webhook event type: ${field}`);
                }
            }
        } else {
            console.log('⚠️ Invalid webhook payload: no object field');
        }
    } catch (error) {
        console.error('❌ Webhook error:', error);
        // Note: Already sent 200 OK, can't send error response
    }
});

/**
 * Handle messages event - includes both incoming messages and status updates
 */
async function handleMessagesEvent(value) {
    // Handle incoming messages
    if (value.messages && value.messages[0]) {
        const message = value.messages[0];
        const from = message.from;

        console.log(`📨 Incoming ${message.type} from ${from}`);

        switch (message.type) {
            case 'text':
                await handleIncomingMessage(from, message.text.body);
                break;
            case 'interactive':
                await handleButtonResponse(from, message.interactive);
                break;
            case 'button':
                await handleLegacyButtonResponse(from, message.button);
                break;
            case 'image':
                console.log('📸 Received image:', message.image.id);
                break;
            case 'video':
                console.log('🎥 Received video:', message.video.id);
                break;
            case 'audio':
                console.log('🎵 Received audio:', message.audio.id);
                break;
            case 'document':
                console.log('📄 Received document:', message.document.filename);
                break;
            case 'location':
                console.log('📍 Received location:', message.location);
                break;
            case 'contacts':
                console.log('👤 Received contacts:', message.contacts);
                break;
            case 'sticker':
                console.log('😊 Received sticker:', message.sticker.id);
                break;
            case 'reaction':
                console.log('❤️ Received reaction:', message.reaction.emoji, 'on message', message.reaction.message_id);
                break;
            default:
                console.log('❓ Received unknown message type:', message.type);
        }
    }

    // Handle message status updates
    if (value.statuses && value.statuses[0]) {
        const status = value.statuses[0];
        await handleMessageStatusUpdate(status);
    }
}

/**
 * Handle message status updates (sent, delivered, read, failed)
 */
async function handleMessageStatusUpdate(status) {
    const { id, status: statusType, timestamp, recipient_id, errors } = status;

    console.log(`📬 Message Status: ${id} -> ${statusType}${recipient_id ? ` (${recipient_id})` : ''}`);

    if (errors && errors.length > 0) {
        const error = errors[0];
        console.error(`❌ Message delivery error: ${error.code} - ${error.title}`);
    }

    // TODO: Update message tracking in database
    // This would be used for message delivery analytics
}

/**
 * Handle account review update
 */
async function handleAccountReviewUpdate(value) {
    const { current_status, previous_status, affected_features } = value;
    console.log(`🔍 Account Review Update: ${previous_status} -> ${current_status}`);

    if (affected_features) {
        console.log(`   Affected features:`, affected_features);
    }
}

/**
 * Handle phone number quality update
 */
async function handlePhoneQualityUpdate(value) {
    const { phone_number, quality_rating, previous_quality_rating } = value;
    console.log(`📊 Phone Quality Update: ${phone_number}`);
    console.log(`   Rating: ${previous_quality_rating} -> ${quality_rating}`);
}

/**
 * Handle account alerts
 */
async function handleAccountAlerts(value) {
    const { alert_type, alert_severity, message } = value;
    console.log(`🚨 Account Alert (${alert_severity}): ${alert_type}`);
    console.log(`   Message: ${message}`);
}


/**
 * Log webhook event to database
 */
async function logWebhookEvent(eventType, value, fullPayload) {
    try {
        const eventData = {
            eventType: eventType,
            payload: fullPayload,
            webhookType: determineWebhookType(eventType, value)
        };

        // Extract relevant fields based on event type
        if (eventType === 'messages') {
            if (value.messages && value.messages[0]) {
                const message = value.messages[0];
                eventData.from = message.from;
                eventData.messageType = message.type;
                eventData.messageId = message.id;
                eventData.messageText = message.text?.body || null;
            } else if (value.statuses && value.statuses[0]) {
                const status = value.statuses[0];
                eventData.messageId = status.id;
                eventData.statusType = status.status;
                eventData.from = status.recipient_id;

                // Capture error information
                if (status.errors && status.errors[0]) {
                    eventData.errorCode = status.errors[0].code;
                    eventData.errorMessage = status.errors[0].title || status.errors[0].message;
                }
            }
        } else if (eventType === 'message_template_status_update') {
            eventData.templateName = value.message_template_name;
            eventData.templateStatus = value.event;
            if (value.reason) {
                eventData.errorMessage = value.reason;
            }
        }

        await WebhookEvent.create(eventData);
        console.log('✅ Webhook event logged to database');
    } catch (error) {
        console.error('❌ Error logging webhook event:', error);
        // Don't throw - logging failure shouldn't break webhook processing
    }
}

/**
 * Determine webhook type category
 */
function determineWebhookType(eventType, value) {
    if (eventType === 'messages') {
        if (value.messages) return 'message_received';
        if (value.statuses) return 'message_status';
    }
    return eventType;
}


/**
 * Generate human-readable preview for event
 */
function generateEventPreview(event) {
    switch (event.eventType) {
        case 'messages':
            if (event.messageType === 'text') {
                return `Message from ${event.from}: "${event.messageText}"`;
            }
            return `${event.messageType} message from ${event.from}`;
        case 'message_template_status_update':
            return `Template "${event.templateName}" is now ${event.templateStatus}`;
        default:
            return `${event.eventType} event`;
    }
}

/**
 * Handle Template Status Updates (Approved, Rejected, etc.)
 */
async function handleTemplateStatusUpdate(value) {
    const { message_template_name, message_template_language, event, reason } = value;

    console.log(`📝 Template Update: ${message_template_name} (${message_template_language}) -> ${event}`);
    if (reason) {
        console.log(`   Reason: ${reason}`);
    }

    try {
        // Find template by name and language
        const template = await templateRepository.findOne({
            waTemplateName: message_template_name,
            languageCode: message_template_language
        });

        if (template) {
            let newStatus = event.toLowerCase(); // APPROVED -> approved, REJECTED -> rejected

            // Map specific statuses if needed
            if (newStatus === 'paused') newStatus = 'paused';
            if (newStatus === 'disabled') newStatus = 'disabled';

            await templateRepository.updateById(template.id, {
                status: newStatus
            });
            console.log(`✅ Updated local template ${template.id} status to ${newStatus}`);
        } else {
            console.warn(`⚠️ Template not found locally: ${message_template_name}`);
        }
    } catch (err) {
        console.error('❌ Error updating template status:', err);
    }
}

/**
 * Handle incoming text messages -> Trigger Autoresponders
 */
async function handleIncomingMessage(from, text) {
    try {
        console.log(`💬 Message body: "${text}"`);

        // Find matching autoresponder
        const autoresponder = await autoresponderRepository.findByKeyword(text);

        if (autoresponder) {
            console.log(`✅ Autoresponder matched: ${autoresponder.name}`);

            // If it has menu options, send interactive button message
            if (autoresponder.menuOptions && autoresponder.menuOptions.length > 0) {
                await sendInteractiveButtons(
                    from,
                    autoresponder.welcomeMessage,
                    autoresponder.menuOptions.map(opt => ({
                        type: 'reply',
                        reply: {
                            id: opt.id,
                            title: opt.title
                        }
                    }))
                );
            } else {
                // Otherwise just send the welcome text
                await sendFreeTextMessage(from, autoresponder.welcomeMessage);
            }
        } else {
            console.log('❌ No autoresponder matched');
        }
    } catch (error) {
        console.error('❌ Error handling incoming message:', error);
    }
}

/**
 * Handle Interactive Button Responses
 */
async function handleButtonResponse(from, interactive) {
    try {
        if (interactive.type === 'button_reply') {
            const buttonId = interactive.button_reply.id;
            const buttonTitle = interactive.button_reply.title;

            console.log(`👇 Button clicked: ${buttonTitle} (ID: ${buttonId})`);

            // Find which autoresponder this button belongs to
            // This is tricky because we don't know the exact autoresponder just from the button ID
            // BUT, since we store 'responses' map in the autoresponder, we can try to find one where responses[buttonId] exists
            // For MVP, we might need to iterate or assume unique IDs.
            // Let's try to find an autoresponder that has this button ID in its responses.

            const allAutoresponders = await autoresponderRepository.findAll({ isActive: true });

            for (const ar of allAutoresponders) {
                if (ar.responses && ar.responses[buttonId]) {
                    const response = ar.responses[buttonId];

                    switch (response.type) {
                        case 'text':
                            await sendFreeTextMessage(from, response.content);
                            break;
                        case 'image':
                            await sendImageMessage(from, response.url, response.caption);
                            break;
                        case 'link':
                            // WhatsApp doesn't have a specific "Link Message", it's just text with a link preview
                            await sendFreeTextMessage(from, `${response.text || ''} ${response.url}`);
                            break;
                    }
                    return; // Stop after finding match
                }
            }

            console.log('⚠️ No response configured for this button ID');
        }
    } catch (error) {
        console.error('❌ Error handling button response:', error);
    }
}

/**
 * Handle Legacy Button Responses (Simple Buttons)
 */
async function handleLegacyButtonResponse(from, button) {
    // Similar logic to interactive, just different payload structure
    // Treating as regular text match for now for simplicity, or re-route to handleButtonResponse if IDs match
    console.log(`🔘 Legacy Button: ${button.payload}`);
    // You could route this to handleIncomingMessage(from, button.text) to trigger keyword logic again
    await handleIncomingMessage(from, button.text);
}

module.exports = router;


