/**
 * Workflow Execution Engine
 * Handles execution of automation workflows with node processing
 */

const { Workflow, WorkflowNode, WorkflowEdge, WorkflowExecution, WorkflowExecutionLog, Contact } = require('../db/models/sequelize');
const whatsapp = require('./whatsapp');

class WorkflowExecutor {
    /**
     * Start a new workflow execution
     * @param {number} workflowId - Workflow ID to execute
     * @param {number} contactId - Contact ID
     * @param {object} triggerData - Data that triggered the workflow
     * @returns {Promise<WorkflowExecution>}
     */
    async execute(workflowId, contactId, triggerData = {}) {
        try {
            // Load workflow with nodes and edges
            const workflow = await Workflow.findByPk(workflowId, {
                include: [
                    { model: WorkflowNode, as: 'nodes' },
                    { model: WorkflowEdge, as: 'edges' }
                ]
            });

            if (!workflow || !workflow.isActive) {
                throw new Error('Workflow not found or inactive');
            }

            // Create execution record
            const execution = await WorkflowExecution.create({
                workflowId,
                contactId,
                status: 'running',
                triggerData,
                executionData: {},
                currentNodeId: null
            });

            // Update workflow stats
            await workflow.increment('executionCount');

            // Find trigger/start node
            const startNode = workflow.nodes.find(n => n.nodeType === 'trigger');
            if (!startNode) {
                throw new Error('No trigger node found in workflow');
            }

            // Start execution from trigger node
            await this.processNode(startNode, workflow, execution);

            return execution;
        } catch (error) {
            console.error('Workflow execution error:', error);
            throw error;
        }
    }

    /**
     * Process a single node
     * @param {WorkflowNode} node - Node to process
     * @param {Workflow} workflow - Full workflow
     * @param {WorkflowExecution} execution - Current execution
     */
    async processNode(node, workflow, execution) {
        try {
            // Update current node
            await execution.update({ currentNodeId: node.nodeId });

            // Log node execution start
            const log = await WorkflowExecutionLog.create({
                executionId: execution.id,
                nodeId: node.nodeId,
                actionType: node.nodeType,
                inputData: execution.executionData,
                status: 'success'
            });

            let result;

            // Process based on node type
            switch (node.nodeType) {
                case 'trigger':
                    result = await this.processTrigger(node, execution);
                    break;
                case 'send_text':
                    result = await this.sendTextMessage(node, execution);
                    break;
                case 'send_interactive_list':
                    result = await this.sendInteractiveList(node, execution);
                    break;
                case 'send_interactive_buttons':
                    result = await this.sendInteractiveButtons(node, execution);
                    break;
                case 'delay':
                    result = await this.processDelay(node, execution);
                    break;
                case 'condition':
                    result = await this.processCondition(node, execution);
                    break;
                case 'wait_for_reply':
                    result = await this.waitForReply(node, execution);
                    return; // Exit - waiting for user input
                case 'assign_agent':
                    result = await this.assignAgent(node, execution);
                    break;
                case 'add_tag':
                    result = await this.addTag(node, execution);
                    break;
                case 'update_field':
                    result = await this.updateField(node, execution);
                    break;
                case 'end':
                    await this.completeExecution(execution, 'completed');
                    return;
                default:
                    console.warn(`Unknown node type: ${node.nodeType}`);
            }

            // Update log with result
            await log.update({ outputData: result });

            // Find next node(s) to process
            const nextNodes = await this.getNextNodes(node, workflow, result, execution);

            if (nextNodes.length === 0) {
                // No more nodes, complete execution
                await this.completeExecution(execution, 'completed');
                return;
            }

            // Process next nodes
            for (const nextNode of nextNodes) {
                await this.processNode(nextNode, workflow, execution);
            }

        } catch (error) {
            console.error(`Error processing node ${node.nodeId}:`, error);
            await WorkflowExecutionLog.create({
                executionId: execution.id,
                nodeId: node.nodeId,
                actionType: node.nodeType,
                status: 'failed',
                errorMessage: error.message
            });
            await this.completeExecution(execution, 'failed', error.message);
        }
    }

    /**
     * Get next nodes to execute based on edges and conditions
     */
    async getNextNodes(currentNode, workflow, nodeResult, execution) {
        const edges = workflow.edges.filter(e => e.sourceNodeId === currentNode.nodeId);
        const nextNodes = [];

        for (const edge of edges) {
            // Check if edge condition is met
            if (edge.condition) {
                const conditionMet = await this.evaluateCondition(edge.condition, execution, nodeResult);
                if (!conditionMet) continue;
            }

            const nextNode = workflow.nodes.find(n => n.nodeId === edge.targetNodeId);
            if (nextNode) {
                nextNodes.push(nextNode);
            }
        }

        return nextNodes;
    }

    /**
     * Node Type Processors
     */

    async processTrigger(node, execution) {
        // Trigger node just marks the start
        return { triggered: true, timestamp: new Date() };
    }

    async sendTextMessage(node, execution) {
        const contact = await Contact.findByPk(execution.contactId);
        const message = this.replaceVariables(node.config.text, execution.executionData, contact);

        const result = await whatsapp.sendMessage(
            contact.phoneNumber,
            { text: message }
        );

        return { messageSent: true, messageId: result.messageId };
    }

