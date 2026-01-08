# WhatsApp Business API - Messaging Limits & Embedded Signup Explained

This document explains two critical Meta WhatsApp Business API concepts in simple terms.

---

## Part 1: Messaging Limits

### What Are Messaging Limits?

**Simple Definition**: The maximum number of **unique customers** you can send business-initiated messages to in a 24-hour period.

### Key Points:

#### What It Applies To:
- ✅ **Business-initiated messages** (messages YOU send first, like marketing campaigns)
- ❌ **NOT customer service messages** (replies within 24 hours of customer contact)

#### Example Scenarios:

**Scenario 1 - Within Limit:**
- You send 100 broadcast messages to 100 different customers
- This counts as **100 unique contacts** against your limit

**Scenario 2 - Customer Service (NOT counted):**
- Customer messages you: "What's my order status?"
- You reply within 24 hours: "Your order is on the way"
- This is **FREE and doesn't count** against your messaging limit

**Scenario 3 - Multiple Messages:**
- You send 5 messages to the same customer in 24 hours
- This counts as **only 1 unique contact** (not 5)

---

### Messaging Limit Tiers (2025)

#### Starting Tier:
```
NEW BUSINESS → 250 messages/day
```

All new WhatsApp Business accounts start here.

#### Scaling Tiers:
```
Tier 1: 250 messages/day     (Starting limit)
   ↓
Tier 2: 2,000 messages/day   (After completing scaling path)
   ↓
Tier 3: 10,000 messages/day  (Automatic scaling)
   ↓
Tier 4: 100,000 messages/day (Automatic scaling)
   ↓
Tier 5: UNLIMITED            (Automatic scaling)
```

---

### How to Increase Your Limit

#### Step 1: Get to 2,000 (Do ONE of these):

**Option A: Business Verification** ⭐ Recommended
- Verify your business with Meta
- Fastest and most reliable method
- **How**: Through Meta Business Manager or your BSP

**Option B: Volume Path**
- Send 2,000 delivered messages to unique customers
- Within a 30-day period
- Must use high-quality templates
- Messages must be outside customer service window

**Option C: BSP Verification**
- Have your BSP (like WATI, Interakt) verify your business
- They handle the verification process

#### Step 2: Automatic Scaling (2,000 → Unlimited)

Once you reach 2,000, Meta automatically increases your limit if:
1. ✅ You send **high-quality messages** (good templates, low complaints)
2. ✅ You use **at least 50%** of your current limit in the last 7 days

**Timeline**: If criteria met, increase happens within **6 hours**

---

### Practical Example: Scaling Journey

**Your E-commerce Store Timeline:**

📅 **Day 1**: 
- Start with limit: 250/day
- Action: Complete business verification

📅 **Day 3**:
- Meta approves verification
- **New limit: 2,000/day**

📅 **Day 10**:
- You've sent 1,200 messages in last 7 days (60% of 2,000 limit)
- All messages have high quality rating
- Meta automatically increases
- **New limit: 10,000/day**

📅 **Day 20**:
- You've sent 6,500 messages in last 7 days (65% of 10,000)
- Quality rating still high
- **New limit: 100,000/day**

📅 **Day 35**:
- You've sent 55,000 messages in last 7 days
- **New limit: UNLIMITED** 🎉

---

### Important Notes

#### Shared Across Portfolio:
If you have multiple WhatsApp numbers (8485835675, another number), they **share** the same limit.

**Example:**
- Your portfolio limit: 2,000/day
- Number 1 sends 1,500 messages
- Number 2 can only send 500 messages (not another 2,000)

#### What Meta Monitors:
- **Quality Rating**: Customer complaints, blocks affect your quality
- **Template Approval**: Only use approved templates
- **Delivery Rate**: Ensure messages are being delivered

#### If Quality Drops:
- ⚠️ Meta can **reduce** your limit
- ⚠️ Your number can be **flagged** or **restricted**

---

### Checking Your Current Limit

#### Method 1: Via WhatsApp Manager (Easy)
1. Go to WhatsApp Manager
2. Click **Account tools** → **Messaging limits**
3. See your current tier

#### Method 2: Via API (For Developers)
```bash
curl 'https://graph.facebook.com/v24.0/YOUR_PHONE_NUMBER_ID?fields=whatsapp_business_manager_messaging_limit' \
-H 'Authorization: Bearer YOUR_ACCESS_TOKEN'
```

**Response Example:**
```json
{
  "whatsapp_business_manager_messaging_limit": "TIER_2000",
  "id": "106540352242922"
}
```

Possible values: `TIER_250`, `TIER_2000`, `TIER_10000`, `TIER_100000`, `TIER_UNLIMITED`

---

## Part 2: Embedded Signup

### What Is Embedded Signup?

**Simple Definition**: The automated process that BSPs (like WATI, Interakt) use to connect your phone number to WhatsApp Business API.

**Think of it as**: The "signup wizard" that onboards your business to WhatsApp API.

---

### How It Works (Behind the Scenes)

When you sign up with a BSP like WATI:

#### Step 1: You Click "Sign Up" on BSP Website
BSP's website launches the Embedded Signup flow

#### Step 2: Authentication Window Opens
You're presented with a Meta login screen where you:
- Log in with your Facebook/Meta credentials
- Or create a new Meta Business account

#### Step 3: Business Setup (Automated)
The flow guides you through:
1. ✅ Select or create a **Business Portfolio**
2. ✅ Select or create a **WhatsApp Business Account (WABA)**
3. ✅ Enter and verify your phone number (8485835675)
4. ✅ Set your business **display name**
5. ✅ Accept Meta's terms of service

#### Step 4: Permissions
You grant the BSP app permission to:
- Manage your WhatsApp Business Account
- Send/receive messages on your behalf
- Access message templates

