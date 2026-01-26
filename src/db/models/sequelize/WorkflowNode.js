const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const WorkflowNode = sequelize.define('WorkflowNode', {
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
        nodeId: {
            type: DataTypes.STRING(100),
            allowNull: false,
            field: 'node_id',
            comment: 'Unique identifier within workflow (e.g., "node_1", "trigger", "send_welcome")'
        },
        nodeType: {
            type: DataTypes.ENUM(
                // Trigger nodes
                'trigger',
                // Message nodes
                'send_text', 'send_image', 'send_video', 'send_document',
                'send_interactive_list', 'send_interactive_buttons', 'send_template',
                // Action nodes
                'assign_agent', 'assign_team', 'add_tag', 'remove_tag',
                'update_field', 'send_event', 'webhook', 'create_ticket',
                // Logic nodes
                'condition', 'switch', 'wait_for_reply', 'delay', 'loop', 'end'
            ),
            allowNull: false,
            field: 'node_type'
        },
        config: {
            type: DataTypes.JSON,
            allowNull: false,
            defaultValue: {},
            comment: 'Node-specific configuration (message content, conditions, etc.)'
        },
        position: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Visual position in workflow editor {x, y}'
        },
        parentNodeId: {
            type: DataTypes.STRING(100),
            allowNull: true,
            field: 'parent_node_id',
            comment: 'Parent node ID for hierarchical workflows'
        },
        order: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            comment: 'Execution order among sibling nodes'
        }
    }, {
        tableName: 'workflow_nodes',
        timestamps: true,
        underscored: true,
        indexes: [
            {
                fields: ['workflow_id', 'node_id'],
                unique: true
            },
            {
                fields: ['node_type']
            }
        ]
    });

    return WorkflowNode;
};
