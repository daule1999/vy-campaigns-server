const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const QuickReply = sequelize.define('QuickReply', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        title: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        category: {
            type: DataTypes.STRING(50),
            allowNull: true,
            comment: 'Category for organization (greeting, faq, closing, etc.)'
        },
        isGlobal: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            field: 'is_global',
            comment: 'Available to all users if true'
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
        tableName: 'quick_replies',
        timestamps: true,
        underscored: true,
        indexes: [
            {
                fields: ['category']
            },
            {
                fields: ['is_global']
            },
            {
                fields: ['created_by']
            }
        ]
    });

    return QuickReply;
};
