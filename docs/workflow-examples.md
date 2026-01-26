# Sample Workflow Templates

## 1. Product Catalog Browsing Flow

### Trigger
- **Type**: Keyword
- **Keywords**: "catalog", "products", "shop", "browse"

### Flow Structure
```json
{
  "nodes": [
    {
      "nodeId": "trigger",
      "nodeType": "trigger",
      "config": {},
      "position": { "x": 100, "y": 100 }
    },
    {
      "nodeId": "send_welcome",
      "nodeType": "send_text",
      "config": {
        "text": "👋 Welcome to our catalog! Browse our products below."
      },
      "position": { "x": 100, "y": 200 }
    },
    {
      "nodeId": "show_categories",
      "nodeType": "send_interactive_list",
      "config": {
        "header": "Our Products",
        "body": "Choose a category to explore:",
        "buttonText": "View Categories",
        "sections": [
          {
            "title": "Categories",
            "rows": [
              {
                "id": "electronics",
                "title": "📱 Electronics",
                "description": "Phones, Laptops, Accessories"
              },
              {
                "id": "clothing",
                "title": "👕 Clothing",
                "description": "Fashion & Apparel"
              },
              {
                "id": "home",
                "title": "🏠 Home & Living",
                "description": "Furniture, Decor"
              }
            ]
          }
        ]
      },
      "position": { "x": 100, "y": 300 }
    },
    {
      "nodeId": "wait_category",
      "nodeType": "wait_for_reply",
      "config": {
        "timeout": 600
      },
      "position": { "x": 100, "y": 400 }
    },
    {
      "nodeId": "send_products",
      "nodeType": "send_text",
      "config": {
        "text": "Great choice! Here are our top products in {{data.userReply}}..."
      },
      "position": { "x": 100, "y": 500 }
    },
    {
      "nodeId": "ask_action",
      "nodeType": "send_interactive_buttons",
      "config": {
        "body": "What would you like to do?",
        "buttons": [
          { "id": "add_cart", "title": "Add to Cart" },
          { "id": "view_more", "title": "View More" },
          { "id": "talk_agent", "title": "Talk to Agent" }
        ]
      },
      "position": { "x": 100, "y": 600 }
    },
    {
      "nodeId": "end",
      "nodeType": "end",
      "config": {},
      "position": { "x": 100, "y": 700 }
    }
  ],
  "edges": [
    { "sourceNodeId": "trigger", "targetNodeId": "send_welcome" },
    { "sourceNodeId": "send_welcome", "targetNodeId": "show_categories" },
    { "sourceNodeId": "show_categories", "targetNodeId": "wait_category" },
    { "sourceNodeId": "wait_category", "targetNodeId": "send_products" },
    { "sourceNodeId": "send_products", "targetNodeId": "ask_action" },
    { "sourceNodeId": "ask_action", "targetNodeId": "end" }
  ]
}
```

## 2. Order Tracking Flow

### Trigger
- **Type**: Keyword
- **Keywords**: "track", "order status", "where is my order"

### Flow Structure
```json
{
  "nodes": [
    {
      "nodeId": "trigger",
      "nodeType": "trigger",
      "config": {}
    },
    {
      "nodeId": "ask_order_id",
      "nodeType": "send_text",
      "config": {
        "text": "📦 Please share your Order ID to track your order."
      }
    },
    {
      "nodeId": "wait_order_id",
      "nodeType": "wait_for_reply",
      "config": { "timeout": 300 }
    },
    {
      "nodeId": "validate_order",
      "nodeType": "condition",
      "config": {
        "condition": {
          "field": "data.userReply",
          "operator": "contains",
          "value": "ORD"
        }
      }
    },
    {
      "nodeId": "send_status",
      "nodeType": "send_text",
      "config": {
        "text": "✅ Your order {{data.userReply}} is Out for Delivery!\n\nExpected delivery: Today by 6 PM"
      }
    },
    {
      "nodeId": "send_invalid",
      "nodeType": "send_text",
      "config": {
        "text": "❌ Invalid Order ID. Please check and try again."
      }
    },
    {
      "nodeId": "tag_tracked",
      "nodeType": "add_tag",
      "config": { "tag": "order_tracked" }
    },
    {
      "nodeId": "end",
      "nodeType": "end",
      "config": {}
    }
  ],
  "edges": [
    { "sourceNodeId": "trigger", "targetNodeId": "ask_order_id" },
    { "sourceNodeId": "ask_order_id", "targetNodeId": "wait_order_id" },
    { "sourceNodeId": "wait_order_id", "targetNodeId": "validate_order" },
    {
      "sourceNodeId": "validate_order",
      "targetNodeId": "send_status",
      "condition": { "result": true },
      "label": "Valid"
    },
    {
      "sourceNodeId": "validate_order",
      "targetNodeId": "send_invalid",
      "condition": { "result": false },
      "label": "Invalid"
    },
    { "sourceNodeId": "send_status", "targetNodeId": "tag_tracked" },
    { "sourceNodeId": "tag_tracked", "targetNodeId": "end" },
    { "sourceNodeId": "send_invalid", "targetNodeId": "ask_order_id" }
  ]
}
```

