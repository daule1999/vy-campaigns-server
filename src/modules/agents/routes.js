/**
 * Agent Management Routes
 * Handles user invitations, agent status, and role assignment
 */

const express = require('express');
const router = express.Router();
const { User, Role, UserRole, Team } = require('../../db/models/sequelize');
const { authenticate } = require('../../middleware/auth');
const { hasPermission } = require('../../middleware/rbac');
const crypto = require('crypto');

/**
 * GET /api/agents
 * List all agents with their roles and teams
 */
router.get('/', authenticate, hasPermission('agent.view'), async (req, res) => {
    try {
        const { status, role, team, search } = req.query;

        const whereClause = {};
        if (status) {
            whereClause.status = status;
        }
        if (search) {
            whereClause[Op.or] = [
                { name: { [Op.like]: `%${search}%` } },
                { email: { [Op.like]: `%${search}%` } }
            ];
        }

        const agents = await User.findAll({
            where: whereClause,
            include: [
                {
                    model: Role,
                    as: 'roles',
                    attributes: ['id', 'name', 'displayName'],
                    through: { attributes: [] }
                },
                {
                    model: Team,
                    as: 'teams',
                    attributes: ['id', 'name'],
                    through: { attributes: ['isLead'] }
                },
                {
                    model: User,
                    as: 'inviter',
                    attributes: ['id', 'name', 'email']
                }
            ],
            attributes: { exclude: ['passwordHash', 'refreshToken'] },
            order: [['createdAt', 'DESC']]
        });

        res.json({
            success: true,
            data: agents
        });
    } catch (error) {
        console.error('Error fetching agents:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching agents'
        });
    }
});

/**
 * GET /api/agents/:id
 * Get agent details by ID
 */
router.get('/:id', authenticate, hasPermission('agent.view'), async (req, res) => {
    try {
        const agent = await User.findByPk(req.params.id, {
            include: [
                {
                    model: Role,
                    as: 'roles',
                    include: [{
                        model: Permission,
                        as: 'permissions',
                        attributes: ['id', 'name', 'description', 'feature'],
                        through: { attributes: [] }
                    }],
                    through: { attributes: [] }
                },
                {
                    model: Team,
                    as: 'teams',
                    through: { attributes: ['isLead'] }
                }
            ],
            attributes: { exclude: ['passwordHash', 'refreshToken'] }
        });

        if (!agent) {
            return res.status(404).json({
                success: false,
                message: 'Agent not found'
            });
        }

        res.json({
            success: true,
            data: agent
        });
    } catch (error) {
        console.error('Error fetching agent:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching agent'
        });
    }
});

/**
 * POST /api/agents/invite
 * Invite new agent
 */
router.post('/invite', authenticate, hasPermission('agent.invite'), async (req, res) => {
    try {
        const { email, name, phoneNumber, roleIds } = req.body;

        if (!email || !name) {
            return res.status(400).json({
                success: false,
                message: 'Email and name are required'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        // Generate temporary password (should be sent via email)
        const tempPassword = crypto.randomBytes(8).toString('hex');

        // Create user with invited status
        const user = await User.create({
            email,
            name,
            phoneNumber,
            password: tempPassword, // This will be hashed by the model
            status: 'invited',
            invitedBy: req.user.id,
            invitationSentAt: new Date()
        });

        // Assign roles if provided
        if (roleIds && roleIds.length > 0) {
            const roles = await Role.findAll({ where: { id: roleIds } });
            await user.setRoles(roles);
        }

        // TODO: Send invitation email with temporary password
        // await sendInvitationEmail(user.email, user.name, tempPassword);

        res.status(201).json({
            success: true,
            message: 'Agent invited successfully',
            data: {
                id: user.id,
                email: user.email,
                name: user.name,
                tempPassword // In production, don't return this - send via email
            }
        });
    } catch (error) {
        console.error('Error inviting agent:', error);
        res.status(500).json({
            success: false,
            message: 'Error inviting agent'
        });
    }
});

/**
 * PUT /api/agents/:id
 * Update agent details
 */
router.put('/:id', authenticate, hasPermission('agent.update'), async (req, res) => {
    try {
        const { name, phoneNumber, status } = req.body;

        const agent = await User.findByPk(req.params.id);
        if (!agent) {
            return res.status(404).json({
                success: false,
                message: 'Agent not found'
            });
        }

        await agent.update({
            name: name || agent.name,
            phoneNumber: phoneNumber !== undefined ? phoneNumber : agent.phoneNumber,
            status: status || agent.status
        });

        res.json({
            success: true,
            message: 'Agent updated successfully',
            data: agent
        });
    } catch (error) {
        console.error('Error updating agent:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating agent'
        });
    }
});

/**
 * DELETE /api/agents/:id
 * Delete/deactivate agent
 */
router.delete('/:id', authenticate, hasPermission('agent.delete'), async (req, res) => {
    try {
        const agent = await User.findByPk(req.params.id);
        if (!agent) {
            return res.status(404).json({
                success: false,
                message: 'Agent not found'
            });
        }

        // Soft delete - set status to inactive instead of deleting
        await agent.update({ status: 'inactive' });

        res.json({
            success: true,
            message: 'Agent deactivated successfully'
        });
    } catch (error) {
        console.error('Error deleting agent:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting agent'
        });
    }
});

/**
 * POST /api/agents/:id/resend-invitation
 * Resend invitation email
 */
router.post('/:id/resend-invitation', authenticate, hasPermission('agent.invite'), async (req, res) => {
    try {
        const agent = await User.findByPk(req.params.id);
        if (!agent) {
            return res.status(404).json({
                success: false,
                message: 'Agent not found'
            });
        }

        if (agent.status !== 'invited') {
            return res.status(400).json({
                success: false,
                message: 'Can only resend invitation to users with invited status'
            });
        }

        // Generate new temporary password
        const tempPassword = crypto.randomBytes(8).toString('hex');
        await agent.update({
            password: tempPassword,
            invitationSentAt: new Date()
        });

        // TODO: Send invitation email
        // await sendInvitationEmail(agent.email, agent.name, tempPassword);

        res.json({
            success: true,
            message: 'Invitation resent successfully',
            tempPassword // In production, don't return this
        });
    } catch (error) {
        console.error('Error resending invitation:', error);
        res.status(500).json({
            success: false,
            message: 'Error resending invitation'
        });
    }
});

/**
 * POST /api/agents/:id/roles
 * Assign roles to agent
 */
router.post('/:id/roles', authenticate, hasPermission('agent.manage_roles'), async (req, res) => {
    try {
        const { roleIds } = req.body;

        if (!Array.isArray(roleIds)) {
            return res.status(400).json({
                success: false,
                message: 'roleIds must be an array'
            });
        }

        const agent = await User.findByPk(req.params.id);
        if (!agent) {
            return res.status(404).json({
                success: false,
                message: 'Agent not found'
            });
        }

        const roles = await Role.findAll({ where: { id: roleIds } });
        if (roles.length !== roleIds.length) {
            return res.status(400).json({
                success: false,
                message: 'One or more role IDs are invalid'
            });
        }

        await agent.setRoles(roles);

        res.json({
            success: true,
            message: 'Roles assigned successfully'
        });
    } catch (error) {
        console.error('Error assigning roles:', error);
        res.status(500).json({
            success: false,
            message: 'Error assigning roles'
        });
    }
});

module.exports = router;