    async sendInteractiveList(node, execution) {
        const contact = await Contact.findByPk(execution.contactId);
        const config = node.config;

        const result = await whatsapp.sendInteractiveMessage(
            contact.phoneNumber,
            {
                type: 'list',
                header: config.header,
                body: this.replaceVariables(config.body, execution.executionData, contact),
                footer: config.footer,
                button: config.buttonText || 'Choose',
                sections: config.sections
            }
        );

        return { messageSent: true, messageId: result.messageId, type: 'list' };
    }

    async sendInteractiveButtons(node, execution) {
        const contact = await Contact.findByPk(execution.contactId);
        const config = node.config;

        const result = await whatsapp.sendInteractiveMessage(
            contact.phoneNumber,
            {
                type: 'button',
                body: this.replaceVariables(config.body, execution.executionData, contact),
                footer: config.footer,
                buttons: config.buttons
            }
        );

        return { messageSent: true, messageId: result.messageId, type: 'buttons' };
    }

    async processDelay(node, execution) {
        const delayMs = (node.config.seconds || 1) * 1000;
        await new Promise(resolve => setTimeout(resolve, delayMs));
        return { delayed: delayMs };
    }

    async processCondition(node, execution) {
        const condition = node.config.condition;
        const result = await this.evaluateCondition(condition, execution);
        return { conditionResult: result };
    }

    async waitForReply(node, execution) {
        // Mark execution as waiting for reply
        await execution.update({
            status: 'waiting_for_reply',
            executionData: {
                ...execution.executionData,
                waitingFor: node.config.timeout || 3600 // 1 hour default
            }
        });
        return { waiting: true };
    }

    async assignAgent(node, execution) {
        // TODO: Implement agent assignment logic
        // This would integrate with the team/agent system
        const { agentId, teamId } = node.config;
        return { assigned: true, agentId, teamId };
    }

    async addTag(node, execution) {
        const contact = await Contact.findByPk(execution.contactId);
        // TODO: Implement tag system
        const tag = node.config.tag;
        return { tagAdded: tag };
    }

    async updateField(node, execution) {
        const contact = await Contact.findByPk(execution.contactId);
        const { field, value } = node.config;
        // TODO: Implement custom fields
        return { fieldUpdated: field, value };
    }

    /**
     * Resume execution after receiving user reply
     */
    async resumeWithReply(execution, message) {
        // Reload workflow
        const workflow = await Workflow.findByPk(execution.workflowId, {
            include: [
                { model: WorkflowNode, as: 'nodes' },
                { model: WorkflowEdge, as: 'edges' }
            ]
        });

        const currentNode = workflow.nodes.find(n => n.nodeId === execution.currentNodeId);

        // Store user response in execution data
        const updatedData = {
            ...execution.executionData,
            userReply: message.text || message.interactive,
            lastReplyTimestamp: new Date()
        };
        await execution.update({
            status: 'running',
            executionData: updatedData
        });

        // Log user reply
        await WorkflowExecutionLog.create({
            executionId: execution.id,
            nodeId: currentNode.nodeId,
            actionType: 'user_reply',
            inputData: { message },
            status: 'success'
        });

        // Get next nodes and continue
        const nextNodes = await this.getNextNodes(currentNode, workflow, { userReply: message }, execution);

        for (const nextNode of nextNodes) {
            await this.processNode(nextNode, workflow, execution);
        }
    }

    /**
     * Helper methods
     */

    replaceVariables(text, executionData, contact) {
        if (!text) return '';

        let result = text;
        // Replace contact variables
        result = result.replace(/{{contact\.name}}/g, contact.name || '');
        result = result.replace(/{{contact\.phone}}/g, contact.phoneNumber || '');

        // Replace execution data variables
        Object.keys(executionData).forEach(key => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            result = result.replace(regex, executionData[key] || '');
        });

        return result;
    }

    async evaluateCondition(condition, execution, nodeResult = {}) {
        // Simple condition evaluation
        const { field, operator, value } = condition;

        let actualValue;
        if (field.startsWith('contact.')) {
            const contact = await Contact.findByPk(execution.contactId);
            const contactField = field.replace('contact.', '');
            actualValue = contact[contactField];
        } else if (field.startsWith('data.')) {
            const dataField = field.replace('data.', '');
            actualValue = execution.executionData[dataField];
        } else if (nodeResult[field] !== undefined) {
            actualValue = nodeResult[field];
        }

        switch (operator) {
            case 'equals': return actualValue == value;
            case 'not_equals': return actualValue != value;
            case 'contains': return String(actualValue).includes(value);
            case 'gte': return actualValue >= value;
            case 'lte': return actualValue <= value;
            case 'gt': return actualValue > value;
            case 'lt': return actualValue < value;
            default: return false;
        }
    }

    async completeExecution(execution, status, errorMessage = null) {
        await execution.update({
            status,
            errorMessage,
            completedAt: new Date()
        });

        // Update workflow stats
        const workflow = await Workflow.findByPk(execution.workflowId);
        if (status === 'completed') {
            await workflow.increment('successCount');
        } else if (status === 'failed') {
            await workflow.increment('failureCount');
        }
    }
}

module.exports = new WorkflowExecutor();
