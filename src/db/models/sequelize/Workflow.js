const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Workflow = sequelize.define('Workflow', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING(200),
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        triggerType: {
            type: DataTypes.ENUM('keyword', 'button', 'event', 'schedule', 'manual', 'webhook'),
            allowNull: false,
            field: 'trigger_type'
        },
        triggerConfig: {
            type: DataTypes.JSON,
            allowNull: false,
            field: 'trigger_config',
            comment: 'Configuration for trigger (keywords, event name, schedule, etc.)'
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            field: 'is_active'
        },
        priority: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            comment: 'Higher priority workflows are checked first'
        },
        executionCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            field: 'execution_count'
        },
        successCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            field: 'success_count'
        },
        failureCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            field: 'failure_count'
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
        tableName: 'workflows',
        timestamps: true,
        underscored: true,
        indexes: [
            {
                fields: ['trigger_type']
            },
            {
                fields: ['is_active']
            },
            {
                fields: ['priority']
            }
        ]
    });

    return Workflow;
};
