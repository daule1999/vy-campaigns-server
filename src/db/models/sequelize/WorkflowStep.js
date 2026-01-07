const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const WorkflowStep = sequelize.define('WorkflowStep', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        workflowId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'workflow_id',
        },
        order: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
            field: 'order',
        },
        name: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        type: {
            type: DataTypes.ENUM('data_entry', 'call', 'whatsapp', 'approval', 'automated'),
            defaultValue: 'data_entry',
        },
        assignedGroupId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'assigned_group_id',
        },
        formSchema: {
            type: DataTypes.JSON,
            defaultValue: { fields: [] },
            field: 'form_schema',
        },
        conditions: {
            type: DataTypes.JSON,
            defaultValue: null,
        },
        config: {
            type: DataTypes.JSON,
            defaultValue: {},
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            field: 'is_active',
        },
    }, {
        tableName: 'workflow_steps',
        timestamps: true,
        indexes: [
            { fields: ['workflow_id'] },
            { fields: ['workflow_id', 'order'] },
            { fields: ['assigned_group_id'] },
            { fields: ['type'] },
        ],
    });

    return WorkflowStep;
};
