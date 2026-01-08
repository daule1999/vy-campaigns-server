# WhatsApp Testing Guide - Bypassing Rate Limits & Account Restrictions

## 🚨 Common Error: "You have a limit on comments, post and other things..."

This error occurs when:
1. **Account is under review** - Your business was disabled/flagged
2. **Rate limiting** - Too many API calls in short time
3. **New account restrictions** - Meta restricts new accounts
4. **Missing business verification** - No website or business info

---

## ✅ Solution: Skip Test Numbers, Use Your Own Phone

You **DON'T need test numbers** to test the API! You can use your own phone number directly.

### Prerequisites:
- ✅ WhatsApp Business API phone number (from your WABA)
- ✅ Access token
- ✅ Your personal WhatsApp number to receive messages

---

## 🚀 Method 1: Send Message via API (Recommended)

### Step 1: Get Your Credentials

From your `.env` file or WhatsApp Manager:
```bash
WHATSAPP_TOKEN=EAABsbCS1iHgBO...         # Temporary access token
WHATSAPP_PHONE_NUMBER_ID=123456789       # Your phone number ID
```

### Step 2: Send a Test Message to Yourself

```bash
# Replace these values:
# - PHONE_NUMBER_ID: Your business phone number ID
# - ACCESS_TOKEN: Your access token
# - RECIPIENT_NUMBER: Your personal WhatsApp number (with country code, no + or spaces)

curl -X POST \
  "https://graph.facebook.com/v23.0/{PHONE_NUMBER_ID}/messages" \
  -H "Authorization: Bearer {ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product": "whatsapp",
    "to": "919876543210",
    "type": "template",
    "template": {
      "name": "hello_world",
      "language": {
        "code": "en_US"
      }
    }
  }'
```

**Example with real values:**
```bash
curl -X POST \
  "https://graph.facebook.com/v23.0/387654321098765/messages" \
  -H "Authorization: Bearer EAABsbCS1iHgBOZAbc123..." \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product": "whatsapp",
    "to": "919876543210",
    "type": "template",
    "template": {
      "name": "hello_world",
      "language": {
        "code": "en_US"
      }
    }
  }'
```

### Expected Response (Success):
```json
{
  "messaging_product": "whatsapp",
  "contacts": [
    {
      "input": "919876543210",
      "wa_id": "919876543210"
    }
  ],
  "messages": [
    {
      "id": "wamid.HBgNOTE5ODc2NTQzMjEwFQIAERgSNEE5N0ZGN0Y0QTdFNEQyNjcA"
    }
  ]
}
```

---

## 🔧 Method 2: Use Your Server's WhatsApp Service

You already have a WhatsApp service! Use it:

```javascript
// test_message.js
const whatsappService = require('./src/services/whatsapp');

async function testMessage() {
  try {
    // Replace with your phone number (with country code, no + or spaces)
    const recipientPhone = '919876543210';
    
    console.log('Sending test message...');
    
    const result = await whatsappService.sendTemplateMessage(
      recipientPhone,
      'hello_world',
      'en_US'
    );
    
    console.log('✅ Message sent successfully!');
    console.log('Message ID:', result.messages[0].id);
    console.log('Recipient:', result.contacts[0].wa_id);
    
  } catch (error) {
    console.error('❌ Error sending message:');
    console.error(error.response?.data || error.message);
  }
}

testMessage();
```

Run it:
```bash
node test_message.js
```

---

## 🎯 Method 3: Using Your Deployed Server API

If your server is already deployed:

```bash
# Replace with your actual values
curl -X POST https://whatsapp-campaign-server.onrender.com/api/whatsapp/send-template \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -d '{
    "to": "919876543210",
    "templateName": "hello_world",
    "languageCode": "en_US"
  }'
```

---

## 📱 Important: Phone Number Format

WhatsApp requires phone numbers in **E.164 format** (no `+`, `-`, or spaces):

| Country | Format | Example |
|---------|--------|---------|
| India | 91XXXXXXXXXX | 919876543210 |
| USA | 1XXXXXXXXXX | 14155552671 |
| UK | 44XXXXXXXXXX | 447975777666 |

