const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const StepExecution = sequelize.define('StepExecution', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        applicationId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'application_id',
        },
        stepId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'step_id',
        },
        status: {
            type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'skipped', 'rejected'),
            defaultValue: 'pending',
        },
        formData: {
            type: DataTypes.JSON,
            defaultValue: {},
            field: 'form_data',
        },
        assignedTo: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'assigned_to',
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        startedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'started_at',
        },
        completedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'completed_at',
        },
        completedBy: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'completed_by',
        },
    }, {
        tableName: 'step_executions',
        timestamps: true,
        indexes: [
            { fields: ['application_id'] },
            { fields: ['step_id'] },
            { fields: ['assigned_to'] },
            { fields: ['status'] },
            { fields: ['application_id', 'step_id'], unique: true },
        ],
    });

    return StepExecution;
};
