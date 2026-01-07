const express = require('express');
const router = express.Router();
const multer = require('multer');
const csv = require('csv-parse');
const { productRepository, applicationRepository, personRepository, userRepository } = require('../../db/repositories');
const { authenticate, requirePermission } = require('../../middleware');
const { Person } = require('../../db/models/sequelize');

// Configure multer for CSV uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
            cb(null, true);
        } else {
            cb(new Error('Only CSV files are allowed'));
        }
    }
});

// All routes require authentication
router.use(authenticate);

// ============================================
// CAMPAIGN PRODUCTS
// ============================================

// GET /api/products - List all products
router.get('/', requirePermission('products:read'), async (req, res) => {
    try {
        const { includeWorkflow, isActive } = req.query;
        const products = await productRepository.findAll({
            includeWorkflow: includeWorkflow === 'true',
            isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        });
        res.json({ success: true, data: products });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/products/:id - Get product with workflow
router.get('/:id', requirePermission('products:read'), async (req, res) => {
    try {
        const product = await productRepository.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, error: 'Product not found' });
        }
        res.json({ success: true, data: product });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/products - Create product
router.post('/', requirePermission('products:write'), async (req, res) => {
    try {
        const product = await productRepository.create(req.body, req.user.id);
        res.status(201).json({ success: true, data: product });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT /api/products/:id - Update product
router.put('/:id', requirePermission('products:write'), async (req, res) => {
    try {
        const product = await productRepository.update(req.params.id, req.body);
        if (!product) {
            return res.status(404).json({ success: false, error: 'Product not found' });
        }
        res.json({ success: true, data: product });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// DELETE /api/products/:id - Delete product
router.delete('/:id', requirePermission('products:delete'), async (req, res) => {
    try {
        const deleted = await productRepository.delete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ success: false, error: 'Product not found' });
        }
        res.json({ success: true, message: 'Product deleted' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// WORKFLOW STEPS
// ============================================

// GET /api/products/:id/workflow - Get workflow with steps
router.get('/:id/workflow', requirePermission('products:read'), async (req, res) => {
    try {
        const product = await productRepository.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, error: 'Product not found' });
        }
        res.json({ success: true, data: product.workflow });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/products/:id/workflow/steps - Add step
router.post('/:productId/workflow/steps', requirePermission('products:write'), async (req, res) => {
    try {
        const product = await productRepository.findById(req.params.productId);
        if (!product || !product.workflow) {
            return res.status(404).json({ success: false, error: 'Product or workflow not found' });
        }

        const step = await productRepository.addStep(product.workflow.id, req.body);
        res.status(201).json({ success: true, data: step });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT /api/workflow-steps/:id - Update step
router.put('/workflow-steps/:id', requirePermission('products:write'), async (req, res) => {
    try {
        const step = await productRepository.updateStep(req.params.id, req.body);
        if (!step) {
            return res.status(404).json({ success: false, error: 'Step not found' });
        }
        res.json({ success: true, data: step });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// DELETE /api/workflow-steps/:id - Delete step
router.delete('/workflow-steps/:id', requirePermission('products:write'), async (req, res) => {
    try {
        const deleted = await productRepository.deleteStep(req.params.id);
        if (!deleted) {
            return res.status(404).json({ success: false, error: 'Step not found' });
        }
        res.json({ success: true, message: 'Step deleted' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT /api/products/:id/workflow/reorder - Reorder steps
router.put('/:productId/workflow/reorder', requirePermission('products:write'), async (req, res) => {
    try {
        const product = await productRepository.findById(req.params.productId);
        if (!product || !product.workflow) {
            return res.status(404).json({ success: false, error: 'Product or workflow not found' });
        }

        const workflow = await productRepository.reorderSteps(product.workflow.id, req.body.stepOrder);
        res.json({ success: true, data: workflow });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// APPLICATIONS
// ============================================

// GET /api/products/:id/applications - List applications for a product
router.get('/:productId/applications', requirePermission('applications:read'), async (req, res) => {
    try {
        const { page, limit, status, personId } = req.query;
        const result = await applicationRepository.findAll({
            productId: req.params.productId,
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

// POST /api/products/:id/applications - Create single application
router.post('/:productId/applications', requirePermission('applications:write'), async (req, res) => {
    try {
        const { personId, initialData, priority, assignedTo } = req.body;

        // Verify person exists
        const person = await Person.findByPk(personId);
        if (!person) {
            return res.status(400).json({ success: false, error: 'Person not found' });
        }

        const application = await applicationRepository.create(
            req.params.productId,
            personId,
            { initialData, priority, assignedTo },
            req.user.id
        );

        res.status(201).json({ success: true, data: application });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/products/:id/applications/import - Bulk import from CSV
router.post('/:productId/applications/import',
    requirePermission('applications:import'),
    upload.single('file'),
    async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ success: false, error: 'No file uploaded' });
            }

            const { fieldMapping, createPersons = false } = req.body;
            const mapping = typeof fieldMapping === 'string' ? JSON.parse(fieldMapping) : fieldMapping;

            // Parse CSV
            const records = [];
            const parser = csv.parse(req.file.buffer.toString(), {
                columns: true,
                skip_empty_lines: true,
                trim: true,
            });

            for await (const record of parser) {
                records.push(record);
            }

            const persons = [];
            const errors = [];

            for (let i = 0; i < records.length; i++) {
                const record = records[i];
                const row = i + 2; // Account for header row

                try {
                    // Map fields
                    const personData = {
                        name: record[mapping.name] || record.name,
                        phone: record[mapping.phone] || record.phone,
                        email: record[mapping.email] || record.email,
                    };

                    // Validate required fields
                    if (!personData.phone) {
                        errors.push({ row, error: 'Phone is required' });
                        continue;
                    }

                    // Find or create person
                    let person = await Person.findOne({ where: { phone: personData.phone } });

                    if (!person && createPersons) {
                        person = await Person.create({
                            ...personData,
                            name: personData.name || 'Unknown',
                        });
                    } else if (!person) {
                        errors.push({ row, error: `Person with phone ${personData.phone} not found` });
                        continue;
                    }

                    // Collect initial data from remaining fields
                    const initialData = {};
                    Object.keys(record).forEach(key => {
                        if (!['name', 'phone', 'email'].includes(key) &&
                            !Object.values(mapping || {}).includes(key)) {
                            initialData[key] = record[key];
                        }
                    });

                    persons.push({
                        personId: person.id,
                        initialData,
                        priority: parseInt(record.priority) || 0,
                    });
                } catch (err) {
                    errors.push({ row, error: err.message });
                }
            }

            // Bulk create applications
            let created = 0;
            if (persons.length > 0) {
                created = await applicationRepository.bulkCreate(
                    req.params.productId,
                    persons,
                    req.user.id
                );
            }

            res.json({
                success: true,
                data: {
                    imported: created,
                    errors: errors.length,
                    errorDetails: errors.slice(0, 10), // Limit error details
                }
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
);

module.exports = router;
