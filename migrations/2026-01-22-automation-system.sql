-- Migration: Automation System
-- Created: 2026-01-22
-- Description: Implements workflows, custom auto-replies, and inbox settings for automation

-- ============================================================
-- WORKFLOWS
-- ============================================================

-- Workflows table
CREATE TABLE IF NOT EXISTS workflows (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    trigger_type VARCHAR(100) NOT NULL,
    trigger_config JSONB NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Workflow actions
CREATE TABLE IF NOT EXISTS workflow_actions (
    id SERIAL PRIMARY KEY,
    workflow_id INTEGER REFERENCES workflows(id) ON DELETE CASCADE,
    action_type VARCHAR(100) NOT NULL,
    action_config JSONB NOT NULL,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Workflow executions (for analytics)
CREATE TABLE IF NOT EXISTS workflow_executions (
    id SERIAL PRIMARY KEY,
    workflow_id INTEGER REFERENCES workflows(id),
    contact_id INTEGER REFERENCES contacts(id),
    status VARCHAR(50),
    error_message TEXT,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- CUSTOM AUTO REPLIES
-- ============================================================

-- Custom auto replies table
CREATE TABLE IF NOT EXISTS custom_auto_replies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    trigger_keyword VARCHAR(100),
    trigger_pattern VARCHAR(500),
    reply_type VARCHAR(50),
    reply_content JSONB NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    priority INTEGER DEFAULT 0,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- INBOX SETTINGS
-- ============================================================

-- Inbox settings table
CREATE TABLE IF NOT EXISTS inbox_settings (
    id SERIAL PRIMARY KEY,
    setting_type VARCHAR(50) UNIQUE NOT NULL,
    is_enabled BOOLEAN DEFAULT FALSE,
    content JSONB NOT NULL,
    config JSONB,
    updated_by INTEGER REFERENCES users(id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- QUICK REPLIES
-- ============================================================

-- Quick replies for agents
CREATE TABLE IF NOT EXISTS quick_replies (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    shortcuts TEXT[],
    created_by INTEGER REFERENCES users(id),
    is_global BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_workflows_created_by ON workflows(created_by);
CREATE INDEX IF NOT EXISTS idx_workflows_is_active ON workflows(is_active);
CREATE INDEX IF NOT EXISTS idx_workflows_trigger_type ON workflows(trigger_type);

CREATE INDEX IF NOT EXISTS idx_workflow_actions_workflow_id ON workflow_actions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_actions_order ON workflow_actions(workflow_id, order_index);

CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow_id ON workflow_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_contact_id ON workflow_executions(contact_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON workflow_executions(status);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_executed_at ON workflow_executions(executed_at);

CREATE INDEX IF NOT EXISTS idx_custom_auto_replies_created_by ON custom_auto_replies(created_by);
CREATE INDEX IF NOT EXISTS idx_custom_auto_replies_is_active ON custom_auto_replies(is_active);
CREATE INDEX IF NOT EXISTS idx_custom_auto_replies_priority ON custom_auto_replies(priority DESC);

CREATE INDEX IF NOT EXISTS idx_quick_replies_created_by ON quick_replies(created_by);
CREATE INDEX IF NOT EXISTS idx_quick_replies_is_global ON quick_replies(is_global);

-- ============================================================
-- CHECK CONSTRAINTS
-- ============================================================

-- Ensure trigger_type is valid
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'workflows_trigger_type_check'
    ) THEN
        ALTER TABLE workflows ADD CONSTRAINT workflows_trigger_type_check 
        CHECK (trigger_type IN (
            'message_received',
            'keyword_match',
            'button_click',
            'first_message',
            'after_hours',
            'tag_added',
            'contact_created',
            'campaign_replied'
        ));
    END IF;
END $$;

-- Ensure action_type is valid
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'workflow_actions_action_type_check'
    ) THEN
        ALTER TABLE workflow_actions ADD CONSTRAINT workflow_actions_action_type_check 
        CHECK (action_type IN (
            'send_message',
            'send_template',
            'assign_to_agent',
            'assign_to_team',
            'add_tag',
            'remove_tag',
            'delay',
            'send_email',
            'webhook',
            'update_contact_field'
        ));
    END IF;
END $$;

-- Ensure workflow execution status is valid
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'workflow_executions_status_check'
    ) THEN
        ALTER TABLE workflow_executions ADD CONSTRAINT workflow_executions_status_check 
        CHECK (status IN ('completed', 'failed', 'in_progress', 'cancelled'));
    END IF;
END $$;

-- Ensure reply_type is valid
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'custom_auto_replies_reply_type_check'
    ) THEN
        ALTER TABLE custom_auto_replies ADD CONSTRAINT custom_auto_replies_reply_type_check 
        CHECK (reply_type IN ('text', 'template', 'interactive_list', 'interactive_buttons'));
    END IF;
END $$;

-- Ensure setting_type is valid
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'inbox_settings_setting_type_check'
    ) THEN
        ALTER TABLE inbox_settings ADD CONSTRAINT inbox_settings_setting_type_check 
        CHECK (setting_type IN ('welcome_message', 'ooo_message', 'delayed_message'));
    END IF;
END $$;

-- ============================================================
-- SEED DATA - INBOX SETTINGS
-- ============================================================

INSERT INTO inbox_settings (setting_type, is_enabled, content, config) VALUES
('welcome_message', false, 
 '{"text": "Hi there!\n\nThanks for reaching out to us. We are glad to have you with us and committed to delivering a superior customer experience.\n\nRegards"}', 
 '{}'),
('ooo_message', false,
 '{"text": "🌙 Thank you for contacting us! Our office is currently closed, and we are unable to respond to inquiries outside of business hours.\n\nPlease leave a message or reach us via email, and we will be sure to get back to you as soon as we are back in the office.\n\nWe appreciate your understanding!"}',
 '{"working_hours": {"monday": {"start": "10:00", "end": "18:00"}, "tuesday": {"start": "10:00", "end": "18:00"}, "wednesday": {"start": "10:00", "end": "18:00"}, "thursday": {"start": "10:00", "end": "18:00"}, "friday": {"start": "10:00", "end": "18:00"}}}'),
('delayed_message', false,
 '{"text": "Thank you for your patience. We are experiencing higher than normal volume. A team member will be with you shortly."}',
 '{"delay_minutes": 5}')
ON CONFLICT (setting_type) DO NOTHING;

-- ============================================================
-- MIGRATION COMPLETE
-- ============================================================

COMMENT ON TABLE workflows IS 'Automated workflow definitions with triggers and actions';
COMMENT ON TABLE workflow_actions IS 'Actions to be executed when workflow is triggered';
COMMENT ON TABLE workflow_executions IS 'Log of workflow executions for analytics';
COMMENT ON TABLE custom_auto_replies IS 'Custom automatic reply messages based on triggers';
COMMENT ON TABLE inbox_settings IS 'Settings for inbox automation (welcome, OOO, delayed messages)';
COMMENT ON TABLE quick_replies IS 'Quick reply templates for agents';
