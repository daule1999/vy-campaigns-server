const { CampaignProduct, ProductWorkflow, WorkflowStep, Group } = require('../models/sequelize');

class ProductRepository {
    async findAll(options = {}) {
        const { includeWorkflow = false, isActive } = options;

        const where = {};
        if (isActive !== undefined) where.isActive = isActive;

        const include = [];
        if (includeWorkflow) {
            include.push({
                model: ProductWorkflow,
                as: 'workflow',
                include: [{
                    model: WorkflowStep,
                    as: 'steps',
                    order: [['order', 'ASC']],
                    include: [{ model: Group, as: 'assignedGroup', attributes: ['id', 'name'] }]
                }]
            });
        }

        return CampaignProduct.findAll({
            where,
            include,
            order: [['createdAt', 'DESC']]
        });
    }

    async findById(id, options = {}) {
        const { includeWorkflow = true } = options;

        const include = [];
        if (includeWorkflow) {
            include.push({
                model: ProductWorkflow,
                as: 'workflow',
                include: [{
                    model: WorkflowStep,
                    as: 'steps',
                    order: [['order', 'ASC']],
                    include: [{ model: Group, as: 'assignedGroup', attributes: ['id', 'name'] }]
                }]
            });
        }

        return CampaignProduct.findByPk(id, { include });
    }

    async create(data, userId) {
        const product = await CampaignProduct.create({
            name: data.name,
            description: data.description,
            config: data.config || {},
            isActive: data.isActive !== false,
            createdBy: userId,
        });

        // Create default workflow
        const workflow = await ProductWorkflow.create({
            productId: product.id,
            name: `${data.name} Workflow`,
            description: 'Default workflow',
            isActive: true,
        });

        // Create initial step if provided
        if (data.initialStep) {
            await WorkflowStep.create({
                workflowId: workflow.id,
                order: 1,
                name: data.initialStep.name || 'Data Entry',
                type: data.initialStep.type || 'data_entry',
                formSchema: data.initialStep.formSchema || { fields: [] },
            });
        }

        return this.findById(product.id);
    }

    async update(id, data) {
        const product = await CampaignProduct.findByPk(id);
        if (!product) return null;

        await product.update({
            name: data.name ?? product.name,
            description: data.description ?? product.description,
            config: data.config ?? product.config,
            isActive: data.isActive ?? product.isActive,
        });

        return this.findById(id);
    }

    async delete(id) {
        const product = await CampaignProduct.findByPk(id);
        if (!product) return false;
        await product.destroy();
        return true;
    }

    // Workflow management
    async getWorkflow(productId) {
        return ProductWorkflow.findOne({
            where: { productId },
            include: [{
                model: WorkflowStep,
                as: 'steps',
                order: [['order', 'ASC']],
                include: [{ model: Group, as: 'assignedGroup', attributes: ['id', 'name'] }]
            }]
        });
    }

    async addStep(workflowId, stepData) {
        // Get max order
        const maxOrder = await WorkflowStep.max('order', { where: { workflowId } }) || 0;

        return WorkflowStep.create({
            workflowId,
            order: stepData.order ?? maxOrder + 1,
            name: stepData.name,
            type: stepData.type || 'data_entry',
            assignedGroupId: stepData.assignedGroupId,
            formSchema: stepData.formSchema || { fields: [] },
            conditions: stepData.conditions,
            config: stepData.config || {},
            isActive: stepData.isActive !== false,
        });
    }

    async updateStep(stepId, stepData) {
        const step = await WorkflowStep.findByPk(stepId);
        if (!step) return null;

        await step.update({
            name: stepData.name ?? step.name,
            type: stepData.type ?? step.type,
            order: stepData.order ?? step.order,
            assignedGroupId: stepData.assignedGroupId ?? step.assignedGroupId,
            formSchema: stepData.formSchema ?? step.formSchema,
            conditions: stepData.conditions ?? step.conditions,
            config: stepData.config ?? step.config,
            isActive: stepData.isActive ?? step.isActive,
        });

        return step;
    }

    async deleteStep(stepId) {
        const step = await WorkflowStep.findByPk(stepId);
        if (!step) return false;
        await step.destroy();
        return true;
    }

    async reorderSteps(workflowId, stepOrder) {
        // stepOrder is an array of step IDs in the desired order
        const updates = stepOrder.map((stepId, index) =>
            WorkflowStep.update({ order: index + 1 }, { where: { id: stepId, workflowId } })
        );
        await Promise.all(updates);
        return this.getWorkflow(workflowId);
    }
}

module.exports = new ProductRepository();
