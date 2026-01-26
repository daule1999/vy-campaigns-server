const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const EventDefinition = sequelize.define('EventDefinition', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        category: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'e.g., Engagement, Conversion, Acquisition',
        },
        isSystem: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            field: 'is_system',
            comment: 'System events cannot be deleted',
        },
        schema: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Expected traits/attributes schema',
        },
        createdBy: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'created_by',
            references: {
                model: 'users',
                key: 'id',
            },
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            field: 'is_active',
        },
    }, {
        tableName: 'event_definitions',
        timestamps: true,
        underscored: true,
        indexes: [
            { fields: ['name'] },
            { fields: ['category'] },
            { fields: ['is_active'] },
        ],
    });

    return EventDefinition;
};
