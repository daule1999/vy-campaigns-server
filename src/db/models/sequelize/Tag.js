const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Tag = sequelize.define('Tag', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true
        },
        color: {
            type: DataTypes.STRING(7),
            allowNull: true,
            defaultValue: '#3B82F6',
            comment: 'Hex color code for tag display'
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        category: {
            type: DataTypes.STRING(50),
            allowNull: true,
            comment: 'Category for grouping tags (e.g., status, interest, source)'
        },
        isSystem: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            field: 'is_system',
            comment: 'System tags cannot be deleted'
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
        tableName: 'tags',
        timestamps: true,
        underscored: true,
        indexes: [
            {
                fields: ['name'],
                unique: true
            },
            {
                fields: ['category']
            }
        ]
    });

    return Tag;
};
