const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Application = sequelize.define('Application', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        productId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'product_id',
        },
        personId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'person_id',
        },
        status: {
            type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'rejected', 'cancelled'),
            defaultValue: 'pending',
        },
        currentStepId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'current_step_id',
        },
        initialData: {
            type: DataTypes.JSON,
            defaultValue: {},
            field: 'initial_data',
        },
        priority: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        createdBy: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'created_by',
        },
    }, {
        tableName: 'applications',
        timestamps: true,
        indexes: [
            { fields: ['product_id'] },
            { fields: ['person_id'] },
            { fields: ['status'] },
            { fields: ['current_step_id'] },
            { fields: ['product_id', 'status'] },
            { fields: ['priority'] },
        ],
    });

    return Application;
};
