# VY Campaigns API Server

WhatsApp campaign management API server built with Node.js, Express, MySQL, and Redis.

## 🚀 Features

- **WhatsApp Integration** - Send campaigns via WhatsApp Business API
- **Campaign Management** - Create, schedule, and track campaigns
- **Template Management** - Manage WhatsApp message templates
- **Contact Management** - Organize contacts and persons
- **Product Catalog** - Maintain product information
- **Autoresponders** - Automated workflow rules
- **Work Queue** - Distributed task processing with BullMQ
- **RBAC** - Role-based access control
- **Audit Logging** - Track all system changes
- **Public API** - RESTful API for external integrations

## 📋 Prerequisites

- **Node.js** 18.x or higher
- **MySQL** 8.0 or higher (or TiDB Serverless)
- **Redis** 6.x or higher (or Upstash Redis)
- **WhatsApp Business API** credentials

## 🛠️ Installation

### 1. Clone the Repository

```bash
git clone https://github.com/daule1999/vy-campaigns-server.git
cd vy-campaigns-server
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
# Server Configuration
NODE_ENV=development
PORT=3000

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

# Database Configuration
DATABASE_HOST=your-database-host
DATABASE_PORT=3306
DATABASE_NAME=your-database-name
DATABASE_USER=your-database-user
DATABASE_PASSWORD=your-database-password

# Redis Configuration
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
REDIS_URL=redis://:password@host:port

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this

# WhatsApp Business API
WHATSAPP_ACCESS_TOKEN=your-whatsapp-access-token
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
WHATSAPP_BUSINESS_ACCOUNT_ID=your-business-account-id
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your-webhook-verify-token

# Optional: Other Channels (SMS, Email, IVR)
# Currently not implemented
SMS_ENABLED=false
EMAIL_ENABLED=false
IVR_ENABLED=false
```

### 4. Set Up Database

Run migrations to create database tables:

```bash
npm run migrate
```

This will create all necessary tables and seed initial data (default admin user).

## 🏃 Running the Server

### Development Mode

```bash
npm run dev
```

Server will start with hot-reload enabled at `http://localhost:3000`

### Production Mode

```bash
npm start
```

## 📚 API Documentation

### Base URL
- Development: `http://localhost:3000/api`
- Production: `https://your-domain.com/api`

### Health Check
```bash
GET /api/health
```

Returns server status and configured channels.

### Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Main API Endpoints

#### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration (if enabled)
- `GET /api/auth/me` - Get current user
- `POST /api/auth/change-password` - Change password

#### Campaigns
- `GET /api/campaigns` - List all campaigns
- `POST /api/campaigns` - Create campaign
- `GET /api/campaigns/:id` - Get campaign details
- `PUT /api/campaigns/:id` - Update campaign
- `DELETE /api/campaigns/:id` - Delete campaign
- `POST /api/campaigns/:id/execute` - Execute campaign

#### Templates
- `GET /api/templates` - List templates
- `POST /api/templates` - Create template
- `GET /api/templates/:id` - Get template
- `PUT /api/templates/:id` - Update template
- `DELETE /api/templates/:id` - Delete template

#### Persons (Contacts)
- `GET /api/persons` - List persons
- `POST /api/persons` - Create person
- `POST /api/persons/import` - Bulk import from CSV/Excel
- `GET /api/persons/:id` - Get person
- `PUT /api/persons/:id` - Update person
- `DELETE /api/persons/:id` - Delete person

#### Products
- `GET /api/products` - List products
- `POST /api/products` - Create product
- `GET /api/products/:id` - Get product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

#### Work Queue
- `GET /api/workqueue` - List work items
- `POST /api/workqueue/:id/claim` - Claim work item
- `POST /api/workqueue/:id/complete` - Complete work item

#### Admin
- `GET /api/admin/users` - List users
- `POST /api/admin/users` - Create user
- `GET /api/admin/groups` - List groups
- `POST /api/admin/groups` - Create group

#### Audit Logs
- `GET /api/audit` - List audit logs

#### Public API
- `GET /api/public/contacts/:identifier` - Get contact by identifier
- `POST /api/public/contacts` - Create/update contact (with API key)

### WhatsApp Webhook
- `GET /api/webhook` - Webhook verification
- `POST /api/webhook` - Receive WhatsApp webhook events

## 🧪 Testing

### Run All Tests
```bash
npm test
```

### Run API Tests
```bash
npm run test:api
```

### Run Specific Test Suite
```bash
npm run test:api:only auth
```

## 🗄️ Database Schema

The application uses MySQL with the following main tables:

- `users` - User accounts
- `groups` - User groups
- `roles` - RBAC roles
- `permissions` - RBAC permissions
- `campaigns` - Campaign definitions
- `templates` - Message templates
- `persons` - Contact database
- `products` - Product catalog
- `applications` - Custom applications/workflows
- `workflows` - Workflow definitions
- `workqueue` - Work item queue
- `audit_logs` - System audit trail

## 📁 Project Structure

```
vy-campaigns-server/
├── src/
│   ├── index.js              # Application entry point
│   ├── config.js             # Configuration
│   ├── migrate.js            # Database migration script
│   ├── db/
│   │   ├── connection.js     # Database connection
│   │   └── models/           # Sequelize models
│   ├── middleware/           # Express middleware
│   ├── routes/               # API route handlers
│   ├── services/             # Business logic
│   │   ├── whatsapp.js       # WhatsApp service
│   │   └── queue.js          # BullMQ job queue
│   ├── repositories/         # Data access layer
│   └── utils/                # Utility functions
├── tests/                    # API tests
├── migrations/               # Database migrations
├── package.json
└── README.md
```

## 🔐 Default Credentials

After running migrations, a default admin user is created:

- **Email**: `admin@admin.com`
- **Password**: `admin123`

**⚠️ Change these credentials immediately in production!**

## 🌐 Environment Setup

### Local Development
1. Install MySQL locally or use Docker
2. Install Redis locally or use Docker
3. Set up WhatsApp Business API test account
4. Configure `.env` with local credentials

### Production (Vercel/Render)
1. Use TiDB Serverless for MySQL
2. Use Upstash Redis for Redis
3. Configure environment variables in platform dashboard
4. Set up WhatsApp webhook URL

## 🚀 Deployment

### Deploy to Vercel

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel --prod
```

3. Configure environment variables in Vercel dashboard

### Deploy to Render

1. Connect GitHub repository
2. Set build command: `npm install`
3. Set start command: `npm start`
4. Configure environment variables
5. Deploy

See [DEPLOYMENT_GUIDE.md](../DEPLOYMENT_GUIDE.md) for detailed deployment instructions.

## 🔧 Troubleshooting

### Database Connection Issues
- Verify `DATABASE_*` environment variables
- Check if database server is running
- Ensure firewall allows connections

### Redis Connection Issues
- Verify `REDIS_*` environment variables
- Check if Redis server is running
- For Upstash, ensure `REDIS_URL` format is correct

### WhatsApp API Issues
- Verify `WHATSAPP_*` credentials
- Check Meta Business dashboard for API status
- Ensure webhook URL is accessible (use ngrok for local testing)

### Migration Issues
- Drop all tables and re-run: `npm run migrate`
- Check MySQL user has CREATE/ALTER permissions

## 📝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -m 'Add my feature'`
4. Push to branch: `git push origin feature/my-feature`
5. Submit pull request

## 📄 License

Proprietary - VY Campaigns

## 🆘 Support

For issues or questions, contact the development team.

---

**Built with ❤️ for efficient WhatsApp campaign management**
