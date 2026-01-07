const { Op } = require('sequelize');
const {
    Application,
    StepExecution,
    CampaignProduct,
    ProductWorkflow,
    WorkflowStep,
    Person,
    User,
    Group
} = require('../models/sequelize');

class ApplicationRepository {
    async findAll(options = {}) {
        const { productId, status, personId, page = 1, limit = 50 } = options;

        const where = {};
        if (productId) where.productId = productId;
        if (status) where.status = status;
        if (personId) where.personId = personId;

        const offset = (page - 1) * limit;

        const { rows, count } = await Application.findAndCountAll({
            where,
            include: [
                { model: Person, as: 'person', attributes: ['id', 'firstName', 'lastName', 'phoneCountryCode', 'phoneNumber', 'email'] },
                { model: CampaignProduct, as: 'product', attributes: ['id', 'name'] },
                { model: WorkflowStep, as: 'currentStep', attributes: ['id', 'name', 'order', 'type'] },
                { model: User, as: 'creator', attributes: ['id', 'name'] },
            ],
            order: [['priority', 'DESC'], ['createdAt', 'DESC']],
            limit,
            offset,
        });

        return { data: rows, total: count, page, limit };
    }

    async findById(id) {
        return Application.findByPk(id, {
            include: [
                { model: Person, as: 'person' },
                { model: CampaignProduct, as: 'product', include: [{ model: ProductWorkflow, as: 'workflow', include: [{ model: WorkflowStep, as: 'steps' }] }] },
                { model: WorkflowStep, as: 'currentStep' },
                { model: User, as: 'creator', attributes: ['id', 'name'] },
                {
                    model: StepExecution,
                    as: 'stepExecutions',
                    include: [
                        { model: WorkflowStep, as: 'step', attributes: ['id', 'name', 'order', 'type'] },
                        { model: User, as: 'agent', attributes: ['id', 'name'] }
                    ],
                    order: [['createdAt', 'ASC']]
                },
            ],
        });
    }

    async create(productId, personId, data, userId) {
        // Get product's workflow and first step
        const product = await CampaignProduct.findByPk(productId, {
            include: [{
                model: ProductWorkflow,
                as: 'workflow',
                include: [{ model: WorkflowStep, as: 'steps', order: [['order', 'ASC']] }]
            }]
        });

        if (!product || !product.workflow) throw new Error('Product or workflow not found');

        const firstStep = product.workflow.steps?.[0];

        const application = await Application.create({
            productId,
            personId,
            status: 'pending',
            currentStepId: firstStep?.id || null,
            initialData: data.initialData || {},
            priority: data.priority || 0,
            createdBy: userId,
        });

        // Create first step execution if step exists
        if (firstStep) {
            await StepExecution.create({
                applicationId: application.id,
                stepId: firstStep.id,
                status: data.assignedTo ? 'in_progress' : 'pending',
                assignedTo: data.assignedTo || null,
                startedAt: data.assignedTo ? new Date() : null,
                formData: {},
            });

            if (data.assignedTo) {
                await application.update({ status: 'in_progress' });
            }
        }

        return this.findById(application.id);
    }

    async bulkCreate(productId, persons, userId) {
        // persons is array of { personId, initialData }
        const product = await CampaignProduct.findByPk(productId, {
            include: [{
                model: ProductWorkflow,
                as: 'workflow',
                include: [{ model: WorkflowStep, as: 'steps', order: [['order', 'ASC']] }]
            }]
        });

        if (!product || !product.workflow) throw new Error('Product or workflow not found');

        const firstStep = product.workflow.steps?.[0];

        const applications = await Application.bulkCreate(
            persons.map(p => ({
                productId,
                personId: p.personId,
                status: 'pending',
                currentStepId: firstStep?.id || null,
                initialData: p.initialData || {},
                priority: p.priority || 0,
                createdBy: userId,
            }))
        );

        // Create step executions for first step
        if (firstStep) {
            await StepExecution.bulkCreate(
                applications.map(app => ({
                    applicationId: app.id,
                    stepId: firstStep.id,
                    status: 'pending',
                    formData: {},
                }))
            );
        }

        return applications.length;
    }

    async updateStatus(id, status) {
        const app = await Application.findByPk(id);
        if (!app) return null;
        await app.update({ status });
        return this.findById(id);
    }

