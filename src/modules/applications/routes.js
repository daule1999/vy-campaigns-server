const express = require('express');
const router = express.Router();
const { applicationRepository, userRepository } = require('../../db/repositories');
const { authenticate, requirePermission } = require('../../middleware');

// All routes require authentication
router.use(authenticate);

// ============================================
// APPLICATIONS CRUD
// ============================================

// GET /api/applications - List all applications
router.get('/', requirePermission('applications:read'), async (req, res) => {
    try {
        const { productId, status, personId, page, limit } = req.query;
        const result = await applicationRepository.findAll({
            productId,
            status,
            personId,
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 50,
        });
        res.json({ success: true, ...result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/applications/:id - Get application with all step data
router.get('/:id', requirePermission('applications:read'), async (req, res) => {
    try {
        const application = await applicationRepository.findById(req.params.id);
        if (!application) {
            return res.status(404).json({ success: false, error: 'Application not found' });
        }
        res.json({ success: true, data: application });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT /api/applications/:id/status - Update application status
router.put('/:id/status', requirePermission('applications:write'), async (req, res) => {
    try {
        const { status } = req.body;
        const application = await applicationRepository.updateStatus(req.params.id, status);
        if (!application) {
            return res.status(404).json({ success: false, error: 'Application not found' });
        }
        res.json({ success: true, data: application });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// WORKQUEUE
// ============================================

// GET /api/applications/workqueue - Get agent's pending work
router.get('/workqueue/list', requirePermission('workqueue:access'), async (req, res) => {
    try {
        // Get user's group IDs
        const groupIds = await userRepository.getUserGroupIds(req.user.id);

        if (groupIds.length === 0 && !req.user.isSuperAdmin) {
            return res.json({ success: true, data: [] });
        }

        const workqueue = await applicationRepository.getWorkqueue(
            req.user.id,
            req.user.isSuperAdmin ? [null] : groupIds // Superadmin sees all
        );

        res.json({ success: true, data: workqueue });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/applications/workqueue/next - Get next item to work on
router.get('/workqueue/next', requirePermission('workqueue:access'), async (req, res) => {
    try {
        const groupIds = await userRepository.getUserGroupIds(req.user.id);

        if (groupIds.length === 0 && !req.user.isSuperAdmin) {
            return res.json({ success: true, data: null });
        }

        const nextItem = await applicationRepository.getNextWorkItem(
            req.user.id,
            req.user.isSuperAdmin ? [null] : groupIds
        );

        res.json({ success: true, data: nextItem });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/applications/:id/claim - Claim application
router.post('/:id/claim', requirePermission('workqueue:claim'), async (req, res) => {
    try {
        const { executionId } = req.body;
        const execution = await applicationRepository.claimApplication(executionId, req.user.id);

        if (!execution) {
            return res.status(404).json({ success: false, error: 'Execution not found' });
        }

        res.json({ success: true, data: execution });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// POST /api/applications/:id/release - Release claimed application
router.post('/:id/release', requirePermission('workqueue:claim'), async (req, res) => {
    try {
        const { executionId } = req.body;
        const execution = await applicationRepository.releaseApplication(executionId, req.user.id);

        if (!execution) {
            return res.status(404).json({ success: false, error: 'Execution not found or not assigned to you' });
        }

        res.json({ success: true, data: execution });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

/**
 * Reassign application to another user
 * POST /api/applications/:id/reassign
 */
router.post('/:id/reassign', requirePermission('applications:write'), async (req, res) => {
    try {
        const { executionId, userId } = req.body;
        const execution = await applicationRepository.reassignExecution(executionId, userId);
        res.json({ success: true, data: execution });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// POST /api/applications/:id/steps/:stepId/submit - Submit step form
router.post('/:id/steps/:stepId/submit', requirePermission('workqueue:access'), async (req, res) => {
    try {
        const { executionId, formData, notes } = req.body;

        const application = await applicationRepository.submitStep(
            executionId,
            formData,
            req.user.id,
            notes
        );

        res.json({ success: true, data: application });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// POST /api/applications/:id/steps/:stepId/reject - Reject at step
router.post('/:id/steps/:stepId/reject', requirePermission('workqueue:access'), async (req, res) => {
    try {
        const { executionId, reason } = req.body;

        const application = await applicationRepository.rejectStep(
            executionId,
            reason,
            req.user.id
        );

        res.json({ success: true, data: application });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

module.exports = router;
