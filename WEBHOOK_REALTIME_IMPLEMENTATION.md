# Webhook Error Handling & Real-Time Frontend Updates

## Current Implementation Analysis

### ✅ Error Handling - What's Already Implemented

The webhook implementation has **comprehensive error handling**:

#### 1. **Verification Endpoint (GET /webhook)**
```javascript
// ✅ Validates mode and token
if (mode && token) {
    if (mode === 'subscribe' && token === config.webhook.verifyToken) {
        ✅ Success: Returns 200 + challenge
    } else {
        ❌ Token mismatch: Returns 403 Forbidden
    }
} else {
    ❌ Missing params: Returns 400 Bad Request
}
```

#### 2. **Event Handler (POST /webhook)**
```javascript
try {
    // Process webhook
    ✅ Success: Returns 200 OK immediately
} catch (error) {
    ❌ Error: Logs error + Returns 500 Internal Server Error
}
```

#### 3. **Async Function Error Handling**
All webhook handlers have try-catch blocks:
- `handleIncomingMessage()` - ✅ Catches errors
- `handleButtonResponse()` - ✅ Catches errors
- `handleTemplateStatusUpdate()` - ✅ Catches errors

### ❌ What's MISSING - Frontend Real-Time Updates

**Problem**: Frontend has **NO WAY** to know when webhooks arrive!

**Current Flow**:
```
WhatsApp → Server Webhook → Process → ❌ Frontend doesn't know
```

**What Frontend Wants to Know**:
- 📨 New message received
- ✅ Message delivered/read
- 📝 Template approved/rejected
- 🔔 Any webhook event happened

---

## Solutions for Real-Time Frontend Updates

### Option 1: **WebSockets (Socket.io)** ⭐ RECOMMENDED

**Pros**:
- ✅ Bi-directional real-time communication
- ✅ Automatic reconnection
- ✅ Room/namespace support
- ✅ Event-based architecture

**Cons**:
- ⚠️ Requires persistent connection
- ⚠️ May have issues with some proxies
- ⚠️ Vercel serverless has limitations (but workarounds exist)

**Use Case**: Perfect for admin dashboards, live chat interfaces

---

### Option 2: **Server-Sent Events (SSE)**

**Pros**:
- ✅ Simple HTTP-based
- ✅ Browser native support
- ✅ Automatic reconnection
- ✅ Works through proxies

**Cons**:
- ⚠️ One-way (server → client only)
- ⚠️ Connection limits (6 per domain in browsers)
- ⚠️ Vercel serverless timeout (30s max)

**Use Case**: Good for notifications, status updates

---

### Option 3: **Polling (Simple)**

**Pros**:
- ✅ Very simple to implement
- ✅ Works everywhere
- ✅ No persistent connections

**Cons**:
- ❌ Not truly real-time (delay = poll interval)
- ❌ More server load
- ❌ Wasteful if no updates

**Use Case**: Fallback option, or when real-time isn't critical

---

### Option 4: **Database + Polling Hybrid**

**Pros**:
- ✅ Very reliable
- ✅ Can show history
- ✅ Works with serverless

**Cons**:
- ⚠️ Requires database table for webhook logs
- ⚠️ Not instant (poll interval delay)

**Use Case**: Best for webhook history/logs

---

## Implementation Plan

### RECOMMENDED: Socket.io Implementation

#### Step 1: Install Dependencies
```bash
npm install socket.io socket.io-client
```

#### Step 2: Server Setup (src/index.js)
```javascript
const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.NODE_ENV === 'production'
            ? process.env.FRONTEND_URL
            : ['http://localhost:5173', 'http://localhost:5174'],
        credentials: true
    }
});

// Socket.io connection
io.on('connection', (socket) => {
    console.log('✅ Client connected:', socket.id);
    
    socket.on('disconnect', () => {
        console.log('❌ Client disconnected:', socket.id);
    });
});

// Export io for webhook to use
global.io = io;

// Change app.listen to server.listen
server.listen(config.app.port, () => {
    // ... existing startup code
});
```

#### Step 3: Emit Events from Webhook (src/modules/webhook/routes.js)
```javascript
router.post('/', async (req, res) => {
    try {
        const body = req.body;
        
        // Respond immediately
        res.sendStatus(200);
        
        // Emit to all connected clients
        if (global.io) {
            global.io.emit('webhook:received', {
                timestamp: new Date(),
                event: body
            });
        }
        
        // Process webhook
        if (body.object === 'whatsapp_business_account') {
            // ... existing code
            
            // Emit specific events
            if (field === 'messages' && value.messages) {
                const message = value.messages[0];
                global.io.emit('message:received', {
                    from: message.from,
                    type: message.type,
                    text: message.text?.body,
                    timestamp: new Date()
                });
            }
            
            if (field === 'message_template_status_update') {
                global.io.emit('template:updated', {
                    name: value.message_template_name,
                    status: value.event,
                    timestamp: new Date()
                });
            }
        }
    } catch (error) {
        console.error('Webhook error:', error);
        res.sendStatus(500);
    }
});
```

