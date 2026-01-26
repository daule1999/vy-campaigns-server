const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const ContactField = sequelize.define('ContactField', {
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
        label: {
            type: DataTypes.STRING(200),
            allowNull: false
        },
        fieldType: {
            type: DataTypes.ENUM('text', 'number', 'date', 'boolean', 'dropdown', 'multiselect', 'email', 'phone', 'url'),
            allowNull: false,
            field: 'field_type'
        },
        options: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Options for dropdown/multiselect fields'
        },
        defaultValue: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'default_value'
        },
        isRequired: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            field: 'is_required'
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            field: 'is_active'
        },
        displayOrder: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            field: 'display_order'
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
        tableName: 'contact_fields',
        timestamps: true,
        underscored: true,
        indexes: [
            {
                fields: ['name'],
                unique: true
            },
            {
                fields: ['is_active']
            }
        ]
    });

    return ContactField;
};
