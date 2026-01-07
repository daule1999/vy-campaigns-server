const { authenticate, authorize, optionalAuth, requirePermission, requireSuperAdmin } = require('./auth');
const { auditLog, createAuditLog } = require('./audit');
const { validate } = require('./validate');
const { sanitizeInput, stripHtml, containsScript } = require('./sanitize');

module.exports = {
    authenticate,
    authorize,
    optionalAuth,
    requirePermission,
    requireSuperAdmin,
    auditLog,
    createAuditLog,
    validate,
    sanitizeInput,
    stripHtml,
    containsScript
};
