require('dotenv').config();

module.exports = {
    app: {
        name: process.env.APP_NAME || 'VY Campaigns',
        port: parseInt(process.env.PORT) || 3000,
        env: process.env.NODE_ENV || 'development',
    },

    jwt: {
        secret: process.env.JWT_SECRET || 'default-secret-change-me',
        accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
        refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
    },

    database: {
        // MySQL config (MongoDB removed)
        mysql: {
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT) || 3306,
            name: process.env.DB_NAME || 'whatsapp_campaign',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
        },
    },


    whatsapp: {
        useMock: process.env.USE_MOCK_WHATSAPP === 'true',
        token: process.env.USE_MOCK_WHATSAPP === 'true'
            ? (process.env.MOCK_WHATSAPP_TOKEN || 'mock_test_token')
            : process.env.WHATSAPP_TOKEN,
        phoneNumberId: process.env.USE_MOCK_WHATSAPP === 'true'
            ? (process.env.MOCK_WHATSAPP_PHONE_NUMBER_ID || '123456789')
            : process.env.WHATSAPP_PHONE_NUMBER_ID,
        businessAccountId: process.env.USE_MOCK_WHATSAPP === 'true'
            ? (process.env.MOCK_WHATSAPP_BUSINESS_ACCOUNT_ID || '123456789')
            : process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
        apiVersion: process.env.WHATSAPP_API_VERSION || 'v20.0',
        apiUrl: process.env.USE_MOCK_WHATSAPP === 'true'
            ? `${process.env.MOCK_WHATSAPP_API_URL || 'http://localhost:3001'}/${process.env.WHATSAPP_API_VERSION || 'v20.0'}`
            : `https://graph.facebook.com/${process.env.WHATSAPP_API_VERSION || 'v20.0'}`,
    },



    webhook: {
        verifyToken: process.env.WEBHOOK_VERIFY_TOKEN || 'your-webhook-verify-token-here',
    },

    messaging: {
        delayMs: parseInt(process.env.MESSAGE_DELAY_MS) || 3000,
    },

    externalApi: {
        contactsUrl: process.env.EXTERNAL_CONTACTS_API_URL,
        contactsApiKey: process.env.EXTERNAL_CONTACTS_API_KEY,
    },
};

