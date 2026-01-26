#!/usr/bin/env node

/**
 * Test script to verify VY server can communicate with mock WhatsApp API
 */

require('dotenv').config();
const config = require('./src/config');
const axios = require('axios');

console.log('🧪 Testing Mock WhatsApp API Integration\n');
console.log('='.repeat(60));

// Display configuration
console.log('\n📋 Configuration:');
console.log(`   Mode: ${config.whatsapp.useMock ? 'MOCK' : 'PRODUCTION'}`);
console.log(`   API URL: ${config.whatsapp.apiUrl}`);
console.log(`   Phone Number ID: ${config.whatsapp.phoneNumberId}`);
console.log(`   Business Account ID: ${config.whatsapp.businessAccountId}`);
console.log(`   Token: ${config.whatsapp.token?.substring(0, 20)}...`);

async function testMockAPI() {
    const baseUrl = config.whatsapp.apiUrl.replace(/\/v\d+\.\d+$/, '');

    try {
        console.log('\n🔍 Test 1: Health Check');
        console.log('-'.repeat(60));

        const healthResponse = await axios.get(`${baseUrl}/health`);
        console.log(`✅ Mock server is running`);
        console.log(`   Status: ${healthResponse.data.status}`);

        console.log('\n🔍 Test 2: List Templates');
        console.log('-'.repeat(60));

        // Templates use business account ID, not phone number ID
        const templatesUrl = `${config.whatsapp.apiUrl}/${config.whatsapp.businessAccountId}/message_templates`;
        const templatesResponse = await axios.get(templatesUrl, {
            headers: {
                'Authorization': `Bearer ${config.whatsapp.token}`
            }
        });

        console.log(`✅ Retrieved ${templatesResponse.data.data?.length || 0} templates`);
        if (templatesResponse.data.data?.length > 0) {
            templatesResponse.data.data.slice(0, 3).forEach(t => {
                console.log(`   - ${t.name} (${t.status})`);
            });
        }

        console.log('\n🔍 Test 3: Send Test Message');
        console.log('-'.repeat(60));

        const messageUrl = `${config.whatsapp.apiUrl}/${config.whatsapp.phoneNumberId}/messages`;
        const messageResponse = await axios.post(messageUrl, {
            messaging_product: 'whatsapp',
            to: '919876543210',
            type: 'text',
            text: {
                body: 'Test message from VY Campaigns server integration test'
            }
        }, {
            headers: {
                'Authorization': `Bearer ${config.whatsapp.token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log(`✅ Message sent successfully`);
        console.log(`   Message ID: ${messageResponse.data.messages[0]?.id}`);
        console.log(`   Recipient: ${messageResponse.data.contacts[0]?.wa_id}`);

        console.log('\n🔍 Test 4: Webhook Status');
        console.log('-'.repeat(60));

        const webhookResponse = await axios.get(`${baseUrl}/webhook/status`);
        console.log(`✅ Webhook configured`);
        console.log(`   URL: ${webhookResponse.data.webhookUrl || 'Not registered'}`);

        console.log('\n' + '='.repeat(60));
        console.log('✅ All tests passed! Mock WhatsApp API is working correctly.');
        console.log('='.repeat(60));
        console.log('\n💡 Next steps:');
        console.log('   1. Open fake WhatsApp app at http://localhost:8082/fake-whatsapp.html');
        console.log('   2. Add phone number 919876543210');
        console.log('   3. You should see the test message appear!');

    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Data:', JSON.stringify(error.response.data, null, 2));
        }
        process.exit(1);
    }
}

// Run tests
testMockAPI();
