const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const InboxSetting = sequelize.define('InboxSetting', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        // Welcome Message
        welcomeMessageEnabled: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            field: 'welcome_message_enabled'
        },
        welcomeMessageText: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'welcome_message_text'
        },

        // Out of Office
        oooEnabled: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            field: 'ooo_enabled'
        },
        oooMessage: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'ooo_message'
        },
        oooSchedule: {
            type: DataTypes.JSON,
            allowNull: true,
            field: 'ooo_schedule',
            comment: 'Schedule when OOO is active {start, end, timezone}'
        },

        // Delayed Response
        delayedResponseEnabled: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            field: 'delayed_response_enabled'
        },
        delayedResponseTime: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'delayed_response_time',
            comment: 'Minutes to wait before sending delayed response'
        },
        delayedResponseMessage: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'delayed_response_message'
        },

        // Working Hours
        workingHours: {
            type: DataTypes.JSON,
            allowNull: true,
            field: 'working_hours',
            comment: 'Working hours configuration {timezone, days: {monday: {start, end}, ...}}'
        },

        // Auto-assignment
        autoAssignmentEnabled: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            field: 'auto_assignment_enabled'
        },
        autoAssignmentType: {
            type: DataTypes.ENUM('round_robin', 'load_balanced', 'team_based'),
            allowNull: true,
            field: 'auto_assignment_type'
        },

        createdBy: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'created_by',
            references: {
                model: 'users',
                key: 'id'
            }
        }
    }, {
        tableName: 'inbox_settings',
        timestamps: true,
        underscored: true
    });

    return InboxSetting;
};