    // Workqueue methods
    async getWorkqueue(userId, groupIds) {
        // Get pending applications where current step is assigned to user's groups
        const executions = await StepExecution.findAll({
            where: {
                status: { [Op.in]: ['pending', 'in_progress'] },
                [Op.or]: [
                    { assignedTo: userId },
                    { assignedTo: null }
                ]
            },
            include: [
                {
                    model: Application,
                    as: 'application',
                    include: [
                        { model: Person, as: 'person', attributes: ['id', 'firstName', 'lastName', 'phoneCountryCode', 'phoneNumber'] },
                        { model: CampaignProduct, as: 'product', attributes: ['id', 'name'] },
                        {
                            model: StepExecution,
                            as: 'stepExecutions',
                            where: { status: 'completed' },
                            required: false,
                            include: [{ model: WorkflowStep, as: 'step', attributes: ['id', 'name'] }]
                        }
                    ]
                },
                {
                    model: WorkflowStep,
                    as: 'step',
                    where: { assignedGroupId: { [Op.in]: groupIds } },
                    attributes: ['id', 'name', 'order', 'type', 'formSchema', 'assignedGroupId'],
                    include: [{ model: Group, as: 'assignedGroup', attributes: ['id', 'name'] }]
                }
            ],
            order: [
                [{ model: Application, as: 'application' }, 'priority', 'DESC'],
                ['createdAt', 'ASC']
            ],
            limit: 50
        });

        return executions;
    }

    async getNextWorkItem(userId, groupIds) {
        // Get the next unassigned pending item for user's groups
        const execution = await StepExecution.findOne({
            where: {
                status: 'pending',
                assignedTo: null,
            },
            include: [
                {
                    model: Application,
                    as: 'application',
                    where: { status: { [Op.in]: ['pending', 'in_progress'] } },
                    include: [
                        { model: Person, as: 'person' },
                        { model: CampaignProduct, as: 'product' },
                    ]
                },
                {
                    model: WorkflowStep,
                    as: 'step',
                    where: { assignedGroupId: { [Op.in]: groupIds } },
                }
            ],
            order: [
                [{ model: Application, as: 'application' }, 'priority', 'DESC'],
                ['createdAt', 'ASC']
            ],
        });

        return execution;
    }

    async claimApplication(executionId, userId) {
        const execution = await StepExecution.findByPk(executionId);
        if (!execution) return null;
        if (execution.assignedTo && execution.assignedTo !== userId) {
            throw new Error('Already assigned to another agent');
        }

        await execution.update({
            assignedTo: userId,
            status: 'in_progress',
            startedAt: new Date(),
        });

        // Update application status
        await Application.update(
            { status: 'in_progress' },
            { where: { id: execution.applicationId, status: 'pending' } }
        );

        return execution;
    }

    async releaseApplication(executionId, userId) {
        const execution = await StepExecution.findByPk(executionId);
        if (!execution || execution.assignedTo !== userId) return null;

        await execution.update({
            assignedTo: null,
            status: 'pending',
            startedAt: null,
        });

        return execution;
    }

    async reassignExecution(executionId, userId) {
        const execution = await StepExecution.findByPk(executionId);
        if (!execution) throw new Error('Execution not found');

        await execution.update({
            assignedTo: userId,
            status: 'in_progress',
            startedAt: new Date(),
        });

        // Ensure application status is updated
        await Application.update(
            { status: 'in_progress' },
            { where: { id: execution.applicationId, status: 'pending' } }
        );

        return execution;
    }

