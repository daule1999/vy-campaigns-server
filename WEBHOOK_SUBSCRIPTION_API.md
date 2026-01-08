# WhatsApp Webhook Subscription via API

## Overview

Subscribe your WhatsApp Business App to webhook events programmatically using the Graph API instead of manual UI configuration.

---

## Prerequisites

1. **WhatsApp Business Account ID** (WABA ID)
2. **Access Token** with `whatsapp_business_management` permission
3. **App ID** of your WhatsApp Business App

---

## Method 1: Subscribe to Webhook Fields (Recommended)

### API Endpoint:
```
POST https://graph.facebook.com/v23.0/{whatsapp-business-account-id}/subscribed_apps
```

### Subscribe to All Webhook Fields

```bash
# Replace with your values:
# - WABA_ID: Your WhatsApp Business Account ID
# - ACCESS_TOKEN: Your system user access token

curl -X POST "https://graph.facebook.com/v23.0/{WABA_ID}/subscribed_apps" \
  -H "Authorization: Bearer {ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "subscribed_fields": [
      "messages",
      "message_template_status_update",
      "account_alerts",
      "phone_number_quality_update",
      "account_review_update"
    ]
  }'
```

### Subscribe to Specific Fields Only

```bash
curl -X POST "https://graph.facebook.com/v23.0/{WABA_ID}/subscribed_apps" \
  -H "Authorization: Bearer {ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "subscribed_fields": ["messages", "message_template_status_update"]
  }'
```

### Expected Response (Success):
```json
{
  "success": true
}
```

---

## Method 2: Update App Subscription

If you already have a subscription, you can update it:

```bash
curl -X POST "https://graph.facebook.com/v23.0/{WABA_ID}/subscribed_apps" \
  -H "Authorization: Bearer {ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "override_subscriptions": true,
    "subscribed_fields": [
      "messages",
      "message_template_status_update",
      "account_alerts",
      "phone_number_quality_update",
      "account_review_update",
      "message_echoes",
      "message_reactions"
    ]
  }'
```

---

## Available Webhook Fields

| Field | Description |
|-------|-------------|
| `messages` | Incoming messages and message status updates (sent, delivered, read, failed) |
| `message_template_status_update` | Template approval/rejection notifications |
| `account_alerts` | Account warnings and policy violations |
| `phone_number_quality_update` | Phone number quality rating changes |
| `account_review_update` | Business account review status changes |
| `message_echoes` | Messages sent by your business (cloud API only) |
| `message_reactions` | Emoji reactions to messages |
| `account_update` | Business account information updates |
| `business_capability_update` | Changes to business capabilities |

---

## Complete Setup Script

### Using Environment Variables

```bash
#!/bin/bash

# WhatsApp API Configuration
WABA_ID="your_whatsapp_business_account_id"
ACCESS_TOKEN="your_system_user_access_token"
GRAPH_API_VERSION="v23.0"

# Subscribe to webhook fields
echo "Subscribing to webhook fields..."

response=$(curl -s -X POST \
  "https://graph.facebook.com/${GRAPH_API_VERSION}/${WABA_ID}/subscribed_apps" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "subscribed_fields": [
      "messages",
      "message_template_status_update",
      "account_alerts",
      "phone_number_quality_update",
      "account_review_update"
    ]
  }')

echo "Response: $response"

if echo "$response" | grep -q '"success":true'; then
    echo "✅ Successfully subscribed to webhook fields!"
else
    echo "❌ Subscription failed. Check your WABA_ID and ACCESS_TOKEN"
    echo "$response"
fi
```

---

## Verify Current Subscriptions

### Get Current Subscribed Fields

```bash
curl -X GET \
  "https://graph.facebook.com/v23.0/{WABA_ID}/subscribed_apps?access_token={ACCESS_TOKEN}"
```

### Expected Response:
```json
{
  "data": [
    {
      "whatsapp_business_api_data": {
        "subscribed_fields": [
          "messages",
          "message_template_status_update",
          "account_alerts",
          "phone_number_quality_update",
          "account_review_update"
        ]
      }
    }
  ]
}
```

---

## Node.js Implementation

### Create Subscription Script

