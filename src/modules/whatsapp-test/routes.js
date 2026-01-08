const express = require('express');
const router = express.Router();
const axios = require('axios');
const { authenticate, authorize } = require('../../middleware');

/**
 * WhatsApp API Testing Routes - Superadmin Only
 * Allows testing WhatsApp API and webhooks with custom credentials
 */

/**
 * Test WhatsApp Messaging API
 * POST /api/whatsapp-test/send-message
 */
router.post('/send-message', authenticate, authorize(['superadmin']), async (req, res) => {
    try {
        const {
            phoneNumberId,
            accessToken,
            recipientNumber,
            messageType,
            templateName,
            languageCode,
            textMessage
        } = req.body;

        // Validation
        if (!phoneNumberId || !accessToken || !recipientNumber) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: phoneNumberId, accessToken, recipientNumber'
            });
        }

        const apiUrl = `https://graph.facebook.com/v23.0/${phoneNumberId}/messages`;

        let payload;

        if (messageType === 'template') {
            if (!templateName) {
                return res.status(400).json({
                    success: false,
                    error: 'Template name is required for template messages'
                });
            }

            payload = {
                messaging_product: 'whatsapp',
                to: recipientNumber,
                type: 'template',
                template: {
                    name: templateName,
                    language: {
                        code: languageCode || 'en_US'
                    }
                }
            };
        } else if (messageType === 'text') {
            if (!textMessage) {
                return res.status(400).json({
                    success: false,
                    error: 'Text message is required for text messages'
                });
            }

            payload = {
                messaging_product: 'whatsapp',
                to: recipientNumber,
                type: 'text',
                text: {
                    body: textMessage
                }
            };
        } else {
            return res.status(400).json({
                success: false,
                error: 'Invalid message type. Must be "template" or "text"'
            });
        }

        console.log('📤 Testing WhatsApp API...');
        console.log('Endpoint:', apiUrl);
        console.log('Payload:', JSON.stringify(payload, null, 2));

        const response = await axios.post(apiUrl, payload, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ WhatsApp API test successful');

        res.json({
            success: true,
            message: 'Message sent successfully',
            data: {
                messageId: response.data.messages[0]?.id,
                recipient: response.data.contacts[0]?.wa_id,
                response: response.data
            }
        });

    } catch (error) {
        console.error('❌ WhatsApp API test failed:', error.response?.data || error.message);

        res.status(error.response?.status || 500).json({
            success: false,
            error: error.response?.data?.error?.message || error.message,
            details: error.response?.data
        });
    }
});

/**
 * Test Webhook Subscription
 * POST /api/whatsapp-test/subscribe-webhook
 */
router.post('/subscribe-webhook', authenticate, authorize(['superadmin']), async (req, res) => {
    try {
        const { wabaId, accessToken, subscribedFields } = req.body;

        if (!wabaId || !accessToken) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: wabaId, accessToken'
            });
        }

        const fields = subscribedFields || [
            'messages',
            'message_template_status_update',
            'account_alerts',
            'phone_number_quality_update',
            'account_review_update'
        ];

        const apiUrl = `https://graph.facebook.com/v23.0/${wabaId}/subscribed_apps`;

        console.log('📤 Testing webhook subscription...');
        console.log('Endpoint:', apiUrl);

        const response = await axios.post(
            apiUrl,
            { subscribed_fields: fields },
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('✅ Webhook subscription test successful');

        res.json({
            success: true,
            message: 'Successfully subscribed to webhook fields',
            data: {
                subscribed: response.data.success,
                fields: fields
            }
        });

    } catch (error) {
        console.error('❌ Webhook subscription test failed:', error.response?.data || error.message);

        res.status(error.response?.status || 500).json({
            success: false,
            error: error.response?.data?.error?.message || error.message,
            details: error.response?.data
        });
    }
});

/**
 * Test Webhook Event
 * POST /api/whatsapp-test/test-webhook
 */
