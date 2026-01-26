-- Migration: Analytics and Events System
-- Created: 2026-01-22
-- Description: Implements conversations, messages, events tracking, and chat assignment for analytics

-- ============================================================
-- CONVERSATIONS & MESSAGES
-- ============================================================

-- Conversations (unified inbox)
CREATE TABLE IF NOT EXISTS conversations (
    id SERIAL PRIMARY KEY,
    contact_id INTEGER REFERENCES contacts(id),
    assigned_to INTEGER REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'open',
    channel VARCHAR(50) DEFAULT 'whatsapp',
    first_message_at TIMESTAMP,
    first_response_at TIMESTAMP,
    closed_at TIMESTAMP,
    response_window_expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Messages (for inbox)
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
    contact_id INTEGER REFERENCES contacts(id),
    user_id INTEGER REFERENCES users(id),
    direction VARCHAR(20),
    content_type VARCHAR(50),
    content JSONB NOT NULL,
    whatsapp_message_id VARCHAR(255),
    status VARCHAR(50),
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    delivered_at TIMESTAMP,
    read_at TIMESTAMP,
    failed_at TIMESTAMP,
    error_message TEXT
);

-- ============================================================
-- EVENTS SYSTEM
-- ============================================================

-- Event definitions (both default and custom)
CREATE TABLE IF NOT EXISTS event_definitions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    traits JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Event occurrences
CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    event_definition_id INTEGER REFERENCES event_definitions(id),
    contact_id INTEGER REFERENCES contacts(id),
    campaign_id INTEGER REFERENCES campaigns(id),
    traits JSONB,
    occurred_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- CHAT ASSIGNMENT
-- ============================================================

-- Chat assignment rules
CREATE TABLE IF NOT EXISTS chat_assignment_rules (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    conditions JSONB NOT NULL,
    assignment_type VARCHAR(50),
    assignment_config JSONB NOT NULL,
    priority INTEGER DEFAULT 0,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Agent workload tracking (for load-balanced assignment)
CREATE TABLE IF NOT EXISTS agent_workload (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) UNIQUE,
    active_conversations INTEGER DEFAULT 0,
    total_conversations INTEGER DEFAULT 0,
    avg_response_time_seconds INTEGER,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- CONVERSATION LABELS
-- ============================================================

-- Labels for conversations
CREATE TABLE IF NOT EXISTS conversation_labels (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    color VARCHAR(7),
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Conversation-Label mapping
CREATE TABLE IF NOT EXISTS conversation_label_mappings (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
    label_id INTEGER REFERENCES conversation_labels(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(conversation_id, label_id)
);

-- ============================================================
-- CONVERSATION NOTES
-- ============================================================

-- Notes on conversations
CREATE TABLE IF NOT EXISTS conversation_notes (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id),
    note TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- INDEXES
-- ============================================================

-- Conversations indexes
CREATE INDEX IF NOT EXISTS idx_conversations_contact_id ON conversations(contact_id);
CREATE INDEX IF NOT EXISTS idx_conversations_assigned_to ON conversations(assigned_to);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_channel ON conversations(channel);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_response_window ON conversations(response_window_expires_at);

-- Messages indexes
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_contact_id ON messages(contact_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_direction ON messages(direction);
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);
CREATE INDEX IF NOT EXISTS idx_messages_sent_at ON messages(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_whatsapp_id ON messages(whatsapp_message_id);

-- Events indexes
CREATE INDEX IF NOT EXISTS idx_event_definitions_category ON event_definitions(category);
CREATE INDEX IF NOT EXISTS idx_event_definitions_is_active ON event_definitions(is_active);

CREATE INDEX IF NOT EXISTS idx_events_definition_id ON events(event_definition_id);
CREATE INDEX IF NOT EXISTS idx_events_contact_id ON events(contact_id);
CREATE INDEX IF NOT EXISTS idx_events_campaign_id ON events(campaign_id);
CREATE INDEX IF NOT EXISTS idx_events_occurred_at ON events(occurred_at DESC);

-- Chat assignment indexes
CREATE INDEX IF NOT EXISTS idx_chat_assignment_rules_is_active ON chat_assignment_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_chat_assignment_rules_priority ON chat_assignment_rules(priority DESC);
CREATE INDEX IF NOT EXISTS idx_chat_assignment_rules_created_by ON chat_assignment_rules(created_by);

CREATE INDEX IF NOT EXISTS idx_agent_workload_user_id ON agent_workload(user_id);

-- Conversation labels indexes
CREATE INDEX IF NOT EXISTS idx_conversation_label_mappings_conversation_id ON conversation_label_mappings(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_label_mappings_label_id ON conversation_label_mappings(label_id);

CREATE INDEX IF NOT EXISTS idx_conversation_notes_conversation_id ON conversation_notes(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_notes_user_id ON conversation_notes(user_id);

-- ============================================================
-- CHECK CONSTRAINTS
-- ============================================================

-- Ensure conversation status is valid
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'conversations_status_check'
    ) THEN
        ALTER TABLE conversations ADD CONSTRAINT conversations_status_check 
        CHECK (status IN ('open', 'closed', 'pending', 'spam'));
    END IF;
END $$;

-- Ensure channel is valid
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'conversations_channel_check'
    ) THEN
        ALTER TABLE conversations ADD CONSTRAINT conversations_channel_check 
        CHECK (channel IN ('whatsapp', 'instagram', 'facebook', 'telegram'));
    END IF;
END $$;

-- Ensure message direction is valid
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'messages_direction_check'
    ) THEN
        ALTER TABLE messages ADD CONSTRAINT messages_direction_check 
        CHECK (direction IN ('inbound', 'outbound'));
    END IF;
END $$;

-- Ensure message status is valid
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'messages_status_check'
    ) THEN
        ALTER TABLE messages ADD CONSTRAINT messages_status_check 
        CHECK (status IN ('sent', 'delivered', 'read', 'failed', 'pending'));
    END IF;
END $$;

-- Ensure content_type is valid
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'messages_content_type_check'
    ) THEN
        ALTER TABLE messages ADD CONSTRAINT messages_content_type_check 
        CHECK (content_type IN (
            'text', 'image', 'video', 'audio', 'document', 
            'interactive', 'template', 'location', 'contact', 'sticker'
        ));
    END IF;
END $$;

-- Ensure event category is valid
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'event_definitions_category_check'
    ) THEN
        ALTER TABLE event_definitions ADD CONSTRAINT event_definitions_category_check 
        CHECK (category IN ('default', 'custom'));
    END IF;
