const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const ContactTag = sequelize.define('ContactTag', {
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
        tagId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'tag_id',
            references: {
                model: 'tags',
                key: 'id'
            },
            onDelete: 'CASCADE'
        },
        addedBy: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'added_by',
            references: {
                model: 'users',
                key: 'id'
            }
        }
    }, {
        tableName: 'contact_tags',
        timestamps: true,
        underscored: true,
        indexes: [
            {
                fields: ['contact_id', 'tag_id'],
                unique: true
            },
            {
                fields: ['tag_id']
            }
        ]
    });

    return ContactTag;
};
