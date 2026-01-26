const { DataTypes } = require('sequelize');
const { sequelize } = require('../connection');

const RolePermission = sequelize.define('RolePermission', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
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
    },
    permissionId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'permission_id',
        references: {
            model: 'permissions',
            key: 'id'
        },
        onDelete: 'CASCADE'
    }
}, {
    tableName: 'role_permissions',
    timestamps: true,
    createdAt: true,
    updatedAt: false,
    underscored: true,
    indexes: [
        {
            unique: true,
            fields: ['role_id', 'permission_id']
        }
    ]
});

module.exports = RolePermission;
