# WhatsApp Business API - Existing Number Migration Guide

This document explains the new WhatsApp Business API updates regarding using an existing WhatsApp Business account number to create a WhatsApp API connection.

## Executive Summary

**Yes, you can now use your existing WhatsApp Business account number (8485835675) with the WhatsApp Cloud API**, thanks to Meta's new "**WhatsApp Coexistence**" feature launched on **May 6, 2025**.

---

## Key Questions Answered

### 1. Will it sync all existing data (more than one year) before starting the API?

**Answer: Partial Sync - Up to 6 months only**

- **Chat History**: WhatsApp Coexistence syncs **up to 6 months** of chat history, NOT the entire data from more than one year
- **Contacts**: Your contacts will be synchronized
- **Business Profile**: Your business profile information is retained
- **Older Data**: Messages older than 6 months will NOT be migrated

**Official Documentation:**
- [WhatsApp Coexistence Documentation](https://developers.facebook.com/docs/whatsapp/business-messaging/webhook/onboarding-whatsapp-business-app-users)

### 2. Can you use your existing WhatsApp Business account (8485835675)?

**Answer: YES**

With the WhatsApp Coexistence feature, you can:
- Use your existing WhatsApp Business App number
- Connect it to the WhatsApp Cloud API
- No need to delete your existing account
- No loss of recent chat history (6 months)

**Requirements:**
- WhatsApp Business App version **2.24.17 or higher**
- Your country must be supported (see limitations below)
- Access to Meta Business Manager

**Official Documentation:**
- [Migrate Existing WhatsApp Number](https://developers.facebook.com/docs/whatsapp/cloud-api/get-started/migrate-existing-whatsapp-number-to-a-business-account)

### 3. Will it work as hybrid mode or completely in API only?

**Answer: HYBRID MODE (Coexistence)**

WhatsApp Coexistence allows you to use **BOTH simultaneously**:

#### What You Can Do:
- **WhatsApp Business App**: Continue using for manual, one-to-one conversations, calls, groups, and product catalogs
- **WhatsApp Cloud API**: Use for automation, chatbots, bulk messages, CRM integrations
- **Seamless Sync**: Messages sent or received on either platform are automatically synchronized

#### How It Works:
1. You keep your WhatsApp Business App installed and active on your device
2. You connect the same number to the Cloud API through Embedded Signup
3. Both platforms work together - messages sync automatically
4. You get the best of both worlds: personal touch + automation power

**Official Documentation:**
- [WhatsApp Coexistence Official Blog](https://developers.facebook.com/blog/post/2025/05/06/whatsapp-coexistence-launch/)
- [Meta for Developers - Coexistence Guide](https://developers.facebook.com/docs/whatsapp/business-messaging/webhook/onboarding-whatsapp-business-app-users)

---

## Important Limitations of WhatsApp Coexistence

### 1. Throughput Limit
- Fixed at **20 messages per second** when using both App and API together
- If you need higher throughput (up to 500 MPS), you must use API-only mode

### 2. Feature Restrictions
The following features are **NOT supported** in Coexistence mode:
- Message edit/revoke
- Group chats via Cloud API (groups only work on the app)
- Disappearing messages
- View once messages
- Live location messages

### 3. Regional Restrictions
Coexistence is **NOT available** in these regions (as of September 2025):
- European Economic Area (EEA)
- European Union (EU)
- United Kingdom
- Australia
- Japan
- Nigeria
- Philippines
- Russia
- South Korea
- South Africa
- Turkey

### 4. Other Requirements
- The WhatsApp Business App must remain **installed and active** on the device
- Companion devices will be disconnected during setup and need manual reconnection
- Meta Verified Status may be lost when connecting to Coexistence

**Official Documentation:**
- [Coexistence Limitations](https://developers.facebook.com/docs/whatsapp/business-messaging/webhook/onboarding-whatsapp-business-app-users)

---

## Migration Process Overview

### Prerequisites
1. **Updated App**: WhatsApp Business App version 2.24.17 or higher
2. **Meta Business Manager**: Verified account with admin access
3. **Display Name**: Approved display name for your business
4. **2FA**: Disable two-factor authentication before migration
5. **Payment Method**: Valid payment method configured

### Steps to Migrate
1. **Backup**: Backup your WhatsApp Business App chats (optional but recommended)
2. **Embedded Signup**: Use Embedded Signup flow provided by your solution provider
3. **QR Code Scan**: Scan QR code from WhatsApp Business App to link accounts
4. **Sync Process**: Wait for chat history and contacts to sync (up to 6 months)
5. **Verification**: Verify the phone number via SMS or voice call
6. **Start Using**: Begin using both App and API simultaneously

**Official Documentation:**
- [Get Started with Cloud API](https://developers.facebook.com/docs/whatsapp/cloud-api/get-started)
- [Embedded Signup Flow](https://developers.facebook.com/docs/whatsapp/embedded-signup)

---

## Alternative: API-Only Migration (Without Coexistence)

If you want to use **API only** (not hybrid mode):

### What Happens:
- You must **delete** your WhatsApp Business App account
- **NO chat history** is transferred (must backup manually)
- You get higher throughput (up to 500 MPS)
- Cannot use WhatsApp Business App anymore

### Process:
1. Backup all important chats from WhatsApp Business App
2. Delete your WhatsApp account: Settings > Account > Delete my account
3. Wait a few minutes for the number to become available
4. Register the number via Meta Business Manager or App Dashboard
5. Verify the number via SMS or voice call
6. Start using API only

**Official Documentation:**
- [Phone Number Management](https://developers.facebook.com/docs/whatsapp/cloud-api/phone-numbers)

---

## Recommended Approach for Your Number (8485835675)

Based on your question, I recommend:

### Use **WhatsApp Coexistence (Hybrid Mode)**

**Pros:**
✅ Keep your existing WhatsApp Business App  
✅ Sync up to 6 months of chat history automatically  
✅ Use both manual conversations AND automation  
✅ No disruption to current operations  
✅ Seamless transition  
✅ Retain contacts and business profile  

**Cons:**
❌ Only 6 months of history (not your full year+)  
❌ Limited to 20 messages per second  
❌ Some features not available (groups via API, etc.)  

### Manual Backup for Older Data
Since Coexistence only syncs 6 months:
1. Manually export/backup chats older than 6 months if needed
2. Store them separately for reference
3. Use Coexistence for recent operational data

---

## Official Meta Resources

### Primary Documentation
1. **WhatsApp Cloud API Overview**  
   https://developers.facebook.com/docs/whatsapp/cloud-api

2. **Coexistence Feature (Hybrid Mode)**  
   https://developers.facebook.com/docs/whatsapp/business-messaging/webhook/onboarding-whatsapp-business-app-users

3. **Migrate Existing Number**  
   https://developers.facebook.com/docs/whatsapp/cloud-api/get-started/migrate-existing-whatsapp-number-to-a-business-account

4. **Embedded Signup**  
   https://developers.facebook.com/docs/whatsapp/embedded-signup

5. **Phone Number Management**  
   https://developers.facebook.com/docs/whatsapp/cloud-api/phone-numbers

### Meta Announcements
- **Coexistence Launch Blog** (May 6, 2025)  
  https://developers.facebook.com/blog/post/2025/05/06/whatsapp-coexistence-launch/

### Community Resources
- WhatsApp Business API Forum  
  https://developers.facebook.com/community/whatsapp-business

---

## Next Steps

1. **Verify Requirements**:
   - Check your WhatsApp Business App version (must be 2.24.17+)
   - Ensure you're not in a restricted region
   - Verify Meta Business Manager access

2. **Choose Your Approach**:
   - **Hybrid Mode (Recommended)**: Use Coexistence for seamless transition
   - **API Only**: If you need >20 MPS throughput and don't need the app

3. **Plan Migration**:
   - Backup important chats (especially >6 months old)
   - Schedule migration during low-traffic period
   - Test with a development/test number first if possible

4. **Execute**:
   - Follow the Embedded Signup flow
   - Scan QR code to link accounts
   - Wait for sync to complete
   - Test both App and API functionality

5. **Monitor**:
   - Verify message syncing works correctly
   - Test automation flows via API
   - Ensure manual conversations work on App

---

## Conclusion

**You CAN use your existing WhatsApp Business account (8485835675) with the new WhatsApp Cloud API in hybrid mode.** The WhatsApp Coexistence feature will sync up to 6 months of chat history, but you won't get data older than that. It will work in hybrid mode, allowing you to use both the WhatsApp Business App and the API simultaneously.

For data older than 6 months, consider manual backup/export before migration.

---

## Do You Need Third-Party Software or Does Meta Provide an Interface?

### Short Answer: **You Need to Choose Between Native Meta Tools (Limited) OR Third-Party BSP Platforms (Full-Featured)**

The WhatsApp Business API is **backend-only** - it doesn't come with a built-in chat interface, agent management system, or message editor. You have two main options:

---

### Option 1: Meta's Native Tools (Limited Features)

#### What Meta Provides for FREE:

**1. Meta Business Suite Inbox**
- **What it is**: Centralized messaging platform for WhatsApp, Facebook Messenger, and Instagram
- **Features**:
  - Basic inbox to view and respond to messages
  - Assign conversations to team members
  - Basic automated responses (limited)
  - Message templates management
- **Limitations**:
  - ❌ No advanced chatbot builder
  - ❌ No bulk messaging tools
  - ❌ Basic analytics only
  - ❌ Limited automation capabilities
  - ❌ No advanced CRM integrations

**Official Link**: [Meta Business Suite](https://business.facebook.com/latest/inbox/all)

**2. WhatsApp Manager**
- **What it is**: Management dashboard for WhatsApp Business accounts
- **Features**:
  - Phone number management
  - Message template creation and approval
  - Quality rating monitoring
  - Basic analytics
  - Payment settings
- **Limitations**:
  - ❌ NOT a messaging interface (cannot send/receive messages here)
  - ❌ Only for configuration and monitoring
  - ❌ No agent workspace

**Official Link**: [WhatsApp Manager Documentation](https://developers.facebook.com/docs/whatsapp/overview/manager)

**3. App Dashboard (for Developers)**
- **What it is**: Developer console for API access and webhooks
- **Features**:
  - API credentials management
  - Webhook configuration
  - Send test messages via API explorer
- **Limitations**:
  - ❌ For technical setup only, not daily operations
  - ❌ No user-friendly interface
  - ❌ Requires coding knowledge

**Official Link**: [WhatsApp Cloud API Getting Started](https://developers.facebook.com/docs/whatsapp/cloud-api/get-started)

---

### Option 2: Third-Party BSP (Business Solution Provider) Platforms - RECOMMENDED

#### What BSPs Provide (Full-Featured Solution):

BSPs are Meta-approved partners that offer **complete platforms** built on top of the WhatsApp Business API, including:

**1. Shared Team Inbox / Chat Interface**
- Multi-agent workspace with conversation routing
- Real-time chat window with customer context
- Conversation assignment and collaboration
- Internal notes and tags

**2. Advanced Message Editor**
- Rich media support (images, videos, documents)
- Template message composer
- Quick replies and saved responses
- Message scheduling

**3. Agent Creation & Management**
- User roles and permissions
- Agent performance tracking
- Workload distribution
- Team analytics

**4. Chatbot Builder (Visual/No-Code)**
- Drag-and-drop flow builder
- AI-powered automation
- Intent recognition
- Conditional logic and branching

**5. Broadcast & Campaign Tools**
- Bulk messaging with personalization
- Segment-based targeting
- Campaign analytics
- A/B testing

**6. Advanced Analytics & Reporting**
- Conversation metrics
- Agent performance reports
- Customer insights
- ROI tracking

**7. CRM & Integrations**
- Pre-built integrations with Salesforce, HubSpot, Shopify, etc.
- Zapier/Make.com connectors
- Custom API integrations
- E-commerce platform connections

---

### Top BSP Providers (Meta-Approved) - Detailed Pricing

#### **1. WATI (Highly Recommended for SMBs)**

**Platform Subscription Costs (2025):**
- **Growth Plan**: $49/month (USD) or ₹2,499/month (INR)
  - Includes: 5 users, 1,000 chatbot sessions/month, team inbox, basic automation
- **Pro Plan**: $99/month (USD) or ₹5,999/month (INR)
  - Includes: 10 users, 2,000 chatbot sessions/month, advanced automation, analytics
- **Business Plan**: $299/month (USD) or ₹16,999/month (INR)
  - Includes: 20 users, 5,000 chatbot sessions/month, priority support, custom features

**Additional Costs:**
- Extra users: ₹1,299/user/month (India) or $24-69/user/month (US)
- Extra chatbot sessions: ₹2,000 for 1,000 sessions
- Shopify integration: $4.99/month

**Best For**: Small to medium businesses, e-commerce  
**Free Trial**: 7 days  
**Official Website**: https://www.wati.io  
**Pricing Page**: https://www.wati.io/pricing

---

#### **2. Respond.io (Enterprise-Grade)**

**Platform Subscription Costs (2025, Annual Billing):**
- **Starter Plan**: $79-99/month
  - Includes: 5 users, all messaging channels, basic automation
- **Growth Plan**: $159-199/month ⭐ Most Popular
  - Includes: 10 users, AI Agent, workflows, advanced automation
- **Advanced Plan**: $279-349/month
  - Includes: 10 users, multiple workspaces, advanced integrations, enhanced security
- **Enterprise Plan**: Custom pricing
  - Includes: Unlimited users, unlimited workspaces, highest API limits

**Pricing Model**: Based on Monthly Active Contacts (MACs)  
**Additional Costs:**
- Extra users: $12-24/user/month (depending on plan)
- WhatsApp API costs: Pass-through at Meta rates (NO markup)

**Best For**: Large enterprises, multi-channel businesses, tech-savvy teams  
**Free Trial**: 7 days  
**Official Website**: https://respond.io  
**Pricing Page**: https://respond.io/pricing  
**WhatsApp Cost Calculator**: https://respond.io/whatsapp-business-api-pricing

---

#### **3. Interakt (India Market Leader)**

**Platform Subscription Costs (2025, in INR):**
- **Starter Plan**: ₹919/month or ₹2,757/quarter
  - Includes: Basic automation, segmentation, 1 third-party integration, email support only
- **Growth Plan**: ₹2,299-2,499/month or ₹6,897/quarter
  - Includes: Click-to-WhatsApp ads analytics, 3 app integrations, developer API access
- **Advanced Plan**: ₹3,219-3,499/month or ₹9,657/quarter
  - Includes: Unlimited integrations, advanced segments, full API access, agent statistics
- **Enterprise Plan**: Custom pricing
  - Includes: All features, no markup charges, faster delivery, Meta consultative support

**WhatsApp Conversation Costs (India):**
- **Marketing**: ₹0.882 per conversation (₹0.7265 on Enterprise)
- **Authentication**: ₹0.129 per conversation
- **Utility**: ₹0.160 per conversation (₹0.3082 on Enterprise)
- **Service (user-initiated)**: ₹0.35 per conversation (₹0.2906 on Enterprise)

**Best For**: Indian businesses, e-commerce, budget-conscious SMBs  
**Free Trial**: Available  
**Setup Fees**: None  
**Official Website**: https://www.interakt.shop  
**Pricing Page**: https://www.interakt.shop/pricing

---

#### **4. Sleekflow (Asia-Pacific Focus)**

**Platform Subscription Costs (2025, in USD):**
- **Start (Free Plan)**: $0/month
  - Includes: 3 users, up to 100 contacts, basic features (limited)
- **Pro Plan**: $199/month
  - Includes: For growing businesses, automation, integrations
- **Premium Plan**: $349/month (if paid yearly)
  - Includes: Advanced automation, integrations, analytics for scaling businesses
- **Enterprise Plan**: Custom pricing
  - Includes: Custom solutions for large organizations

**Alternative WhatsApp API Plans:**
- Basic WhatsApp API access: Starts from $149/month

**Best For**: Asia-based businesses, multi-channel engagement, e-commerce  
**Free Trial**: Available on free plan  
**Official Website**: https://sleekflow.io  
**Pricing Page**: https://sleekflow.io/pricing  
**WhatsApp Cost Calculator**: https://sleekflow.io/whatsapp-business-api-pricing

---

### Complete Pricing Comparison Table (2025)

| BSP Provider | Entry Plan | Mid-Tier Plan | Advanced Plan | Enterprise | Free Trial | Region Focus |
|--------------|------------|---------------|---------------|------------|------------|--------------|
| **WATI** | $49/mo<br>₹2,499/mo | $99/mo<br>₹5,999/mo | $299/mo<br>₹16,999/mo | Custom | 7 days | Global, India |
| **Respond.io** | $79-99/mo | $159-199/mo | $279-349/mo | Custom | 7 days | Global, Enterprise |
| **Interakt** | ₹919/mo<br>~$11/mo | ₹2,299/mo<br>~$27/mo | ₹3,499/mo<br>~$42/mo | Custom | Yes | India |
| **Sleekflow** | $0/mo<br>(100 contacts) | $199/mo | $349/mo | Custom | Free plan | Asia-Pacific |

**Note**: All prices exclude WhatsApp conversation charges from Meta

---

### WhatsApp Conversation Charges (From Meta, Effective July 1, 2025)

**Important**: As of July 1, 2025, Meta shifted from conversation-based to **per-message billing**.

#### India Rates (Example):
- **Marketing Messages**: ₹0.72-0.88 per message
- **Utility Messages**: ₹0.16-0.31 per message
- **Authentication Messages**: ₹0.13 per message
- **Service Messages (user-initiated)**: FREE (first 1,000/month)

#### US Rates (Example):
- **Marketing Messages**: $0.08-0.15 per message
- **Utility Messages**: $0.025-0.05 per message
- **Authentication Messages**: $0.015-0.03 per message
- **Service Messages (user-initiated)**: FREE (first 1,000/month)

**Official Meta Pricing**: [WhatsApp Business API Pricing](https://developers.facebook.com/docs/whatsapp/pricing)

---

### Total Cost Example (Real-World Scenario)

**Scenario**: Indian e-commerce business with 5 agents, 2,000 conversations/month

#### Using WATI (Growth Plan):
- **Platform Fee**: ₹2,499/month
- **WhatsApp Charges** (assuming 50% marketing, 50% service):
  - 1,000 marketing messages: 1,000 × ₹0.88 = ₹880
  - 1,000 service messages: FREE (within 1,000 free tier)
- **Total**: ₹2,499 + ₹880 = **₹3,379/month (~$40/month)**

#### Using Interakt (Growth Plan):
- **Platform Fee**: ₹2,299/month
- **WhatsApp Charges** (same distribution):
  - 1,000 marketing messages: 1,000 × ₹0.88 = ₹880
  - 1,000 service messages: FREE
- **Total**: ₹2,299 + ₹880 = **₹3,179/month (~$38/month)**

#### Using Respond.io (Growth Plan):
- **Platform Fee**: $159/month (₹13,272/month)
- **WhatsApp Charges** (no markup, pass-through):
  - 1,000 marketing messages: ₹880
  - 1,000 service messages: FREE
- **Total**: ₹13,272 + ₹880 = **₹14,152/month (~$170/month)**

**Conclusion**: For Indian SMBs, **Interakt or WATI** offers better value. For enterprises needing advanced features, **Respond.io** is worth the premium.

---

### Which BSP Should You Choose?

#### Choose **WATI** if:
- ✅ You're a small-medium business
- ✅ You need easy-to-use interface
- ✅ Budget: $50-300/month
- ✅ Global presence or Indian market

#### Choose **Respond.io** if:
- ✅ You're an enterprise
- ✅ You need omnichannel (WhatsApp + others)
- ✅ Budget: $150-500+/month
- ✅ Advanced automation & customization needed

#### Choose **Interakt** if:
- ✅ You're based in India
- ✅ You're budget-conscious
- ✅ Budget: ₹1,000-5,000/month ($12-60)
- ✅ E-commerce focused

#### Choose **Sleekflow** if:
- ✅ You're in Asia-Pacific region
- ✅ You want to start free
- ✅ Budget: $0-350/month
- ✅ Multi-channel engagement needed

---

### Comparison: Native Meta Tools vs BSP Platforms

| Feature | Meta Native Tools | BSP Platforms |
|---------|------------------|---------------|
| **Chat Interface** | Basic (Meta Business Suite) | Advanced with context |
| **Message Editor** | Template-only in Manager | Rich editor with media |
| **Agent Management** | Very basic assignment | Full role-based system |
| **Chatbot Builder** | ❌ None | ✅ Visual drag-and-drop |
| **Bulk Messaging** | ❌ Not available | ✅ Full campaign tools |
| **Analytics** | Basic metrics | Advanced reporting |
| **CRM Integration** | ❌ Limited | ✅ Pre-built for major CRMs |
| **Automation** | Basic auto-replies | Advanced workflows |
| **Team Collaboration** | Limited | Full collaboration tools |
| **Cost** | **FREE** | **$49-500+/month** |
| **Setup Complexity** | Medium | Easy (guided onboarding) |

---

### Recommended Approach

**For Most Businesses**: Use a **BSP Platform**

**Reasons:**
1. ✅ Complete solution out-of-the-box
2. ✅ No technical expertise required
3. ✅ Professional agent workspace
4. ✅ Advanced automation saves time and money
5. ✅ Better customer experience
6. ✅ Scales with your business
7. ✅ Includes support and training

**When to Use Native Meta Tools Only:**
- You're a developer building your own custom solution
- You have in-house development team
- You need minimal features (just basic messaging)
- You want to experiment before committing to a BSP

---

### How BSPs Work (Proof of Concept)

#### Connection Flow:
```
Your Business
    ↓
BSP Platform (WATI, Respond.io, etc.)
    ↓
WhatsApp Business API (Meta's backend)
    ↓
WhatsApp (End users)
```

#### What Actually Happens:
1. **You sign up** with a BSP → They create your WhatsApp Business API account
2. **BSP handles** all technical setup with Meta
3. **You get access** to BSP's platform (web dashboard + mobile apps)
4. **Your agents use** BSP's interface to chat with customers
5. **Messages flow** through BSP → Meta API → WhatsApp users
6. **You pay** Meta for conversations + BSP for platform usage

**Official Documentation**: [How BSPs Work](https://business.whatsapp.com/developers/developer-hub)

---

### Cost Breakdown Example (Using BSP)

**With WATI (Example):**
- **BSP Platform Fee**: $49-199/month (based on features and agents)
- **Meta Conversation Charges**: $0.005-0.10 per conversation (varies by country and type)
- **Message Template Fees**: Free for service messages, paid for marketing messages

**Example Monthly Cost for 1000 Conversations:**
- WATI Platform: $79/month (Growth plan)
- Meta Charges: ~$30-50 (India rates)
- **Total**: ~$109-129/month

**ROI**: If automated responses handle even 20% of inquiries, you save significant agent time.

---

### Official Meta Resources for BSPs

1. **Meta BSP Directory**  
   https://business.whatsapp.com/solutions  
   *Find all approved BSP partners*

2. **WhatsApp Business Platform Overview**  
   https://business.whatsapp.com/  
   *Learn about business solutions*

3. **Developer Hub**  
   https://business.whatsapp.com/developers/developer-hub  
   *Technical documentation for building on the API*

4. **Meta for Developers**  
   https://developers.facebook.com/docs/whatsapp  
   *Complete API documentation*

---

### Getting Started with a BSP (Step-by-Step)

1. **Choose a BSP** from the [official directory](https://business.whatsapp.com/solutions)
2. **Sign up** for a free trial (most offer 7-14 day trials)
3. **Connect your phone number** (your existing business number)
4. **Complete verification** with Meta (BSP will guide you)
5. **Set up your team** (add agents, assign roles)
6. **Create message templates** and get them approved by Meta
7. **Build chatbots** using the visual builder (optional)
8. **Integrate with CRM** if needed
9. **Train your team** on the platform
10. **Start messaging** customers!

**Average Setup Time**: 2-5 business days (including Meta approvals)

---

### Important Considerations

**If You Choose Native Meta Tools:**
- You'll need developers to build custom interfaces
- Development cost >> BSP subscription cost
- Ongoing maintenance required
- Feature gaps compared to BSPs

**If You Choose a BSP:**
- Instant access to full features
- Proven, tested platform
- Regular updates and new features
- Customer support included
- Easier to switch BSPs later than migrate from custom solution

---

## Final Recommendation for Your Use Case

Based on your need for **message editor, message send option, chat window, agent creation and management**, you should:

### ✅ **Use a BSP Platform (WATI, Respond.io, or similar)**

**Why:**
1. Meta's native tools DO NOT provide a complete agent interface
2. BSP platforms provide everything you need out-of-the-box
3. Cost-effective compared to building custom
4. Professional features that improve customer experience
5. Can start using within days, not months

**Next Steps:**
1. Visit [Meta's Official BSP Directory](https://business.whatsapp.com/solutions)
2. Compare 2-3 BSPs based on your needs
3. Sign up for free trials
4. Test the interfaces with your team
5. Choose the one that fits best
6. Migrate your number using the Coexistence feature (as explained earlier in this document)

---

**Document Created**: January 8, 2026  
**Last Updated**: January 8, 2026 (Updated with BSP interface information)  
**Source**: Meta for Developers Official Documentation & Meta BSP Directory

