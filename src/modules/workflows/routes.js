/**
 * Workflow Management Routes
 * Handles workflow creation, editing, execution, and analytics
 */

const express = require('express');
const router = express.Router();
const { Workflow, WorkflowNode, WorkflowEdge, WorkflowExecution, WorkflowExecutionLog, Contact } = require('../../db/models/sequelize');
const { authenticate } = require('../../middleware/auth');
const { hasPermission } = require('../../middleware/rbac');
const workflowExecutor = require('../../services/workflowExecutor');

/**
 * GET /api/workflows
 * List all workflows
 */
router.get('/', authenticate, hasPermission('automation.view_workflows'), async (req, res) => {
    try {
        const { triggerType, isActive, search } = req.query;

        const where = {};
        if (triggerType) where.triggerType = triggerType;
        if (isActive !== undefined) where.isActive = isActive === 'true';
        if (search) {
            where[Op.or] = [
                { name: { [Op.like]: `%${search}%` } },
                { description: { [Op.like]: `%${search}%` } }
            ];
        }

        const workflows = await Workflow.findAll({
            where,
            include: [
                { model: User, as: 'creator', attributes: ['id', 'name', 'email'] }
            ],
            order: [['priority', 'DESC'], ['createdAt', 'DESC']]
        });

        res.json({
            success: true,
            data: workflows
        });
    } catch (error) {
        console.error('Error fetching workflows:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching workflows'
        });
    }
});

/**
 * GET /api/workflows/:id
 * Get workflow with nodes and edges
 */
router.get('/:id', authenticate, hasPermission('automation.view_workflows'), async (req, res) => {
    try {
        const workflow = await Workflow.findByPk(req.params.id, {
            include: [
                { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
                { model: WorkflowNode, as: 'nodes' },
                { model: WorkflowEdge, as: 'edges' }
            ]
        });

        if (!workflow) {
            return res.status(404).json({
                success: false,
                message: 'Workflow not found'
            });
        }

        res.json({
            success: true,
            data: workflow
        });
    } catch (error) {
        console.error('Error fetching workflow:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching workflow'
        });
    }
});

/**
 * POST /api/workflows
 * Create new workflow
 */
router.post('/', authenticate, hasPermission('automation.create_workflows'), async (req, res) => {
    try {
        const { name, description, triggerType, triggerConfig, nodes, edges, priority } = req.body;

        if (!name || !triggerType || !triggerConfig) {
            return res.status(400).json({
                success: false,
                message: 'Name, triggerType, and triggerConfig are required'
            });
        }

        // Create workflow
        const workflow = await Workflow.create({
            name,
            description,
            triggerType,
            triggerConfig,
            priority: priority || 0,
            createdBy: req.user.id,
            isActive: false // Start inactive
        });

        // Create nodes if provided
        if (nodes && Array.isArray(nodes)) {
            for (const node of nodes) {
                await WorkflowNode.create({
                    workflowId: workflow.id,
                    ...node
                });
            }
        }

        // Create edges if provided
        if (edges && Array.isArray(edges)) {
            for (const edge of edges) {
                await WorkflowEdge.create({
                    workflowId: workflow.id,
                    ...edge
                });
            }
        }

        // Reload with associations
        const createdWorkflow = await Workflow.findByPk(workflow.id, {
            include: [
                { model: WorkflowNode, as: 'nodes' },
                { model: WorkflowEdge, as: 'edges' }
            ]
        });

        res.status(201).json({
            success: true,
            message: 'Workflow created successfully',
            data: createdWorkflow
        });
    } catch (error) {
        console.error('Error creating workflow:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating workflow'
        });
    }
});

/**
 * PUT /api/workflows/:id
 * Update workflow
 */
router.put('/:id', authenticate, hasPermission('automation.update_workflows'), async (req, res) => {
    try {
        const { name, description, triggerType, triggerConfig, priority, nodes, edges } = req.body;

        const workflow = await Workflow.findByPk(req.params.id);
        if (!workflow) {
            return res.status(404).json({
                success: false,
                message: 'Workflow not found'
            });
        }

        // Update workflow
        await workflow.update({
            name: name || workflow.name,
            description,
            triggerType: triggerType || workflow.triggerType,
            triggerConfig: triggerConfig || workflow.triggerConfig,
            priority: priority !== undefined ? priority : workflow.priority
        });

        // Update nodes if provided
        if (nodes) {
            // Delete existing nodes
            await WorkflowNode.destroy({ where: { workflowId: workflow.id } });
            // Create new nodes
            for (const node of nodes) {
                await WorkflowNode.create({
                    workflowId: workflow.id,
                    ...node
                });
            }
        }

        // Update edges if provided
        if (edges) {
            // Delete existing edges
            await WorkflowEdge.destroy({ where: { workflowId: workflow.id } });
            // Create new edges
            for (const edge of edges) {
                await WorkflowEdge.create({
                    workflowId: workflow.id,
                    ...edge
                });
            }
        }

        // Reload
        const updatedWorkflow = await Workflow.findByPk(workflow.id, {
            include: [
                { model: WorkflowNode, as: 'nodes' },
                { model: WorkflowEdge, as: 'edges' }
            ]
        });

        res.json({
            success: true,
            message: 'Workflow updated successfully',
            data: updatedWorkflow
        });
    } catch (error) {
        console.error('Error updating workflow:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating workflow'
        });
    }
});

/**
 * DELETE /api/workflows/:id
 * Delete workflow
 */
router.delete('/:id', authenticate, hasPermission('automation.delete_workflows'), async (req, res) => {
    try {
        const workflow = await Workflow.findByPk(req.params.id);
        if (!workflow) {
            return res.status(404).json({
                success: false,
                message: 'Workflow not found'
            });
        }

        await workflow.destroy();

        res.json({
            success: true,
            message: 'Workflow deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting workflow:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting workflow'
        });
    }
});