END $$;

-- Ensure assignment_type is valid
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chat_assignment_rules_type_check'
    ) THEN
        ALTER TABLE chat_assignment_rules ADD CONSTRAINT chat_assignment_rules_type_check 
        CHECK (assignment_type IN ('round_robin', 'load_balanced', 'specific_agent', 'team', 'trait_based'));
    END IF;
END $$;

-- ============================================================
-- SEED DATA - DEFAULT EVENTS
-- ============================================================

INSERT INTO event_definitions (name, category, description, traits) VALUES
('click_tracking', 'default', 'Tracked whenever a click on a campaign message''s button is detected', 
 '{"fields": ["created_at_utc", "campaign_id", "template_id", "type", "link", "button_text", "click_time"]}'),
('phone_number_updated', 'default', 'Tracked when contact phone number is updated',
 '{"fields": ["country_code", "phone_number"]}'),
('flow_completed', 'default', 'Tracked whenever customer fills & sends a WhatsApp Form',
 '{"fields": ["campaign_id", "flow_id", "flow_token"]}'),
('ctwa_notification', 'default', 'Tracked whenever a customer starts conversation via CTWA ad',
 '{"fields": ["source_id", "source_url"]}'),
('replied_to_notification', 'default', 'Tracked whenever a campaign message is replied to within 72 hours',
 '{"fields": ["reply_text", "reply_date", "campaign_name"]}'),
('notification_sent', 'default', 'Tracked whenever a campaign message is sent/delivered/read/failed',
 '{"fields": ["created_at_utc", "campaign_name", "date_sent", "channel", "template_name", "sent", "delivered", "read", "failed", "error"]}')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- SEED DATA - CONVERSATION LABELS
-- ============================================================

INSERT INTO conversation_labels (name, color) VALUES
('Urgent', '#E74C3C'),
('Follow Up', '#3498DB'),
('Resolved', '#2ECC71'),
('Needs Review', '#F39C12'),
('VIP', '#9B59B6'),
('Sales', '#1ABC9C')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- MIGRATION COMPLETE
-- ============================================================

COMMENT ON TABLE conversations IS 'Unified inbox conversations across all channels';
COMMENT ON TABLE messages IS 'Individual messages within conversations';
COMMENT ON TABLE event_definitions IS 'Definitions for both default and custom events';
COMMENT ON TABLE events IS 'Event occurrences/tracking';
COMMENT ON TABLE chat_assignment_rules IS 'Rules for automatically assigning conversations to agents';
COMMENT ON TABLE agent_workload IS 'Tracks agent workload for load-balanced assignment';
COMMENT ON TABLE conversation_labels IS 'Labels for categorizing conversations';
COMMENT ON TABLE conversation_label_mappings IS 'Maps labels to conversations';
COMMENT ON TABLE conversation_notes IS 'Notes added by agents on conversations';