router.post('/test-webhook', authenticate, authorize(['superadmin']), async (req, res) => {
    try {
        const { webhookUrl, verifyToken, eventPayload } = req.body;

        if (!webhookUrl) {
            return res.status(400).json({
                success: false,
                error: 'Webhook URL is required'
            });
        }

        let testPayload;

        // If custom payload provided, use it; otherwise use default test payload
        if (eventPayload && typeof eventPayload === 'object') {
            testPayload = eventPayload;
        } else {
            testPayload = {
                object: 'whatsapp_business_account',
                entry: [{
                    id: 'WHATSAPP_BUSINESS_ACCOUNT_ID',
                    changes: [{
                        value: {
                            messaging_product: 'whatsapp',
                            metadata: {
                                display_phone_number: '15551234567',
                                phone_number_id: '123456789'
                            },
                            messages: [{
                                from: '1234567890',
                                id: 'wamid.test_' + Date.now(),
                                timestamp: Math.floor(Date.now() / 1000).toString(),
                                type: 'text',
                                text: {
                                    body: 'Test message from admin testing interface'
                                }
                            }]
                        },
                        field: 'messages'
                    }]
                }]
            };
        }

        console.log('📤 Testing webhook event...');
        console.log('Webhook URL:', webhookUrl);

        const response = await axios.post(webhookUrl, testPayload, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });

        console.log('✅ Webhook test successful');

        res.json({
            success: true,
            message: 'Webhook event sent successfully',
            data: {
                statusCode: response.status,
                statusText: response.statusText,
                response: response.data
            }
        });

    } catch (error) {
        console.error('❌ Webhook test failed:', error.message);

        res.status(500).json({
            success: false,
            error: error.message,
            details: {
                statusCode: error.response?.status,
                response: error.response?.data
            }
        });
    }
});

/**
 * Verify Webhook Configuration
 * GET /api/whatsapp-test/verify-webhook
 */
router.get('/verify-webhook', authenticate, authorize(['superadmin']), async (req, res) => {
    try {
        const { webhookUrl, verifyToken } = req.query;

        if (!webhookUrl || !verifyToken) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: webhookUrl, verifyToken'
            });
        }

        const challenge = 'test_challenge_' + Date.now();

        console.log('📤 Testing webhook verification...');
        console.log('Webhook URL:', webhookUrl);

        const response = await axios.get(webhookUrl, {
            params: {
                'hub.mode': 'subscribe',
                'hub.challenge': challenge,
                'hub.verify_token': verifyToken
            },
            timeout: 5000
        });

        const verified = response.data === challenge;

        if (verified) {
            console.log('✅ Webhook verification successful');
            res.json({
                success: true,
                message: 'Webhook verification successful',
                data: {
                    verified: true,
                    challenge: challenge,
                    response: response.data
                }
            });
        } else {
            console.log('❌ Webhook verification failed - challenge mismatch');
            res.json({
                success: false,
                error: 'Webhook verification failed - challenge mismatch',
                data: {
                    verified: false,
                    expectedChallenge: challenge,
                    receivedResponse: response.data
                }
            });
        }

    } catch (error) {
        console.error('❌ Webhook verification test failed:', error.message);

        res.status(500).json({
            success: false,
            error: error.message,
            details: {
                statusCode: error.response?.status,
                response: error.response?.data
            }
        });
    }
});

/**
 * Get Current Webhook Subscriptions
 * GET /api/whatsapp-test/webhook-subscriptions
 */
router.get('/webhook-subscriptions', authenticate, authorize(['superadmin']), async (req, res) => {
    try {
        const { wabaId, accessToken } = req.query;

        if (!wabaId || !accessToken) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: wabaId, accessToken'
            });
        }

        const apiUrl = `https://graph.facebook.com/v23.0/${wabaId}/subscribed_apps`;

        const response = await axios.get(apiUrl, {
            params: { access_token: accessToken }
        });

        const subscribedFields = response.data.data[0]?.whatsapp_business_api_data?.subscribed_fields || [];

        res.json({
            success: true,
            data: {
                subscribedFields: subscribedFields,
                raw: response.data
            }
        });

    } catch (error) {
        console.error('❌ Failed to get webhook subscriptions:', error.response?.data || error.message);

        res.status(error.response?.status || 500).json({
            success: false,
            error: error.response?.data?.error?.message || error.message,
            details: error.response?.data
        });
    }
});

module.exports = router;
