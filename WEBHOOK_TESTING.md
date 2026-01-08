# WhatsApp Webhook Verification Test Commands

## 1. Test Webhook Verification Endpoint (What Meta/WhatsApp Does)

This simulates what WhatsApp does when you configure your webhook URL in WhatsApp Manager.

### Local Testing:
```bash
# Replace YOUR_VERIFY_TOKEN with the value from your .env WEBHOOK_VERIFY_TOKEN
curl "http://localhost:3000/webhook?hub.mode=subscribe&hub.challenge=test_challenge_12345&hub.verify_token=YOUR_VERIFY_TOKEN"
```

**Expected Response:** `test_challenge_12345`

**If using default token from .env:**
```bash
curl "http://localhost:3000/webhook?hub.mode=subscribe&hub.challenge=test_challenge_12345&hub.verify_token=whatsapp_webhook_verify_token_2024"
```

---

### Production Testing (Render):
```bash
# Replace YOUR_VERIFY_TOKEN with the value set in Render environment variables
curl "https://whatsapp-campaign-server.onrender.com/webhook?hub.mode=subscribe&hub.challenge=test_challenge_12345&hub.verify_token=YOUR_VERIFY_TOKEN"
```

**Expected Response:** `test_challenge_12345`

---

## 2. Test Webhook Test Endpoint

### Local:
```bash
curl http://localhost:3000/webhook/test
```

### Production:
```bash
curl https://whatsapp-campaign-server.onrender.com/webhook/test
```

**Expected Response:**
```json
{
  "status": "Webhook is working",
  "timestamp": "2024-01-08T18:43:00.000Z",
  "message": "Send a POST request to this endpoint with a WhatsApp webhook payload"
}
```

---

## 3. Test Webhook POST (Simulate WhatsApp Sending Event)

### Local:
```bash
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "id": "WHATSAPP_BUSINESS_ACCOUNT_ID",
      "changes": [{
        "value": {
          "messaging_product": "whatsapp",
          "metadata": {
            "display_phone_number": "15551234567",
            "phone_number_id": "123456789"
          },
          "messages": [{
            "from": "1234567890",
            "id": "wamid.test123",
            "timestamp": "1704739200",
            "type": "text",
            "text": {
              "body": "Test message from curl"
            }
          }]
        },
        "field": "messages"
      }]
    }]
  }'
```

**Expected Response:** `OK`

### Production:
```bash
curl -X POST https://whatsapp-campaign-server.onrender.com/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "id": "WHATSAPP_BUSINESS_ACCOUNT_ID",
      "changes": [{
        "value": {
          "messaging_product": "whatsapp",
          "metadata": {
            "display_phone_number": "15551234567",
            "phone_number_id": "123456789"
          },
          "messages": [{
            "from": "1234567890",
            "id": "wamid.test123",
            "timestamp": "1704739200",
            "type": "text",
            "text": {
              "body": "Test message from curl"
            }
          }]
        },
        "field": "messages"
      }]
    }]
  }'
```

---

## 4. Test Invalid Webhook Payload (Should Fail Validation)

### Local:
```bash
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "invalid": "payload"
  }' | python3 -m json.tool
```

**Expected Response:**
```json
{
  "error": {
    "message": "Webhook payload validation failed",
    "type": "OAuthException",
    "code": 100,
    "error_subcode": 2494002,
    "fbtrace_id": "..."
  }
}
```

---

## Configuration in WhatsApp Manager

When you configure the webhook in WhatsApp Manager, use these settings:

**Callback URL:**
```
https://whatsapp-campaign-server.onrender.com/webhook
```

**Verify Token:**
```
YOUR_VERIFY_TOKEN
```
(Must match the `WEBHOOK_VERIFY_TOKEN` environment variable in Render)

**Subscribe to Fields:**
- ✅ messages
- ✅ message_template_status_update
- ✅ account_alerts
- ✅ phone_number_quality_update
- ✅ account_review_update

---

## Troubleshooting

### Verification Failed
1. Check that `WEBHOOK_VERIFY_TOKEN` in Render matches what you entered in WhatsApp Manager
2. Test the verification endpoint manually with curl (see command above)
3. Check Render logs for any errors

### Webhook Not Receiving Events
1. Verify webhook is subscribed to fields in WhatsApp Manager
2. Check Render logs to see if requests are coming in
3. Test with curl POST command to ensure endpoint is working
4. Send a test message to your WhatsApp Business number

### Invalid Payload Errors
- Check that your webhook payload matches the official WhatsApp format
- Validation errors will return detailed error information
- Check server logs for validation error details
