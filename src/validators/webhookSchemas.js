const Ajv = require('ajv');
const addFormats = require('ajv-formats');

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

/**
 * WhatsApp Webhook Event Schemas based on Meta OpenAPI v23.0
 */

// Base webhook structure
const webhookBaseSchema = {
    type: 'object',
    required: ['object', 'entry'],
    properties: {
        object: {
            type: 'string',
            enum: ['whatsapp_business_account']
        },
        entry: {
            type: 'array',
            items: {
                type: 'object',
                required: ['id', 'changes'],
                properties: {
                    id: { type: 'string' },
                    changes: {
                        type: 'array',
                        items: {
                            type: 'object',
                            required: ['value', 'field'],
                            properties: {
                                value: { type: 'object' },
                                field: { type: 'string' }
                            }
                        }
                    }
                }
            }
        }
    }
};

// Message webhook schema
const messageWebhookSchema = {
    ...webhookBaseSchema,
    properties: {
        ...webhookBaseSchema.properties,
        entry: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    changes: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                value: {
                                    type: 'object',
                                    properties: {
                                        messaging_product: { type: 'string', enum: ['whatsapp'] },
                                        metadata: {
                                            type: 'object',
                                            properties: {
                                                display_phone_number: { type: 'string' },
                                                phone_number_id: { type: 'string' }
                                            }
                                        },
                                        contacts: {
                                            type: 'array',
                                            items: {
                                                type: 'object',
                                                properties: {
                                                    profile: {
                                                        type: 'object',
                                                        properties: {
                                                            name: { type: 'string' }
                                                        }
                                                    },
                                                    wa_id: { type: 'string' }
                                                }
                                            }
                                        },
                                        messages: {
                                            type: 'array',
                                            items: {
                                                type: 'object',
                                                required: ['from', 'id', 'timestamp', 'type'],
                                                properties: {
                                                    from: { type: 'string' },
                                                    id: { type: 'string' },
                                                    timestamp: { type: 'string' },
                                                    type: {
                                                        type: 'string',
                                                        enum: ['text', 'image', 'video', 'audio', 'document',
                                                            'location', 'contacts', 'interactive', 'button',
                                                            'sticker', 'reaction']
                                                    },
                                                    text: {
                                                        type: 'object',
                                                        properties: {
                                                            body: { type: 'string' }
                                                        }
                                                    },
                                                    interactive: { type: 'object' },
                                                    button: { type: 'object' },
                                                    image: { type: 'object' },
                                                    video: { type: 'object' },
                                                    audio: { type: 'object' },
                                                    document: { type: 'object' },
                                                    location: { type: 'object' },
                                                    contacts: { type: 'array' },
                                                    sticker: { type: 'object' },
                                                    reaction: { type: 'object' }
                                                }
                                            }
                                        },
                                        statuses: {
                                            type: 'array',
                                            items: {
                                                type: 'object',
                                                properties: {
                                                    id: { type: 'string' },
                                                    status: {
                                                        type: 'string',
                                                        enum: ['sent', 'delivered', 'read', 'failed', 'deleted']
                                                    },
                                                    timestamp: { type: 'string' },
                                                    recipient_id: { type: 'string' },
                                                    errors: { type: 'array' }
                                                }
                                            }
                                        }
                                    }
                                },
                                field: {
                                    type: 'string',
                                    enum: ['messages', 'message_template_status_update',
                                        'account_review_update', 'phone_number_quality_update',
                                        'account_alerts']
                                }
                            }
                        }
                    }
                }
            }
        }
    }
};

// Template status update schema
const templateStatusWebhookSchema = {
    ...webhookBaseSchema,
    properties: {
        ...webhookBaseSchema.properties,
        entry: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    changes: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                value: {
                                    type: 'object',
                                    required: ['message_template_name', 'message_template_language', 'event'],
                                    properties: {
                                        message_template_name: { type: 'string' },
                                        message_template_language: { type: 'string' },
                                        event: {
                                            type: 'string',
                                            enum: ['APPROVED', 'REJECTED', 'PENDING', 'PAUSED', 'DISABLED']
                                        },
                                        reason: { type: 'string' }
                                    }
                                },
                                field: { const: 'message_template_status_update' }
                            }
                        }
                    }
                }
            }
        }
    }
};

// Compile validators
const validateWebhookBase = ajv.compile(webhookBaseSchema);
const validateMessageWebhook = ajv.compile(messageWebhookSchema);
const validateTemplateStatusWebhook = ajv.compile(templateStatusWebhookSchema);

/**
 * Validate webhook payload
 * @param {object} payload - Webhook payload
 * @returns {object} - { valid: boolean, errors: array }
 */
function validateWebhookPayload(payload) {
    // First validate base structure
    const baseValid = validateWebhookBase(payload);
    if (!baseValid) {
        return {
            valid: false,
            errors: validateWebhookBase.errors,
            errorType: 'INVALID_WEBHOOK_STRUCTURE'
        };
    }

    // Determine webhook type and validate specifically
    const field = payload.entry?.[0]?.changes?.[0]?.field;

    let validator;
    switch (field) {
        case 'messages':
            validator = validateMessageWebhook;
            break;
        case 'message_template_status_update':
            validator = validateTemplateStatusWebhook;
            break;
        default:
            // Accept other fields but don't validate structure
            return { valid: true, field };
    }

    const valid = validator(payload);
    return {
        valid,
        errors: valid ? null : validator.errors,
        field,
        errorType: valid ? null : 'INVALID_WEBHOOK_PAYLOAD'
    };
}

module.exports = {
    validateWebhookPayload,
    validateWebhookBase,
    validateMessageWebhook,
    validateTemplateStatusWebhook
};
