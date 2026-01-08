/**
 * GraphAPI Error Response Formatter
 * Matches Meta's official error response format from OpenAPI spec
 */

const { v4: uuidv4 } = require('uuid');

/**
 * Create a GraphAPI-compliant error response
 * @param {object} options - Error options
 * @returns {object} - Formatted error response
 */
function createGraphAPIError({
    message,
    type = 'OAuthException',
    code = 100,
    errorSubcode = null,
    isTransient = false,
    errorUserTitle = null,
    errorUserMsg = null,
    errorData = null
}) {
    const fbtraceId = generateFbtraceId();

    const error = {
        message,
        type,
        code,
        fbtrace_id: fbtraceId
    };

    if (errorSubcode !== null) {
        error.error_subcode = errorSubcode;
    }

    if (isTransient) {
        error.is_transient = true;
    }

    if (errorUserTitle) {
        error.error_user_title = errorUserTitle;
    }

    if (errorUserMsg) {
        error.error_user_msg = errorUserMsg;
    }

    if (errorData) {
        error.error_data = errorData;
    }

    return { error };
}

/**
 * Generate fbtrace_id for error tracking
 * @returns {string}
 */
function generateFbtraceId() {
    // Format similar to Meta's: AXsgnV2Cm3ZMGF3dF_cfYIn
    const uuid = uuidv4().replace(/-/g, '');
    return `AX${uuid.substring(0, 22)}`;
}

/**
 * Common WhatsApp API error codes
 */
const ErrorCodes = {
    // Authentication & Authorization
    INVALID_PARAMETER: { code: 100, type: 'OAuthException' },
    INVALID_ACCESS_TOKEN: { code: 190, type: 'OAuthException' },
    PERMISSION_DENIED: { code: 200, type: 'OAuthException' },

    // Rate Limiting
    RATE_LIMIT_EXCEEDED: { code: 4, subcode: 2390008, type: 'OAuthException', isTransient: true },

    // WhatsApp Business API
    INVALID_PHONE_NUMBER: { code: 100, subcode: 33, type: 'OAuthException' },
    MESSAGE_UNDELIVERABLE: { code: 131051, type: 'OAuthException' },
    TEMPLATE_NOT_FOUND: { code: 132000, type: 'OAuthException' },
    TEMPLATE_PAUSED: { code: 132001, type: 'OAuthException' },
    TEMPLATE_DISABLED: { code: 132005, type: 'OAuthException' },
    ACCOUNT_RESTRICTED: { code: 131031, type: 'OAuthException' },

    // Webhook
    INVALID_WEBHOOK_PAYLOAD: { code: 100, subcode: 2388001, type: 'OAuthException' },
    WEBHOOK_VERIFICATION_FAILED: { code: 100, subcode: 2388002, type: 'OAuthException' },

    // Call Permissions
    CALL_PERMISSION_DENIED: { code: 138006, type: 'OAuthException' },

    // Server Errors
    INTERNAL_ERROR: { code: 1, type: 'OAuthException', isTransient: true },
    SERVICE_UNAVAILABLE: { code: 2, type: 'OAuthException', isTransient: true }
};

/**
 * Create error response for invalid parameter
 */
function invalidParameterError(paramName, details = null) {
    return createGraphAPIError({
        message: `Invalid parameter: ${paramName}`,
        ...ErrorCodes.INVALID_PARAMETER,
        errorUserTitle: 'Invalid Request',
        errorUserMsg: `The parameter '${paramName}' is invalid or missing.`,
        errorData: details
    });
}

/**
 * Create error response for authentication failure
 */
function authenticationError(message = 'Invalid or expired access token') {
    return createGraphAPIError({
        message,
        ...ErrorCodes.INVALID_ACCESS_TOKEN,
        errorUserTitle: 'Authentication Failed',
        errorUserMsg: 'Your session has expired. Please log in again.'
    });
}

/**
 * Create error response for rate limiting
 */
function rateLimitError() {
    return createGraphAPIError({
        message: 'Rate limit exceeded',
        ...ErrorCodes.RATE_LIMIT_EXCEEDED,
        errorUserTitle: 'Too Many Requests',
        errorUserMsg: 'You have exceeded the rate limit. Please try again later.'
    });
}

/**
 * Create error response for webhook validation
 */
function webhookValidationError(details) {
    return createGraphAPIError({
        message: 'Webhook payload validation failed',
        ...ErrorCodes.INVALID_WEBHOOK_PAYLOAD,
        errorUserTitle: 'Invalid Webhook Payload',
        errorUserMsg: 'The webhook payload does not match the expected format.',
        errorData: { details }
    });
}

/**
 * Create error response for internal server error
 */
function internalServerError(message = 'An internal error occurred') {
    return createGraphAPIError({
        message,
        ...ErrorCodes.INTERNAL_ERROR,
        errorUserTitle: 'Server Error',
        errorUserMsg: 'An unexpected error occurred. Please try again.'
    });
}

/**
 * Express error handler middleware
 */
function graphAPIErrorHandler(err, req, res, next) {
    console.error('Error:', err);

    // If error already formatted, use it
    if (err.error && err.error.fbtrace_id) {
        return res.status(getHttpStatusFromErrorCode(err.error.code)).json(err);
    }

    // Otherwise create formatted error
    const formattedError = internalServerError(err.message || 'Internal server error');
    res.status(500).json(formattedError);
}

/**
 * Map GraphAPI error code to HTTP status
 */
function getHttpStatusFromErrorCode(code) {
    const mapping = {
        1: 500,    // Internal error
        2: 503,    // Service unavailable
        4: 429,    // Rate limit
        100: 400,  // Invalid parameter
        190: 401,  // Invalid token
        200: 403,  // Permission denied
        131031: 403, // Account restricted
        131051: 400, // Message undeliverable
        132000: 404, // Template not found
        132001: 400, // Template paused
        132005: 400, // Template disabled
        138006: 403  // Call permission denied
    };
    return mapping[code] || 400;
}

module.exports = {
    createGraphAPIError,
    generateFbtraceId,
    ErrorCodes,
    invalidParameterError,
    authenticationError,
    rateLimitError,
    webhookValidationError,
    internalServerError,
    graphAPIErrorHandler,
    getHttpStatusFromErrorCode
};
