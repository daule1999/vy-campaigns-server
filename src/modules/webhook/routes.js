const express = require('express');
const router = express.Router();
const { autoresponderRepository, templateRepository } = require('../../db/repositories');
const { sendInteractiveButtons, sendFreeTextMessage, sendImageMessage } = require('../../services/whatsapp');
const config = require('../../config');

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
            test: 'GET /webhook/test'
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
 * Webhook event listener (POST)
 */
router.post('/', async (req, res) => {
    try {
        const body = req.body;

        console.log('📨 Webhook POST received');
        console.log('📦 Payload:', JSON.stringify(body, null, 2));

        // Check availability of the object
        if (body.object) { // usually 'whatsapp_business_account'
            if (body.entry && body.entry[0].changes && body.entry[0].changes[0].value) {
                const change = body.entry[0].changes[0];
                const value = change.value;
                const field = change.field;

                console.log(`🔔 Webhook Event: ${field}`);

                // 1. Handle Messages
                if (field === 'messages' && value.messages && value.messages[0]) {
                    const message = value.messages[0];
                    const from = message.from; // Sender's phone number

                    // Log incoming message type
                    console.log(`📨 Incoming ${message.type} from ${from}`);

                    switch (message.type) {
                        case 'text':
                            await handleIncomingMessage(from, message.text.body);
                            break;
                        case 'interactive':
                            await handleButtonResponse(from, message.interactive);
                            break;
                        case 'button': // Quick Reply Button (legacy/alternative)
                            await handleLegacyButtonResponse(from, message.button);
                            break;
                        case 'image':
                            console.log('📸 Received image:', message.image.id);
                            // Optional: Auto-reply for media
                            break;
                        case 'document':
                            console.log('📄 Received document:', message.document.filename);
                            break;
                        case 'location':
                            console.log('📍 Received location:', message.location.name);
                            break;
                        default:
                            console.log('❓ Received unknown message type:', message.type);
                    }
                }

                // 2. Handle Template Status Updates
                else if (field === 'message_template_status_update') {
                    await handleTemplateStatusUpdate(value);
                }

                // 3. Handle Message Status Updates
                else if (field === 'messages' && value.statuses && value.statuses[0]) {
                    const status = value.statuses[0];
                    console.log(`📬 Message Status Update: ${status.id} -> ${status.status}`);
                }

                // 4. Log other webhook types
                else {
                    console.log('ℹ️ Other webhook event:', field);
                }
            }

            res.sendStatus(200);
        } else {
            console.log('⚠️ Invalid webhook payload: no object field');
            res.sendStatus(404);
        }
    } catch (error) {
        console.error('❌ Webhook error:', error);
        res.sendStatus(500);
    }
});

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

