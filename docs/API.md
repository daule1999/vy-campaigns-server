# API Documentation

## Overview
This API provides endpoints for managing campaigns across multiple notification channels (WhatsApp, SMS, Email, IVR).

## Authentication

### Web Authentication (JWT)
Use `/api/auth/login` to get JWT tokens for web app access.

### API Key Authentication
For external integrations, use an API key in the `X-API-Key` header.

```bash
curl -H "X-API-Key: your-api-key" https://your-server.com/api/v1/persons
```

---

## Public API Endpoints (v1)

Base URL: `/api/v1`

### Persons

#### Create Person
```http
POST /api/v1/persons
Content-Type: application/json
X-API-Key: your-api-key

{
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "9876543210",
  "phoneCountryCode": "91",
  "email": "john@example.com",
  "whatsappSameAsPhone": true,
  "tags": ["customer", "vip"]
}
```

#### Bulk Create Persons
```http
POST /api/v1/persons/bulk
Content-Type: application/json
X-API-Key: your-api-key

{
  "persons": [
    { "firstName": "John", "phoneNumber": "9876543210" },
    { "firstName": "Jane", "phoneNumber": "9876543211" }
  ]
}
```

#### Get Persons
```http
GET /api/v1/persons?page=1&limit=50&search=john&tags=customer,vip
X-API-Key: your-api-key
```

---

### Templates

#### Create Template
```http
POST /api/v1/templates
Content-Type: application/json
X-API-Key: your-api-key

{
  "name": "Welcome Message",
  "wa_template_name": "welcome_msg",
  "language_code": "en",
  "body_preview": "Hello {{1}}, welcome to our service!"
}
```

#### Get Templates
```http
GET /api/v1/templates
X-API-Key: your-api-key
```

---

### Campaigns

#### Create Campaign
```http
POST /api/v1/campaigns
Content-Type: application/json
X-API-Key: your-api-key

{
  "name": "January Promo",
  "description": "New year promotion campaign",
  "template_id": "template-id-here",
  "channel": "whatsapp"
}
```

#### Add Contacts to Campaign
```http
POST /api/v1/campaigns/:id/contacts
Content-Type: application/json
X-API-Key: your-api-key

{
  "contact_ids": ["person-id-1", "person-id-2"]
}
```

#### Send Campaign
```http
POST /api/v1/campaigns/:id/send
X-API-Key: your-api-key
```

#### Quick Send (All-in-One)
Create campaign, add contacts, and send in one call:

```http
POST /api/v1/campaigns/quick-send
Content-Type: application/json
X-API-Key: your-api-key

{
  "name": "Flash Sale",
  "template_id": "template-id-here",
  "contact_ids": ["person-id-1", "person-id-2"],
  "channel": "whatsapp"
}
```

---

### Channels

#### Get Configured Channels
```http
GET /api/v1/channels
X-API-Key: your-api-key
```

Response:
```json
{
  "success": true,
  "data": {
    "whatsapp": true,
    "sms": false,
    "email": false,
    "ivr": false
  }
}
```

---

## Admin Endpoints

Base URL: `/api/admin` (requires admin JWT token)

### User Management

#### Get All Users
```http
GET /api/admin/users
Authorization: Bearer admin-jwt-token
```

#### Activate User
```http
POST /api/admin/users/:id/activate
Authorization: Bearer admin-jwt-token
```

#### Deactivate User
```http
POST /api/admin/users/:id/deactivate
Authorization: Bearer admin-jwt-token
```

#### Generate API Key for User
```http
POST /api/admin/users/:id/api-key
Authorization: Bearer admin-jwt-token
```

---

## Response Format

All responses follow this format:

```json
{
  "success": true,
  "data": { ... },
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 100,
    "pages": 2
  }
}
```

Error responses:
```json
{
  "success": false,
  "error": "Error message here"
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Invalid/missing auth |
| 403 | Forbidden - Account inactive or insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Duplicate entry |
| 500 | Internal Server Error |

---

## Rate Limiting

API calls are limited to:
- 100 requests/minute per API key
- Bulk operations limited to 1000 items per request

---

## Default Admin

On first startup, a default admin is created:
- **Email:** admin@admin.com
- **Password:** admin123

⚠️ **Change this immediately in production!**