**Your format should be:** `{country_code}{phone_number}`

---

## 🔐 Getting Your Access Token

### Option 1: Temporary Token (24 hours)
1. Go to [Meta Developers Console](https://developers.facebook.com/)
2. Select your app
3. Go to WhatsApp → API Setup
4. Copy the "Temporary access token"
5. Use it immediately (expires in 24 hours)

### Option 2: Permanent Token (Recommended for Production)
1. Go to Meta Business Settings
2. Click "System Users" → Create/Select User
3. Click "Generate New Token"
4. Select your app
5. Select permissions:
   - `whatsapp_business_messaging` ✅
   - `whatsapp_business_management` ✅
6. Generate token
7. **Save it securely** - you can't see it again!

---

## 🛠️ Troubleshooting

### Error: "Account restricted"
**Solution:** Your account is under review due to earlier suspension
- **Fix business profile** (add website, business info)
- **Request review** in WhatsApp Manager
- **Wait 24-48 hours** for review
- Meanwhile, you can still test with API if you have valid tokens

### Error: "No template found"
**Solution:** Use the default `hello_world` template (pre-approved)
```json
{
  "template": {
    "name": "hello_world",
    "language": { "code": "en_US" }
  }
}
```

### Error: "Invalid phone number"
**Solution:** Check format
- ✅ Correct: `919876543210`
- ❌ Wrong: `+91 98765 43210`
- ❌ Wrong: `+919876543210`

### Error: "(#131030) Recipient phone number not in allowed list"
**Solution:** Only during testing phase
1. Go to WhatsApp Manager → Phone Numbers
2. Click your phone number
3. Scroll to "Manage phone number list"
4. Add your personal number to the list
5. Wait 5 minutes
6. Try again

### Error: "Invalid access token"
**Solution:**
- Generate a new temporary token from Developer Console
- Or create a permanent system user token
- Update your `.env` file with the new token

---

## ✅ Quick Testing Checklist

**Before you send:**
- [ ] You have a valid access token (check `.env`)
- [ ] You have the phone number ID (check `.env`)
- [ ] Your personal WhatsApp number is in E.164 format
- [ ] If in testing mode, your number is on the allowed list
- [ ] The `hello_world` template exists (it's default, should be there)

**After sending:**
- [ ] Check the API response for message ID
- [ ] Check your WhatsApp for the message
- [ ] Check server logs for any errors
- [ ] Check webhook events if configured

---

## 🎬 Complete Test Flow

### 1. Update .env with valid credentials
```bash
WHATSAPP_TOKEN=EAABsbCS1iHgBO...
WHATSAPP_PHONE_NUMBER_ID=123456789
```

### 2. Create test script
```javascript
// quick_test.js
const axios = require('axios');

const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
const token = process.env.WHATSAPP_TOKEN;
const recipientNumber = '919876543210'; // YOUR phone number

async function sendTestMessage() {
  try {
    const response = await axios.post(
      `https://graph.facebook.com/v23.0/${phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        to: recipientNumber,
        type: 'template',
        template: {
          name: 'hello_world',
          language: { code: 'en_US' }
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Success!');
    console.log('Message ID:', response.data.messages[0].id);
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

sendTestMessage();
```

### 3. Run test
```bash
node quick_test.js
```

---

## 🚦 If Account is Still Restricted

If you can't send messages due to account restrictions:

1. **Fix Business Profile:**
   - Add a valid website URL
   - Complete business information
   - Upload business documents if requested

2. **Request Review:**
   - Go to WhatsApp Manager
   - Look for "Request Review" button
   - Submit documentation

3. **Wait for Approval:**
   - Usually takes 24-48 hours
   - Check email for updates

4. **Alternative (Immediate Testing):**
   - Create a new test app
   - Use a different phone number
   - Follow proper verification from the start

---

## 📞 Support

If you continue having issues:
- Check [WhatsApp Business API Status](https://status.fb.com/)
- Review [Meta Business Help Center](https://business.facebook.com/business/help)
- Contact Meta Business Support through Business Manager

---

**Bottom Line:** You don't need test numbers. Use your own phone number and send messages directly via the API!
