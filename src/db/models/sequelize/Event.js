const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Event = sequelize.define('Event', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        contactId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'contact_id',
            references: {
                model: 'contacts',
                key: 'id',
            },
        },
        eventType: {
            type: DataTypes.ENUM('button_click', 'flow_completed', 'ctwa_click', 'custom', 'message_sent', 'message_delivered', 'message_read', 'message_replied'),
            allowNull: false,
            field: 'event_type',
        },
        eventName: {
            type: DataTypes.STRING,
            allowNull: false,
            field: 'event_name',
        },
        source: {
            type: DataTypes.ENUM('campaign', 'workflow', 'manual', 'widget', 'system'),
            allowNull: true,
        },
        sourceId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'source_id',
        },
        metadata: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Button ID, button type, message ID, etc.',
        },
        traits: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Event-specific attributes and custom data',
        },
        timestamp: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
        sessionId: {
            type: DataTypes.STRING,
            allowNull: true,
            field: 'session_id',
        },
    }, {
        tableName: 'events',
        timestamps: true,
        updatedAt: false,
        underscored: true,
        indexes: [
            { fields: ['contact_id'] },
            { fields: ['event_type'] },
            { fields: ['source', 'source_id'] },
            { fields: ['timestamp'] },
            { fields: ['event_name'] },
        ],
    });

    return Event;
};
