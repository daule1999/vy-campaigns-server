/**
 * Enhanced Campaign Analytics Plan
 * 
 * Objective: Build comprehensive campaign tracking dashboard with detailed status breakdown
 */

## Campaign Message Status Flow

```
Contact Added to Campaign
    ↓
[ATTEMPTED] - Message send attempt initiated
    ↓
Success? ──┬─── No ──→ [FAILED_META] (Meta rejected: invalid number, opt-out, etc.)
           │            [FAILED_OTHER] (Network, API errors, etc.)
           │
           └─── Yes
                 ↓
            [SENT] - Successfully sent to WhatsApp
                 ↓
            WhatsApp delivers to user
                 ↓
            [DELIVERED] - Delivered to user's device
                 ↓
            User opens message
                 ↓
            [READ] - Message read by user
                 ↓
            User replies (optional)
                 ↓
            [REPLIED] - User responded to campaign
```

## Enhanced Database Schema

### campaign_contacts Table (Enhanced)

**Add new fields:**
```sql
- messageStatus: ENUM('attempted', 'sent', 'delivered', 'read', 'replied', 'failed_meta', 'failed_other')
- deliveredAt: TIMESTAMP
- readAt: TIMESTAMP  
- repliedAt: TIMESTAMP
- failureReason: TEXT (error message from Meta/system)
- retryCount: INTEGER
- whatsappMessageId: VARCHAR (Meta's message ID for tracking)
- buttonClicks: JSON (track which buttons were clicked)
```

### campaigns Table (Enhanced)

**Add analytics fields:**
```sql
- attemptedCount: INTEGER
- deliveredCount: INTEGER
- readCount: INTEGER
- repliedCount: INTEGER
- failedMetaCount: INTEGER
- failedOtherCount: INTEGER
- costPerMessage: DECIMAL
- totalCost: DECIMAL
- category: ENUM('one_time', 'ongoing', 'api')
```

## API Endpoints

### Campaign Analytics

```
GET /api/campaigns/:id/analytics
- Returns complete analytics breakdown
- Response includes all status counts + percentages

GET /api/campaigns/:id/users/:status
- status: attempted|sent|delivered|read|replied|failed_meta|failed_other
- Returns paginated list of users in that status
- Includes contact details, timestamps, failure reasons

GET /api/campaigns/:id/export
- Download full campaign report as CSV/Excel
- All statuses with user details

GET /api/campaigns/:id/button-tracking
- Button click analytics
- Which buttons clicked, by how many users, click percentage

POST /api/campaigns/:id/retry-failed
- Retry failed messages
- Only for failed_other (not Meta failures)
```

## Implementation Steps

1. **Enhance CampaignContact Model**
   - Add new status tracking fields
   - Add webhook callback fields

2. **Enhance Campaign Model**
   - Add analytics counter fields
   - Add cost tracking

3. **Create Analytics API**
   - Campaign overview endpoint
   - User list by status endpoint
   - Button tracking endpoint
   - Export functionality

4. **WhatsApp Webhook Integration**
   - Listen for delivery receipts
   - Listen for read receipts
   - Listen for user replies
   - Update campaign_contacts accordingly

5. **Real-time Updates**
   - Use webhooks to update counters
   - Refresh data endpoint
   - Processing indicators

## Webhook Event Handling

### Meta Webhook Events
```javascript
// Delivery status update
{
  "type": "message_status",
  "messageId": "wamid.xxx",
  "status": "delivered", // or "read", "failed"
  "timestamp": 1234567890,
  "errors": [...]  // if failed
}

// User reply
{
  "type": "message",
  "from": "+1234567890",
  "text": "Hello",
  "context": {
    "messageId": "wamid.xxx"  // Original campaign message
  }
}

// Button click
{
  "type": "interactive",
  "from": "+1234567890",
  "interactive": {
    "type": "button_reply",
    "button_reply": {
      "id": "button_1",
      "title": "View Products"
    }
  },
  "context": {
    "messageId": "wamid.xxx"
  }
}
```

## Dashboard UI Components

### Campaign Stats Cards
- Attempted: Show count & percentage
- Sent: Show count & percentage
- Delivered: Show count & percentage (processing indicator if < 100%)
- Read: Show count & percentage (processing indicator)
- Replied: Show count & percentage
- Limited by Meta: Show count
- Other Failures: Show count

### User Lists
- Click on any stat to view user list
- Modal/side panel with user table
- Columns: Name, Phone, Status, Timestamp, Error (if failed)
- Export to CSV option
- Pagination

### Button Tracking
- Table showing button name, clicks, percentage
- Premium feature indicator
- Click to see which users clicked

### Campaign Details
- Template preview
- Variable mappings
- Schedule info
- Cost breakdown

## Sample API Response

```json
{
  "success": true,
  "data": {
    "campaign": {
      "id": 123,
      "name": "Magh_Mela_Final_Temp_3_campaign",
      "status": "completed",
      "category": "one_time",
      "totalContacts": 4,
      "totalCost": 0,
      "startedAt": "2026-01-22T08:23:14+05:30"
    },
    "analytics": {
      "attempted": {
        "count": 4,
        "percentage": 100
      },
      "sent": {
        "count": 4,
        "percentage": 100
      },
      "delivered": {
        "count": 4,
        "percentage": 100,
        "processing": false
      },
      "read": {
        "count": 1,
        "percentage": 25,
        "processing": true
      },
      "replied": {
        "count": 0,
        "percentage": 0,
        "processing": true
      },
      "failedMeta": {
        "count": 0,
        "percentage": 0
      },
      "failedOther": {
        "count": 0,
        "percentage": 0
      }
    },
    "buttonTracking": {
      "enabled": false,
      "buttons": []
    }
  }
}
```

Will now proceed with implementation.
