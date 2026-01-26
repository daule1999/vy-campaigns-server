/**
 * Team Management Routes
 */

const express = require('express');
const router = express.Router();
const { Team, TeamMember, User, Role } = require('../../db/models/sequelize');
const { authenticate } = require('../../middleware/auth');
const { hasPermission, hasAnyPermission } = require('../../middleware/rbac');

/**
 * GET /api/teams
 * List all teams
 */
router.get('/', authenticate, hasPermission('team.view'), async (req, res) => {
    try {
        const teams = await Team.findAll({
            include: [
                {
                    model: User,
                    as: 'members',
                    attributes: ['id', 'name', 'email'],
                    through: {
                        attributes: ['isLead']
                    },
                    include: [{
                        model: Role,
                        as: 'roles',
                        attributes: ['name', 'displayName'],
                        through: { attributes: [] }
                    }]
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        // Add member count to each team
        const teamsWithCount = teams.map(team => ({
            ...team.toJSON(),
            memberCount: team.members?.length || 0
        }));

        res.json({
            success: true,
            data: teamsWithCount
        });
    } catch (error) {
        console.error('Error fetching teams:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching teams'
        });
    }
});

/**
 * GET /api/teams/:id
 * Get team by ID
 */
router.get('/:id', authenticate, hasPermission('team.view'), async (req, res) => {
    try {
        const team = await Team.findByPk(req.params.id, {
            include: [
                {
                    model: User,
                    as: 'creator',
                    attributes: ['id', 'name', 'email']
                },
                {
                    model: User,
                    as: 'members',
                    attributes: ['id', 'name', 'email', 'phoneNumber', 'status'],
                    through: {
                        attributes: ['isLead', 'createdAt']
                    },
                    include: [{
                        model: Role,
                        as: 'roles',
                        attributes: ['id', 'name', 'displayName'],
                        through: { attributes: [] }
                    }]
                }
            ]
        });

        if (!team) {
            return res.status(404).json({
                success: false,
                message: 'Team not found'
            });
        }

        // Separate leads and members
        const leads = team.members.filter(m => m.TeamMember.isLead);
        const regularMembers = team.members.filter(m => !m.TeamMember.isLead);

        res.json({
            success: true,
            data: {
                ...team.toJSON(),
                leads,
                members: regularMembers
            }
        });
    } catch (error) {
        console.error('Error fetching team:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching team'
        });
    }
});

/**
 * POST /api/teams
 * Create a new team
 */
router.post('/', authenticate, hasPermission('team.create'), async (req, res) => {
    try {
        const { name, description } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Team name is required'
            });
        }

        const team = await Team.create({
            name,
            description,
            createdBy: req.user.id
        });

        res.status(201).json({
            success: true,
            message: 'Team created successfully',
            data: team
        });
    } catch (error) {
        console.error('Error creating team:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating team'
        });
    }
});

/**
 * PUT /api/teams/:id
 * Update team
 */
router.put('/:id', authenticate, hasPermission('team.update'), async (req, res) => {
    try {
        const { name, description } = req.body;

        const team = await Team.findByPk(req.params.id);
        if (!team) {
            return res.status(404).json({
                success: false,
                message: 'Team not found'
            });
        }

        await team.update({
            name: name || team.name,
            description: description !== undefined ? description : team.description
        });

        res.json({
            success: true,
            message: 'Team updated successfully',
            data: team
        });
    } catch (error) {
        console.error('Error updating team:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating team'
        });
    }
});

/**
 * DELETE /api/teams/:id
 * Delete team
 */
router.delete('/:id', authenticate, hasPermission('team.delete'), async (req, res) => {
    try {
        const team = await Team.findByPk(req.params.id);
        if (!team) {
            return res.status(404).json({
                success: false,
                message: 'Team not found'
            });
        }

        await team.destroy();

        res.json({
            success: true,
            message: 'Team deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting team:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting team'
        });
    }
});

/**
 * POST /api/teams/:id/members
 * Add member to team
 */
router.post('/:id/members', authenticate, hasPermission('team.update'), async (req, res) => {
    try {
        const { userId, isLead } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'userId is required'
            });
        }

        const team = await Team.findByPk(req.params.id);
        if (!team) {
            return res.status(404).json({
                success: false,
                message: 'Team not found'
            });
        }

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if user is already a member
        const existingMember = await TeamMember.findOne({
            where: { teamId: team.id, userId }
        });

        if (existingMember) {
            return res.status(400).json({
                success: false,
                message: 'User is already a member of this team'
            });
        }

        await TeamMember.create({
            teamId: team.id,
            userId,
            isLead: isLead || false
        });

        res.json({
            success: true,
            message: `User added to team as ${isLead ? 'lead' : 'member'}`
        });
    } catch (error) {
        console.error('Error adding team member:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding team member'
        });
    }
});

/**
 * PUT /api/teams/:teamId/members/:userId
 * Update team member (make lead or member)
 */
router.put('/:teamId/members/:userId', authenticate, hasPermission('team.update'), async (req, res) => {
    try {
        const { teamId, userId } = req.params;
        const { isLead } = req.body;

        if (isLead === undefined) {
            return res.status(400).json({
                success: false,
                message: 'isLead is required'
            });
        }

        const teamMember = await TeamMember.findOne({
            where: { teamId, userId }
        });

        if (!teamMember) {
            return res.status(404).json({
                success: false,
                message: 'Team member not found'
            });
        }

        await teamMember.update({ isLead });

        res.json({
            success: true,
            message: `User updated to ${isLead ? 'lead' : 'member'}`
        });
    } catch (error) {
        console.error('Error updating team member:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating team member'
        });
    }
});

/**
 * DELETE /api/teams/:teamId/members/:userId
 * Remove member from team
 */
router.delete('/:teamId/members/:userId', authenticate, hasPermission('team.update'), async (req, res) => {
    try {
        const { teamId, userId } = req.params;

        const teamMember = await TeamMember.findOne({
            where: { teamId, userId }
        });

        if (!teamMember) {
            return res.status(404).json({
                success: false,
                message: 'Team member not found'
            });
        }

        await teamMember.destroy();

        res.json({
            success: true,
            message: 'Member removed from team successfully'
        });
    } catch (error) {
        console.error('Error removing team member:', error);
        res.status(500).json({
            success: false,
            message: 'Error removing team member'
        });
    }
});

/**
 * GET /api/teams/user/:userId
 * Get teams for a specific user
 */
router.get('/user/:userId', authenticate, async (req, res) => {
    try {
        const { userId } = req.params;

        // Users can only view their own teams unless they have team.view permission
        if (req.user.id !== parseInt(userId)) {
            const { getUserPermissions } = require('../middleware/rbac');
            const permissions = await getUserPermissions(req.user.id);
            if (!permissions.includes('team.view')) {
                return res.status(403).json({
                    success: false,
                    message: 'You can only view your own teams'
                });
            }
        }

        const user = await User.findByPk(userId, {
            include: [{
                model: Team,
                as: 'teams',
                through: {
                    attributes: ['isLead']
                },
                include: [{
                    model: User,
                    as: 'creator',
                    attributes: ['id', 'name', 'email']
                }]
            }]
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            data: user.teams
        });
    } catch (error) {
        console.error('Error fetching user teams:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user teams'
        });
    }
});

module.exports = router;
