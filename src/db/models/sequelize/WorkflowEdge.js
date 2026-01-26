const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const WorkflowEdge = sequelize.define('WorkflowEdge', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        workflowId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'workflow_id',
            references: {
                model: 'workflows',
                key: 'id'
            },
            onDelete: 'CASCADE'
        },
        sourceNodeId: {
            type: DataTypes.STRING(100),
            allowNull: false,
            field: 'source_node_id',
            comment: 'Starting node ID'
        },
        targetNodeId: {
            type: DataTypes.STRING(100),
            allowNull: false,
            field: 'target_node_id',
            comment: 'Destination node ID'
        },
        condition: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Conditional logic for this edge (null = always follow)'
        },
        label: {
            type: DataTypes.STRING(100),
            allowNull: true,
            comment: 'Edge label for visualization (e.g., "Yes", "No", "Option A")'
        }
    }, {
        tableName: 'workflow_edges',
        timestamps: true,
        underscored: true,
        indexes: [
            {
                fields: ['workflow_id']
            },
            {
                fields: ['source_node_id']
            }
        ]
    });

    return WorkflowEdge;
};