#### Step 4: Frontend Setup (React)
```javascript
// src/services/socket.js
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class SocketService {
    socket = null;
    
    connect() {
        this.socket = io(SOCKET_URL, {
            autoConnect: true,
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5
        });
        
        this.socket.on('connect', () => {
            console.log('✅ Socket connected:', this.socket.id);
        });
        
        this.socket.on('disconnect', () => {
            console.log('❌ Socket disconnected');
        });
        
        return this.socket;
    }
    
    on(event, callback) {
        if (!this.socket) this.connect();
        this.socket.on(event, callback);
    }
    
    off(event, callback) {
        if (this.socket) {
            this.socket.off(event, callback);
        }
    }
    
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
        }
    }
}

export default new SocketService();
```

```javascript
// In React component
import { useEffect } from 'react';
import socketService from '../services/socket';
import { toast } from 'react-toastify'; // or your notification library

function Dashboard() {
    useEffect(() => {
        // Connect to socket
        socketService.connect();
        
        // Listen for webhook events
        socketService.on('webhook:received', (data) => {
            console.log('📨 Webhook received:', data);
        });
        
        socketService.on('message:received', (data) => {
            toast.info(`New message from ${data.from}: ${data.text}`);
            // Update UI, refetch data, etc.
        });
        
        socketService.on('template:updated', (data) => {
            toast.success(`Template ${data.name} is now ${data.status}`);
            // Refresh template list
        });
        
        // Cleanup on unmount
        return () => {
            socketService.disconnect();
        };
    }, []);
    
    return (
        <div>
            {/* Your dashboard */}
        </div>
    );
}
```

---

## Alternative: Polling + Webhook Log Table

If Socket.io doesn't work well with your deployment (Vercel serverless):

#### Step 1: Create Webhook Log Table
```sql
CREATE TABLE webhook_events (
    id INT PRIMARY KEY AUTO_INCREMENT,
    event_type VARCHAR(50),
    payload JSON,
    processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Step 2: Log Webhooks
```javascript
// In webhook routes
router.post('/', async (req, res) => {
    try {
        // Log to database
        await db.query(
            'INSERT INTO webhook_events (event_type, payload) VALUES (?, ?)',
            [req.body.entry?.[0]?.changes?.[0]?.field || 'unknown', JSON.stringify(req.body)]
        );
        
        res.sendStatus(200);
        // ... process webhook
    } catch (error) {
        res.sendStatus(500);
    }
});
```

#### Step 3: Poll Endpoint
```javascript
// src/modules/webhook/routes.js
router.get('/recent', authenticate, async (req, res) => {
    try {
        const since = req.query.since || (Date.now() - 60000); // Last 1 minute
        
        const events = await db.query(
            'SELECT * FROM webhook_events WHERE created_at > ? ORDER BY created_at DESC LIMIT 50',
            [new Date(parseInt(since))]
        );
        
        res.json({ success: true, events });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
```

#### Step 4: Frontend Polling
```javascript
// Poll every 5 seconds
useEffect(() => {
    let lastPoll = Date.now();
    
    const pollWebhooks = async () => {
        const response = await fetch(`/webhook/recent?since=${lastPoll}`);
        const data = await response.json();
        
        if (data.events.length > 0) {
            console.log('New webhooks:', data.events);
            // Show notifications, update UI
        }
        
        lastPoll = Date.now();
    };
    
    const interval = setInterval(pollWebhooks, 5000);
    return () => clearInterval(interval);
}, []);
```

---

## Comparison Summary

| Feature | Socket.io | SSE | Polling | DB + Polling |
|---------|-----------|-----|---------|--------------|
| **Real-time** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐ |
| **Simplicity** | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Reliability** | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Serverless** | ⚠️ Limited | ❌ No | ✅ Yes | ✅ Yes |
| **History** | ❌ No | ❌ No | ❌ No | ✅ Yes |
| **Bi-directional** | ✅ Yes | ❌ No | ✅ Yes | ✅ Yes |

---

## Recommended Approach for Your Project

**For Vercel Deployment**: Use **DB + Polling Hybrid**
- ✅ Works perfectly with serverless
- ✅ Reliable and simple
- ✅ Can show webhook history
- ✅ No persistent connections needed

**For Traditional Server**: Use **Socket.io**
- ✅ True real-time
- ✅ Best user experience
- ✅ Event-driven architecture

---

## Next Steps

1. Choose approach based on deployment platform
2. Implement webhook event storage (if using DB approach)
3. Add Socket.io or polling to frontend
4. Test webhook → frontend flow
5. Add UI notifications for webhook events

---

**Current Status**: 
- ✅ Webhook handlers have error handling
- ❌ Frontend notification system NOT implemented
- 📋 Need to choose and implement one of the above solutions