    async submitStep(executionId, formData, userId, notes = null) {
        const execution = await StepExecution.findByPk(executionId, {
            include: [
                { model: Application, as: 'application' },
                { model: WorkflowStep, as: 'step', include: [{ model: ProductWorkflow, as: 'workflow', include: [{ model: WorkflowStep, as: 'steps' }] }] }
            ]
        });

        if (!execution) throw new Error('Execution not found');

        // Complete current step
        await execution.update({
            status: 'completed',
            formData,
            notes,
            completedAt: new Date(),
            completedBy: userId,
        });

        // Find next step
        const currentOrder = execution.step.order;
        const allSteps = execution.step.workflow.steps.sort((a, b) => a.order - b.order);
        const nextStep = allSteps.find(s => s.order > currentOrder && s.isActive);

        if (nextStep) {
            // Check conditions for next step
            const shouldExecute = await this.evaluateConditions(nextStep.conditions, execution.applicationId);

            if (shouldExecute) {
                // Move to next step
                await Application.update(
                    { currentStepId: nextStep.id },
                    { where: { id: execution.applicationId } }
                );

                // Create next step execution
                await StepExecution.create({
                    applicationId: execution.applicationId,
                    stepId: nextStep.id,
                    status: 'pending',
                    formData: {},
                });
            } else {
                // Skip to next step that passes conditions
                const remainingSteps = allSteps.filter(s => s.order > nextStep.order && s.isActive);
                let found = false;

                for (const step of remainingSteps) {
                    const passes = await this.evaluateConditions(step.conditions, execution.applicationId);
                    if (passes) {
                        await Application.update(
                            { currentStepId: step.id },
                            { where: { id: execution.applicationId } }
                        );
                        await StepExecution.create({
                            applicationId: execution.applicationId,
                            stepId: step.id,
                            status: 'pending',
                            formData: {},
                        });
                        found = true;
                        break;
                    } else {
                        // Mark as skipped
                        await StepExecution.create({
                            applicationId: execution.applicationId,
                            stepId: step.id,
                            status: 'skipped',
                            formData: {},
                            completedAt: new Date(),
                        });
                    }
                }

                if (!found) {
                    // No more steps, complete application
                    await Application.update(
                        { status: 'completed', currentStepId: null },
                        { where: { id: execution.applicationId } }
                    );
                }
            }
        } else {
            // No next step, complete application
            await Application.update(
                { status: 'completed', currentStepId: null },
                { where: { id: execution.applicationId } }
            );
        }

        return this.findById(execution.applicationId);
    }

    async rejectStep(executionId, reason, userId) {
        const execution = await StepExecution.findByPk(executionId);
        if (!execution) throw new Error('Execution not found');

        await execution.update({
            status: 'rejected',
            formData: { rejectionReason: reason },
            notes: reason,
            completedAt: new Date(),
            completedBy: userId,
        });

        // Reject application
        await Application.update(
            { status: 'rejected' },
            { where: { id: execution.applicationId } }
        );

        return this.findById(execution.applicationId);
    }

    async evaluateConditions(conditions, applicationId) {
        if (!conditions) return true;

        // Get all step executions for this application
        const executions = await StepExecution.findAll({
            where: { applicationId, status: 'completed' },
            include: [{ model: WorkflowStep, as: 'step' }]
        });

        const executionsByStepId = {};
        executions.forEach(e => {
            executionsByStepId[e.stepId] = e;
        });

        return this.evaluateConditionGroup(conditions, executionsByStepId);
    }

    evaluateConditionGroup(group, executionsByStepId) {
        if (!group || !group.conditions) return true;

        const results = group.conditions.map(condition => {
            if (condition.type === 'AND' || condition.type === 'OR') {
                return this.evaluateConditionGroup(condition, executionsByStepId);
            }

            const execution = executionsByStepId[condition.stepId];
            if (!execution) return false;

            const fieldValue = execution.formData?.[condition.field];
            return this.evaluateCondition(fieldValue, condition.operator, condition.value);
        });

        if (group.type === 'AND') {
            return results.every(r => r);
        } else if (group.type === 'OR') {
            return results.some(r => r);
        }

        return results[0] ?? true;
    }

    evaluateCondition(fieldValue, operator, value) {
        switch (operator) {
            case 'equals':
                return fieldValue === value;
            case 'not_equals':
                return fieldValue !== value;
            case 'in':
                return Array.isArray(value) && value.includes(fieldValue);
            case 'not_in':
                return Array.isArray(value) && !value.includes(fieldValue);
            case 'greater_than':
                return Number(fieldValue) > Number(value);
            case 'less_than':
                return Number(fieldValue) < Number(value);
            case 'contains':
                return String(fieldValue).includes(String(value));
            case 'is_empty':
                return !fieldValue || fieldValue === '';
            case 'is_not_empty':
                return fieldValue && fieldValue !== '';
            default:
                return true;
        }
    }
}

module.exports = new ApplicationRepository();
