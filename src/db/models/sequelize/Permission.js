const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Permission = sequelize.define('Permission', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
            comment: 'Permission identifier, e.g., campaigns:read, templates:write'
        },
        description: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        feature: {
            type: DataTypes.STRING(50),
            allowNull: false,
            comment: 'Feature category, e.g., campaigns, templates, admin'
        }
    }, {
        tableName: 'permissions',
        timestamps: true,
        underscored: true
    });

    return Permission;
};
