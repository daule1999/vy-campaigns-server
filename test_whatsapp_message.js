// Quick WhatsApp Message Test Script
// Run this to send a test message using your server's WhatsApp service

const whatsappService = require('./src/services/whatsapp');

// Configuration
const RECIPIENT_NUMBER = '919876543210'; // REPLACE with your WhatsApp number (country code + number, no + or spaces)
const TEMPLATE_NAME = 'hello_world';
const LANGUAGE_CODE = 'en_US';

async function sendTestMessage() {
    console.log('🚀 WhatsApp Test Message\n');
    console.log('Configuration:');
    console.log(`  To: ${RECIPIENT_NUMBER}`);
    console.log(`  Template: ${TEMPLATE_NAME}`);
    console.log(`  Language: ${LANGUAGE_CODE}\n`);

    // Check if WhatsApp is configured
    if (!whatsappService.isConfigured()) {
        console.error('❌ WhatsApp service is not configured!');
        console.error('\nPlease check your .env file has:');
        console.error('  - WHATSAPP_TOKEN');
        console.error('  - WHATSAPP_PHONE_NUMBER_ID');
        console.error('  - WHATSAPP_API_URL\n');
        process.exit(1);
    }

    try {
        console.log('📤 Sending message...\n');

        const result = await whatsappService.sendTemplateMessage(
            RECIPIENT_NUMBER,
            TEMPLATE_NAME,
            LANGUAGE_CODE
        );

        console.log('✅ Message sent successfully!\n');
        console.log('Response:');
        console.log(`  Message ID: ${result.messages[0].id}`);
        console.log(`  Recipient: ${result.contacts[0].wa_id}`);
        console.log(`  Input: ${result.contacts[0].input}\n`);

        console.log('📱 Check your WhatsApp for the message!');

    } catch (error) {
        console.error('❌ Error sending message:\n');

        if (error.response?.data) {
            console.error('API Error Response:');
            console.error(JSON.stringify(error.response.data, null, 2));

            // Common error explanations
            const errorCode = error.response.data.error?.code;
            const errorMessage = error.response.data.error?.message;

            console.error('\n📋 Error Details:');
            console.error(`  Code: ${errorCode}`);
            console.error(`  Message: ${errorMessage}\n`);

            // Provide solutions for common errors
            if (errorCode === 131030) {
                console.error('💡 Solution: Recipient number not in allowed list');
                console.error('   1. Go to WhatsApp Manager');
                console.error('   2. Click on your phone number');
                console.error('   3. Add recipient to "Manage phone number list"');
                console.error('   4. Wait 5 minutes and try again\n');
            } else if (errorCode === 190) {
                console.error('💡 Solution: Invalid access token');
                console.error('   1. Generate a new token in Developer Console');
                console.error('   2. Update WHATSAPP_TOKEN in .env file');
                console.error('   3. Try again\n');
            } else if (errorCode === 100) {
                console.error('💡 Solution: Invalid parameter');
                console.error('   Check phone number format: should be like 919876543210');
                console.error('   (country code + number, no + or spaces)\n');
            } else if (errorCode === 132000) {
                console.error('💡 Solution: Template not found');
                console.error('   The template "hello_world" should exist by default');
                console.error('   Check template name or create a new one\n');
            }

        } else {
            console.error(error.message);
        }

        process.exit(1);
    }
}

// Additional test: Send a free-form text message (only works within 24-hour window)
async function sendTextMessage() {
    console.log('📤 Sending free-form text message...\n');

    try {
        const result = await whatsappService.sendFreeTextMessage(
            RECIPIENT_NUMBER,
            'Hello! This is a test message from your WhatsApp server.'
        );

        console.log('✅ Text message sent!\n');
        console.log(`  Message ID: ${result.messages[0].id}\n`);

    } catch (error) {
        console.error('❌ Text message failed:');
        console.error('   Note: Free-form messages only work within 24-hour customer window');
        console.error('   Use template messages to initiate conversation\n');
    }
}

// Run tests
console.log('================================================');
console.log('        WhatsApp API Test Suite');
console.log('================================================\n');

sendTestMessage()
    .then(() => {
        console.log('\n================================================');
        console.log('Test completed!');
        console.log('================================================\n');
    })
    .catch(error => {
        console.error('\nTest failed:', error.message);
        process.exit(1);
    });
