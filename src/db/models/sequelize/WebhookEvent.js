const { DataTypes } = require('sequelize');
const sequelize = require('./index');

const WebhookEvent = sequelize.define('webhook_events', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    eventType: {
        type: DataTypes.STRING(50),
        allowNull: false,
        field: 'event_type',
        comment: 'Type of webhook event: messages, template_status, etc.'
    },
    from: {
        type: DataTypes.STRING(20),
        allowNull: true,
        comment: 'Sender phone number for message events'
    },
    messageType: {
        type: DataTypes.STRING(20),
        allowNull: true,
        field: 'message_type',
        comment: 'text, interactive, image, etc.'
    },
    messageText: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'message_text',
        comment: 'Text content of message'
    },
    templateName: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: 'template_name',
        comment: 'Template name for template_status events'
    },
    templateStatus: {
        type: DataTypes.STRING(20),
        allowNull: true,
        field: 'template_status',
        comment: 'APPROVED, REJECTED, etc.'
    },
    payload: {
        type: DataTypes.JSON,
        allowNull: false,
        comment: 'Full webhook payload'
    },
    processed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Whether event has been processed'
    },
    createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'created_at'
    }
}, {
    timestamps: false,
    tableName: 'webhook_events',
    indexes: [
        {
            fields: ['created_at']
        },
        {
            fields: ['event_type']
        },
        {
            fields: ['processed']
        }
    ]
});

module.exports = WebhookEvent;
