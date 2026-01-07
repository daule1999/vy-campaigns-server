const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const GroupPermission = sequelize.define('GroupPermission', {
        groupId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            field: 'group_id',
            references: {
                model: 'groups',
                key: 'id'
            },
            onDelete: 'CASCADE'
        },
        permissionId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            field: 'permission_id',
            references: {
                model: 'permissions',
                key: 'id'
            },
            onDelete: 'CASCADE'
        }
    }, {
        tableName: 'group_permissions',
        timestamps: false,
        underscored: true
    });

    return GroupPermission;
};
