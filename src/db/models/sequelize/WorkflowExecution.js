const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const WorkflowExecution = sequelize.define('WorkflowExecution', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        workflowId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'workflow_id',
            references: {
                model: 'workflows',
                key: 'id'
            }
        },
        contactId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'contact_id',
            references: {
                model: 'contacts',
                key: 'id'
            }
        },
        status: {
            type: DataTypes.ENUM('running', 'waiting_for_reply', 'completed', 'failed', 'cancelled'),
            allowNull: false,
            defaultValue: 'running'
        },
        currentNodeId: {
            type: DataTypes.STRING(100),
            allowNull: true,
            field: 'current_node_id',
            comment: 'Current node being executed or waiting on'
        },
        executionData: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: {},
            field: 'execution_data',
            comment: 'Runtime data, variables, user responses, etc.'
        },
        triggerData: {
            type: DataTypes.JSON,
            allowNull: true,
            field: 'trigger_data',
            comment: 'Data that triggered this workflow execution'
        },
        errorMessage: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'error_message'
        },
        startedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
            field: 'started_at'
        },
        completedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'completed_at'
        }
    }, {
        tableName: 'workflow_executions',
        timestamps: true,
        underscored: true,
        indexes: [
            {
                fields: ['workflow_id']
            },
            {
                fields: ['contact_id']
            },
            {
                fields: ['status']
            },
            {
                fields: ['started_at']
            }
        ]
    });

    return WorkflowExecution;
};
