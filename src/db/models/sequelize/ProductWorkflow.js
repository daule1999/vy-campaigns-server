const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const ProductWorkflow = sequelize.define('ProductWorkflow', {
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
        name: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            field: 'is_active',
        },
    }, {
        tableName: 'product_workflows',
        timestamps: true,
        indexes: [
            { fields: ['product_id'] },
            { fields: ['is_active'] },
        ],
    });

    return ProductWorkflow;
};