## 3. Customer Support Routing Flow

### Trigger
- **Type**: Keyword
- **Keywords**: "help", "support", "issue", "problem"

### Flow Structure
```json
{
  "nodes": [
    {
      "nodeId": "trigger",
      "nodeType": "trigger",
      "config": {}
    },
    {
      "nodeId": "ask_category",
      "nodeType": "send_interactive_list",
      "config": {
        "header": "How can we help?",
        "body": "Please select your issue category:",
        "buttonText": "Select Issue",
        "sections": [
          {
            "title": "Support",
            "rows": [
              { "id": "billing", "title": "💳 Billing Issue", "description": "Payment, invoices" },
              { "id": "technical", "title": "⚙️ Technical Problem", "description": "App, website issues" },
              { "id": "product", "title": "📦 Product Question", "description": "Product info, returns" },
              { "id": "other", "title": "💬 Other", "description": "General questions" }
            ]
          }
        ]
      }
    },
    {
      "nodeId": "wait_category",
      "nodeType": "wait_for_reply",
      "config": {}
    },
    {
      "nodeId": "assign_billing",
      "nodeType": "assign_team",
      "config": { "teamId": 1, "teamName": "Billing Team" }
    },
    {
      "nodeId": "assign_technical",
      "nodeType": "assign_team",
      "config": { "teamId": 2, "teamName": "Technical Team" }
    },
    {
      "nodeId": "assign_product",
      "nodeType": "assign_team",
      "config": { "teamId": 3, "teamName": "Product Team" }
    },
    {
      "nodeId": "assign_general",
      "nodeType": "assign_agent",
      "config": { "type": "round_robin" }
    },
    {
      "nodeId": "send_confirmation",
      "nodeType": "send_text",
      "config": {
        "text": "✅ You've been connected to our {{data.teamName}}.\n\nAverage wait time: 5 minutes"
      }
    },
    {
      "nodeId": "end",
      "nodeType": "end",
      "config": {}
    }
  ],
  "edges": [
    { "sourceNodeId": "trigger", "targetNodeId": "ask_category" },
    { "sourceNodeId": "ask_category", "targetNodeId": "wait_category" },
    {
      "sourceNodeId": "wait_category",
      "targetNodeId": "assign_billing",
      "condition": { "field": "data.userReply", "operator": "equals", "value": "billing" }
    },
    {
      "sourceNodeId": "wait_category",
      "targetNodeId": "assign_technical",
      "condition": { "field": "data.userReply", "operator": "equals", "value": "technical" }
    },
    {
      "sourceNodeId": "wait_category",
      "targetNodeId": "assign_product",
      "condition": { "field": "data.userReply", "operator": "equals", "value": "product" }
    },
    {
      "sourceNodeId": "wait_category",
      "targetNodeId": "assign_general",
      "condition": { "field": "data.userReply", "operator": "equals", "value": "other" }
    },
    { "sourceNodeId": "assign_billing", "targetNodeId": "send_confirmation" },
    { "sourceNodeId": "assign_technical", "targetNodeId": "send_confirmation" },
    { "sourceNodeId": "assign_product", "targetNodeId": "send_confirmation" },
    { "sourceNodeId": "assign_general", "targetNodeId": "send_confirmation" },
    { "sourceNodeId": "send_confirmation", "targetNodeId": "end" }
  ]
}
```

## Usage

### Create Workflow via API
```bash
curl -X POST http://localhost:3000/api/workflows \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Product Catalog Flow",
    "description": "Interactive product browsing",
    "triggerType": "keyword",
    "triggerConfig": {
      "keywords": ["catalog", "products", "shop"],
      "matchType": "contains"
    },
    "nodes": [...],
    "edges": [...]
  }'
```

### Activate Workflow
```bash
curl -X POST http://localhost:3000/api/workflows/1/activate \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test Workflow
```bash
curl -X POST http://localhost:3000/api/workflows/1/execute \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "contactId": 123,
    "triggerData": { "source": "manual_test" }
  }'
```

## Node Type Reference

### Message Nodes
- `send_text` - Simple text message
- `send_interactive_list` - List picker (up to 10 items per section)
- `send_interactive_buttons` - Button message (up to 3 buttons)
- `send_image` - Image message
- `send_template` - WhatsApp template message

### Logic Nodes
- `condition` - If/else branching
- `wait_for_reply` - Pause until user responds
- `delay` - Wait X seconds

### Action Nodes
- `assign_agent` - Route to specific agent
- `assign_team` - Route to team
- `add_tag` - Add contact tag
- `update_field` - Update contact field

### Control Nodes
- `trigger` - Starting point
- `end` - Termination point
