const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const UserGroup = sequelize.define('UserGroup', {
        userId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            field: 'user_id',
            references: {
                model: 'users',
                key: 'id'
            },
            onDelete: 'CASCADE'
        },
        groupId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            field: 'group_id',
            references: {
                model: 'groups',
                key: 'id'
            },
            onDelete: 'CASCADE'
        }
    }, {
        tableName: 'user_groups',
        timestamps: false,
        underscored: true
    });

    return UserGroup;
};
