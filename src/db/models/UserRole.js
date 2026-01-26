const { DataTypes } = require('sequelize');
const { sequelize } = require('../connection');

const UserRole = sequelize.define('UserRole', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'user_id',
        references: {
            model: 'users',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    roleId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'role_id',
        references: {
            model: 'roles',
            key: 'id'
        },
        onDelete: 'CASCADE'
    }
}, {
    tableName: 'user_roles',
    timestamps: true,
    createdAt: true,
    updatedAt: false,
    underscored: true,
    indexes: [
        {
            unique: true,
            fields: ['user_id', 'role_id']
        }
    ]
});

module.exports = UserRole;
