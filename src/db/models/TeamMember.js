const { DataTypes } = require('sequelize');
const { sequelize } = require('../connection');

const TeamMember = sequelize.define('TeamMember', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    teamId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'team_id',
        references: {
            model: 'teams',
            key: 'id'
        },
        onDelete: 'CASCADE'
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
    isLead: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_lead'
    }
}, {
    tableName: 'team_members',
    timestamps: true,
    createdAt: true,
    updatedAt: false,
    underscored: true,
    indexes: [
        {
            unique: true,
            fields: ['team_id', 'user_id']
        }
    ]
});

module.exports = TeamMember;
