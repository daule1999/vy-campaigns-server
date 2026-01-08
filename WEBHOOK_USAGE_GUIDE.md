# Real-Time Webhook Notifications - Usage Guide

## Overview

This implementation provides real-time webhook notifications to your frontend using a **Database + Polling** approach, perfect for Vercel serverless deployment.

## How It Works

```
WhatsApp → Server Webhook → Save to DB → Frontend Polls → Display Updates
```

1. **Webhook receives event** → Logs to `webhook_events` table
2. **Frontend polls** `/webhook/recent` every 5 seconds
3. **New events returned** → Show notifications/update UI
4. **User dismisses** → Remove from frontend state

---

## Backend Implementation ✅

### 1. Database Model: `WebhookEvent`

**Location**: `src/db/models/sequelize/WebhookEvent.js`

**Fields**:
- `eventType`: messages, template_status, etc.
- `from`: Sender phone number
- `messageType`: text, interactive, image, etc.
- `messageText`: Message content
- `templateName`: Template name
- `templateStatus`: APPROVED, REJECTED, etc.
- `payload`: Full webhook JSON
- `createdAt`: Timestamp

### 2. API Endpoints

#### GET `/webhook/recent` (Authenticated)
Poll for new webhook events

**Parameters**:
- `since`: Timestamp (default: last 60 seconds)
- `limit`: Max events (default: 50)

**Response**:
```json
{
  "success": true,
  "count": 2,
  "events": [
    {
      "id": 123,
      "eventType": "messages",
      "from": "1234567890",
      "messageType": "text",
      "messageText": "Hello",
      "timestamp": "2026-01-08T17:00:00Z",
      "preview": "Message from 1234567890: \"Hello\""
    },
    {
      "eventType": "message_template_status_update",
      "templateName": "order_confirmation",
      "templateStatus": "APPROVED",
      "preview": "Template \"order_confirmation\" is now APPROVED"
    }
  ]
}
```

#### GET `/webhook/stats` (Authenticated)
Get webhook statistics

**Response**:
```json
{
  "success": true,
  "stats": {
    "total": 1542,
    "messages": 1234,
    "templateUpdates": 308,
    "last24Hours": 45
  }
}
```

---

## Frontend Implementation ✅

### 1. React Hook: `useWebhookPolling`

**Location**: `src/hooks/useWebhookPolling.js`

**Features**:
- ✅ Automatic polling every 5 seconds (configurable)
- ✅ Auto-deduplication by event ID
- ✅ Event callbacks for notifications
- ✅ Statistics fetching
- ✅ Manual start/stop control
- ✅ Error handling

### 2. Usage Example

```jsx
import { useWebhookPolling } from '../hooks/useWebhookPolling';
import { toast } from 'react-toastify';

function Dashboard() {
    const { events, stats, markAsRead, clearEvents } = useWebhookPolling({
        pollInterval: 5000, // 5 seconds
        enabled: true,
        onNewEvent: (event) => {
            // Show toast notification
            if (event.eventType === 'messages') {
                toast.info(`📨 ${event.preview}`);
            } else if (event.eventType === 'message_template_status_update') {
                toast.success(`✅ ${event.preview}`);
            }
        }
    });

    return (
        <div>
            {/* Webhook notification badge */}
            <div className="notifications">
                {events.length > 0 && (
                    <span className="badge">{events.length}</span>
                )}
            </div>

            {/* Recent events list */}
            <div className="webhook-events">
                <h3>Recent Webhooks</h3>
                {events.map(event => (
                    <div key={event.id} className="event-card">
                        <p>{event.preview}</p>
                        <small>{new Date(event.timestamp).toLocaleString()}</small>
                        <button onClick={() => markAsRead(event.id)}>
                            Dismiss
                        </button>
                    </div>
                ))}
                
                {events.length > 0 && (
                    <button onClick={clearEvents}>Clear All</button>
                )}
            </div>

            {/* Statistics */}
            {stats && (
                <div className="stats">
                    <h3>Webhook Stats</h3>
                    <div className="stat-grid">
                        <div>Total: {stats.total}</div>
                        <div>Messages: {stats.messages}</div>
                        <div>Template Updates: {stats.templateUpdates}</div>
                        <div>Last 24h: {stats.last24Hours}</div>
                    </div>
                </div>
            )}
        </div>
    );
}
```

### 3. Advanced Usage

#### Conditional Polling (Only on specific pages)

```jsx
function ChatPage() {
    const [isActive, setIsActive] = useState(true);
    
    const { events } = useWebhookPolling({
        enabled: isActive, // Only poll when page is active
        pollInterval: 3000 // Faster polling on chat page
    });
}
```

#### Custom Event Handlers

```jsx
const { events } = useWebhookPolling({
    onNewEvent: (event) => {
        // Refresh template list when template approved
        if (event.eventType === 'message_template_status_update' 
            && event.templateStatus === 'APPROVED') {
            refetchTemplates();
        }
        
        // Update conversation when new message
        if (event.eventType === 'messages' && event.from === currentChatId) {
            fetchMessages(currentChatId);
        }
    }
});
```

---

## Testing

### 1. Test Webhook Locally

```bash
# Send test webhook
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "changes": [{
        "value": {
          "messages": [{
            "from": "1234567890",
            "type": "text",
            "text": {"body": "Test message"}
          }]
        },
        "field": "messages"
      }]
    }]
  }'
```

### 2. Check Database

```sql
-- View recent webhook events
SELECT * FROM webhook_events ORDER BY created_at DESC LIMIT 10;

-- Count events by type
SELECT event_type, COUNT(*) FROM webhook_events GROUP BY event_type;
```

### 3. Test Polling Endpoint

```bash
# Get recent events (replace token)
curl http://localhost:3000/webhook/recent?since=0 \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get statistics
curl http://localhost:3000/webhook/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Performance Considerations

### Polling Interval
- **Default**: 5 seconds (good balance)
- **Fast**: 3 seconds (high traffic pages)
- **Slow**: 10 seconds (low priority pages)
- **Very Slow**: 30 seconds (background pages)

### Database Cleanup
Consider adding a cleanup job to delete old webhook events:

```javascript
// Clean up events older than 7 days
const cleanupOldEvents = async () => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    await WebhookEvent.destroy({
        where: {
            createdAt: {
                [Op.lt]: sevenDaysAgo
            }
        }
    });
};

// Run daily
setInterval(cleanupOldEvents, 24 * 60 * 60 * 1000);
```

---

## Advantages of This Approach

✅ **Works with Vercel serverless** - No persistent connections needed  
✅ **Reliable** - Database ensures no events are lost  
✅ **Simple** - Easy to understand and debug  
✅ **Testable** - Can query database directly  
✅ **Scalable** - Indexed queries are fast  
✅ **History** - Can show webhook history/logs  

---

## Migration to Socket.io (Optional)

If you move to a traditional server (non-serverless), you can upgrade to Socket.io for instant notifications. See `WEBHOOK_REALTIME_IMPLEMENTATION.md` for details.

---

## Completed! 🎉

Your webhook system now has:
- ✅ Complete error handling
- ✅ Database event logging
- ✅ Real-time polling endpoint
- ✅ Frontend React hook
- ✅ Event notifications
- ✅ Statistics tracking
