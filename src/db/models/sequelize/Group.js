const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Group = sequelize.define('Group', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
            comment: 'Group name, e.g., Marketing Team, Viewers'
        },
        description: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        level: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 10,
            comment: 'Hierarchy level (1=highest rank, 10=lowest). Users can only manage lower-ranked users.'
        }
    }, {
        tableName: 'groups',
        timestamps: true,
        underscored: true
    });

    return Group;
};