```javascript
// subscribe_webhooks.js
const axios = require('axios');

const WABA_ID = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
const ACCESS_TOKEN = process.env.WHATSAPP_SYSTEM_USER_TOKEN;
const GRAPH_API_VERSION = 'v23.0';

async function subscribeToWebhooks() {
  try {
    const response = await axios.post(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${WABA_ID}/subscribed_apps`,
      {
        subscribed_fields: [
          'messages',
          'message_template_status_update',
          'account_alerts',
          'phone_number_quality_update',
          'account_review_update'
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.success) {
      console.log('✅ Successfully subscribed to webhook fields!');
      return true;
    } else {
      console.error('❌ Subscription failed:', response.data);
      return false;
    }
  } catch (error) {
    console.error('❌ Error subscribing to webhooks:');
    console.error('Status:', error.response?.status);
    console.error('Error:', error.response?.data?.error);
    return false;
  }
}

async function verifySubscription() {
  try {
    const response = await axios.get(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${WABA_ID}/subscribed_apps`,
      {
        params: { access_token: ACCESS_TOKEN }
      }
    );

    console.log('\n📋 Current Subscriptions:');
    const fields = response.data.data[0]?.whatsapp_business_api_data?.subscribed_fields || [];
    fields.forEach(field => console.log(`  ✓ ${field}`));
    
    return fields;
  } catch (error) {
    console.error('❌ Error verifying subscriptions:', error.response?.data);
    return [];
  }
}

async function main() {
  console.log('🚀 WhatsApp Webhook Subscription Setup\n');
  
  // Subscribe to webhook fields
  const subscribed = await subscribeToWebhooks();
  
  if (subscribed) {
    // Verify subscription
    await verifySubscription();
  }
}

main();
```

### Run the Script:
```bash
node subscribe_webhooks.js
```

---

## Troubleshooting

### Error: "Invalid OAuth access token"
**Solution:** Your access token is incorrect or expired
```bash
# Generate a new access token from Meta Business Settings
# Navigate to: System Users → Select User → Generate New Token
```

### Error: "Insufficient permissions"
**Solution:** Your access token needs `whatsapp_business_management` permission
```bash
# When generating token, ensure these permissions are checked:
# ✅ whatsapp_business_management
# ✅ whatsapp_business_messaging
```

### Error: "Invalid WhatsApp Business Account ID"
**Solution:** Verify your WABA ID
```bash
# Get your WABA ID from WhatsApp Manager
# Or use this API call:
curl "https://graph.facebook.com/v23.0/debug_token?input_token={ACCESS_TOKEN}&access_token={ACCESS_TOKEN}"
```

### Subscription Not Working
1. Ensure webhook is verified first (callback URL configured)
2. Check that your app has permissions to the WABA
3. Verify access token has not expired
4. Ensure WABA is not in restricted mode

---

## Complete Setup Checklist

Before subscribing via API:

- [ ] ✅ Webhook callback URL configured and verified
- [ ] ✅ WEBHOOK_VERIFY_TOKEN set in environment
- [ ] ✅ System user access token generated
- [ ] ✅ Access token has `whatsapp_business_management` permission
- [ ] ✅ App is added to WhatsApp Business Account
- [ ] ✅ WABA ID obtained

After subscribing:

- [ ] ✅ Verify subscription with GET request
- [ ] ✅ Test by sending a message to your business number
- [ ] ✅ Check server logs for incoming webhooks
- [ ] ✅ Verify database logging is working

---

## Environment Variables Needed

Add these to your `.env` file:

```bash
# WhatsApp Business Account ID (WABA ID)
WHATSAPP_BUSINESS_ACCOUNT_ID=123456789012345

# System User Access Token (from Meta Business Settings)
WHATSAPP_SYSTEM_USER_TOKEN=your_long_access_token_here

# Webhook Verify Token (your custom secret)
WEBHOOK_VERIFY_TOKEN=whatsapp_webhook_verify_token_2024

# Phone Number ID
WHATSAPP_PHONE_NUMBER_ID=987654321098765

# WhatsApp Access Token (for sending messages)
WHATSAPP_TOKEN=your_whatsapp_api_token
```

---

## Quick Reference

### Subscribe:
```bash
POST https://graph.facebook.com/v23.0/{WABA_ID}/subscribed_apps
Body: {"subscribed_fields": ["messages", "..."]}
```

### Verify:
```bash
GET https://graph.facebook.com/v23.0/{WABA_ID}/subscribed_apps
```

### Unsubscribe:
```bash
DELETE https://graph.facebook.com/v23.0/{WABA_ID}/subscribed_apps
```

---

**Note:** You still need to configure the webhook callback URL and verify token through the Meta Developer Portal or WhatsApp Manager UI first. The subscription API only manages which fields you want to receive events for.
