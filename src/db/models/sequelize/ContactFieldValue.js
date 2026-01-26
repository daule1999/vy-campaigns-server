const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const ContactFieldValue = sequelize.define('ContactFieldValue', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        contactId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'contact_id',
            references: {
                model: 'contacts',
                key: 'id'
            },
            onDelete: 'CASCADE'
        },
        fieldId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'field_id',
            references: {
                model: 'contact_fields',
                key: 'id'
            },
            onDelete: 'CASCADE'
        },
        value: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    }, {
        tableName: 'contact_field_values',
        timestamps: true,
        underscored: true,
        indexes: [
            {
                fields: ['contact_id', 'field_id'],
                unique: true
            },
            {
                fields: ['field_id']
            }
        ]
    });

    return ContactFieldValue;
};
