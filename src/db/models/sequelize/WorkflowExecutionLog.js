const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const WorkflowExecutionLog = sequelize.define('WorkflowExecutionLog', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        executionId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'execution_id',
            references: {
                model: 'workflow_executions',
                key: 'id'
            },
            onDelete: 'CASCADE'
        },
        nodeId: {
            type: DataTypes.STRING(100),
            allowNull: false,
            field: 'node_id'
        },
        actionType: {
            type: DataTypes.STRING(50),
            allowNull: false,
            field: 'action_type',
            comment: 'Type of action performed (send_message, evaluate_condition, etc.)'
        },
        inputData: {
            type: DataTypes.JSON,
            allowNull: true,
            field: 'input_data',
            comment: 'Input to this node execution'
        },
        outputData: {
            type: DataTypes.JSON,
            allowNull: true,
            field: 'output_data',
            comment: 'Output from this node execution'
        },
        status: {
            type: DataTypes.ENUM('success', 'failed', 'skipped'),
            allowNull: false,
            defaultValue: 'success'
        },
        errorMessage: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'error_message'
        },
        executedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
            field: 'executed_at'
        }
    }, {
        tableName: 'workflow_execution_logs',
        timestamps: false,
        underscored: true,
        indexes: [
            {
                fields: ['execution_id']
            },
            {
                fields: ['executed_at']
            }
        ]
    });

    return WorkflowExecutionLog;
};
