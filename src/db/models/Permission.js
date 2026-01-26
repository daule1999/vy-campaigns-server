const { DataTypes } = require('sequelize');
const { sequelize } = require('../connection');

const Permission = sequelize.define('Permission', {
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
    category: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'permissions',
    timestamps: true,
    createdAt: true,
    updatedAt: false,
    underscored: true
});

module.exports = Permission;