#### Step 5: BSP Completes Setup
The BSP receives:
- Your WABA ID
- Your business phone number ID
- Access token to manage your account

Then they automatically:
- Register your number for Cloud API
- Set up webhooks
- Configure payment (if Solution Partner)

---

### What Gets Created Automatically

```
Embedded Signup Flow
        ↓
Meta Creates (Automatically):
├── Business Portfolio (or uses existing)
├── WhatsApp Business Account (WABA)
├── Business Phone Number Registration
├── Display Name Submission
└── Access Tokens for BSP
```

---

### Key Features of Embedded Signup

#### 1. **Asset Ownership**
- ✅ **YOU own everything**: Your WABA, phone number, templates
- ✅ You can access WhatsApp Manager directly
- ✅ You can switch BSPs later
- ⚠️ BSP cannot lock you in or restrict your access

#### 2. **Coexistence Support**
- ✅ Can connect existing WhatsApp Business App number
- ✅ Enables hybrid mode (App + API simultaneously)
- ✅ Syncs chat history up to 6 months

#### 3. **Limitations**

**Onboarding Limits for BSPs:**
- Default: 10 new customers per week
- After verification: 200 customers per week
- Enterprise partners: Unlimited

**For New Businesses:**
- Start with messaging limit: 250/day
- Must verify phone number via SMS/call
- Display name needs approval (1-3 days)

---

### Embedded Signup vs Manual Setup

| Aspect | Embedded Signup (via BSP) | Manual Setup |
|--------|---------------------------|--------------|
| **Time** | 5-10 minutes | 2-4 hours |
| **Complexity** | Simple wizard | Technical knowledge needed |
| **Assets Created** | Automatic | Manual configuration |
| **Integration** | BSP handles it | You code everything |
| **Support** | BSP provides support | DIY |
| **Cost** | BSP subscription fee | Developer time |

---

### Real-World Example: Your Onboarding with WATI

**What You Do:**
1. Visit WATI website → Click "Sign Up"
2. Click "Connect WhatsApp Number"
3. Login with Facebook/Meta account
4. Select "Create new Business Portfolio"
5. Enter phone number: 8485835675
6. Verify via SMS code
7. Enter display name: "VY Campaigns"
8. Accept terms

**What Happens Behind the Scenes:**
1. Embedded Signup creates your WABA
2. Registers 8485835675 for Cloud API
3. WATI receives your WABA ID and access tokens
4. WATI sets up webhooks to receive messages
5. WATI configures API endpoints
6. Display name sent for Meta approval

**Result:**
- ✅ You can log into WhatsApp Manager
- ✅ You can log into WATI dashboard
- ✅ After display name approval, you can start messaging

**Timeline:**
- Setup: 10 minutes
- Display name approval: 1-3 days
- Total time to first message: 1-3 days

---

### Important Permissions Explained

When you complete Embedded Signup, you grant these permissions:

#### `whatsapp_business_management`
Allows BSP to:
- View/edit message templates
- View WABA settings
- View analytics

#### `whatsapp_business_messaging`
Allows BSP to:
- Send messages on your behalf
- Receive incoming messages
- Manage phone number settings

**Note**: You can revoke these permissions anytime in Meta Business Suite

---

### Sandbox Testing (For Developers/BSPs)

If you're testing or building integrations:

**Sandbox Account Features:**
- Test Embedded Signup without real phone number
- Valid for 30 days
- Cannot send actual messages
- No clutter in your real Facebook account

**How to Claim:**
1. Go to App Dashboard → WhatsApp → Quickstart
2. Click "Claim sandbox account"
3. Test the flow

---

### 555 Test Numbers

**What They Are:**
- Special test phone numbers with +1-555-XXX-XXXX format
- Behave like real numbers (pricing, quality ratings)
- US-based only
- Auto-verified
- Each business can claim up to 2

**Use Case:**
- Testing before using your real business number
- Development and staging environments

---

## Summary: Why These Matter to You

### Messaging Limits:
- **Start**: 250 messages/day
- **Goal**: Get verified quickly to reach 2,000
- **Strategy**: Send high-quality messages consistently
- **Watch**: Quality rating and template approvals

### Embedded Signup:
- **What**: The onboarding process BSPs use
- **Benefit**: Fast, automated setup (minutes vs hours)
- **Ownership**: You own everything, full control
- **Result**: Quick path to start messaging

---

## Practical Recommendations for Your Business

### Day 1 Actions:
1. ✅ Choose your BSP (Interakt/WATI recommended for India)
2. ✅ Sign up and complete Embedded Signup
3. ✅ Immediately apply for business verification
4. ✅ Create 2-3 message templates for approval

### Week 1 Goals:
1. ✅ Get business verification approved
2. ✅ Get display name approved
3. ✅ Get message templates approved
4. ✅ Reach 2,000 messaging limit tier

### Month 1 Goals:
1. ✅ Send consistent, high-quality messages
2. ✅ Maintain good quality rating
3. ✅ Auto-scale to 10,000 limit
4. ✅ Build customer engagement workflows

---

## Official Meta Documentation Links

1. **Messaging Limits Official Doc**  
   https://developers.facebook.com/docs/whatsapp/messaging-limits

2. **Embedded Signup Official Doc**  
   https://developers.facebook.com/docs/whatsapp/embedded-signup

3. **WhatsApp Manager (Check Your Limits)**  
   https://business.facebook.com/wa/manage/

4. **Meta Business Suite**  
   https://business.facebook.com

---

**Document Created**: January 8, 2026  
**Source**: Meta for Developers Official Documentation  
**Simplified by**: VY Campaigns Technical Team

