const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const CampaignProduct = sequelize.define('CampaignProduct', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
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
        config: {
            type: DataTypes.JSON,
            defaultValue: {},
            comment: 'Additional product configuration',
        },
        createdBy: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'created_by',
        },
    }, {
        tableName: 'campaign_products',
        timestamps: true,
        indexes: [
            { fields: ['is_active'] },
            { fields: ['created_by'] },
        ],
    });

    return CampaignProduct;
};