/**
 * POST /api/workflows/:id/activate
 * Activate workflow
 */
router.post('/:id/activate', authenticate, hasPermission('automation.update_workflows'), async (req, res) => {
    try {
        const workflow = await Workflow.findByPk(req.params.id);
        if (!workflow) {
            return res.status(404).json({
                success: false,
                message: 'Workflow not found'
            });
        }

        await workflow.update({ isActive: true });

        res.json({
            success: true,
            message: 'Workflow activated',
            data: workflow
        });
    } catch (error) {
        console.error('Error activating workflow:', error);
        res.status(500).json({
            success: false,
            message: 'Error activating workflow'
        });
    }
});

/**
 * POST /api/workflows/:id/deactivate
 * Deactivate workflow
 */
router.post('/:id/deactivate', authenticate, hasPermission('automation.update_workflows'), async (req, res) => {
    try {
        const workflow = await Workflow.findByPk(req.params.id);
        if (!workflow) {
            return res.status(404).json({
                success: false,
                message: 'Workflow not found'
            });
        }

        await workflow.update({ isActive: false });

        res.json({
            success: true,
            message: 'Workflow deactivated',
            data: workflow
        });
    } catch (error) {
        console.error('Error deactivating workflow:', error);
        res.status(500).json({
            success: false,
            message: 'Error deactivating workflow'
        });
    }
});

/**
 * POST /api/workflows/:id/execute
 * Manually trigger workflow execution
 */
router.post('/:id/execute', authenticate, hasPermission('automation.create_workflows'), async (req, res) => {
    try {
        const { contactId, triggerData } = req.body;

        if (!contactId) {
            return res.status(400).json({
                success: false,
                message: 'contactId is required'
            });
        }

        const contact = await Contact.findByPk(contactId);
        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'Contact not found'
            });
        }

        const execution = await workflowExecutor.execute(
            parseInt(req.params.id),
            contactId,
            triggerData || {}
        );

        res.json({
            success: true,
            message: 'Workflow execution started',
            data: execution
        });
    } catch (error) {
        console.error('Error executing workflow:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error executing workflow'
        });
    }
});

/**
 * GET /api/workflows/:id/executions
 * Get workflow execution history
 */
router.get('/:id/executions', authenticate, hasPermission('automation.view_workflows'), async (req, res) => {
    try {
        const { status, limit = 50, offset = 0 } = req.query;

        const where = { workflowId: req.params.id };
        if (status) where.status = status;

        const executions = await WorkflowExecution.findAndCountAll({
            where,
            include: [
                { model: Contact, as: 'contact', attributes: ['id', 'name', 'phoneNumber'] }
            ],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['startedAt', 'DESC']]
        });

        res.json({
            success: true,
            data: executions.rows,
            total: executions.count,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
    } catch (error) {
        console.error('Error fetching executions:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching executions'
        });
    }
});

/**
 * GET /api/workflows/:id/executions/:executionId
 * Get detailed execution logs
 */
router.get('/:id/executions/:executionId', authenticate, hasPermission('automation.view_workflows'), async (req, res) => {
    try {
        const execution = await WorkflowExecution.findOne({
            where: {
                id: req.params.executionId,
                workflowId: req.params.id
            },
            include: [
                { model: Contact, as: 'contact' },
                { model: WorkflowExecutionLog, as: 'logs', order: [['executedAt', 'ASC']] }
            ]
        });

        if (!execution) {
            return res.status(404).json({
                success: false,
                message: 'Execution not found'
            });
        }

        res.json({
            success: true,
            data: execution
        });
    } catch (error) {
        console.error('Error fetching execution:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching execution'
        });
    }
});

/**
 * POST /api/workflows/:id/duplicate
 * Duplicate workflow
 */
router.post('/:id/duplicate', authenticate, hasPermission('automation.create_workflows'), async (req, res) => {
    try {
        const original = await Workflow.findByPk(req.params.id, {
            include: [
                { model: WorkflowNode, as: 'nodes' },
                { model: WorkflowEdge, as: 'edges' }
            ]
        });

        if (!original) {
            return res.status(404).json({
                success: false,
                message: 'Workflow not found'
            });
        }

        // Create duplicate
        const duplicate = await Workflow.create({
            name: `${original.name} (Copy)`,
            description: original.description,
            triggerType: original.triggerType,
            triggerConfig: original.triggerConfig,
            priority: original.priority,
            createdBy: req.user.id,
            isActive: false
        });

        // Duplicate nodes
        for (const node of original.nodes) {
            await WorkflowNode.create({
                workflowId: duplicate.id,
                nodeId: node.nodeId,
                nodeType: node.nodeType,
                config: node.config,
                position: node.position,
                parentNodeId: node.parentNodeId,
                order: node.order
            });
        }

        // Duplicate edges
        for (const edge of original.edges) {
            await WorkflowEdge.create({
                workflowId: duplicate.id,
                sourceNodeId: edge.sourceNodeId,
                targetNodeId: edge.targetNodeId,
                condition: edge.condition,
                label: edge.label
            });
        }

        const duplicatedWorkflow = await Workflow.findByPk(duplicate.id, {
            include: [
                { model: WorkflowNode, as: 'nodes' },
                { model: WorkflowEdge, as: 'edges' }
            ]
        });

        res.status(201).json({
            success: true,
            message: 'Workflow duplicated successfully',
            data: duplicatedWorkflow
        });
    } catch (error) {
        console.error('Error duplicating workflow:', error);
        res.status(500).json({
            success: false,
            message: 'Error duplicating workflow'
        });
    }
});

module.exports = router;
