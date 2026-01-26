-- ================================================
-- Migration: Events Tracking System
-- Description: Adds events tracking for button clicks, custom events, and analytics
-- Date: 2026-01-22
-- ================================================

-- Events table for tracking all events
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id INTEGER NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN (
        'button_click', 'flow_completed', 'ctwa_click', 
        'custom', 'message_sent', 'message_delivered', 
        'message_read', 'message_replied'
    )),
    event_name VARCHAR(255) NOT NULL,
    source VARCHAR(50) CHECK (source IN ('campaign', 'workflow', 'manual', 'widget', 'system')),
    source_id INTEGER,
    metadata JSONB DEFAULT '{}',
    traits JSONB DEFAULT '{}',
    timestamp TIMESTAMP DEFAULT NOW(),
    session_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_events_contact_id ON events(contact_id);
CREATE INDEX idx_events_event_type ON events(event_type);
CREATE INDEX idx_events_source ON events(source, source_id);
CREATE INDEX idx_events_timestamp ON events(timestamp DESC);
CREATE INDEX idx_events_event_name ON events(event_name);
CREATE INDEX idx_events_session_id ON events(session_id) WHERE session_id IS NOT NULL;

-- Event definitions table for managing custom events
CREATE TABLE IF NOT EXISTS event_definitions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    category VARCHAR(100),
    is_system BOOLEAN DEFAULT false,
    schema JSONB DEFAULT '{}',
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Seed default event definitions
INSERT INTO event_definitions (name, description, category, is_system, is_active) VALUES
('Button Click', 'User clicked an interactive button', 'Engagement', true, true),
('Flow Completed', 'User completed a workflow', 'Conversion', true, true),
('CTWA Click', 'Click to WhatsApp from website', 'Acquisition', true, true),
('Message Sent', 'Message sent to user', 'Communication', true, true),
('Message Delivered', 'Message delivered to user', 'Communication', true, true),
('Message Read', 'User read the message', 'Engagement', true, true),
('Message Replied', 'User replied to message', 'Engagement', true, true)
ON CONFLICT (name) DO NOTHING;

-- Add comments for documentation
COMMENT ON TABLE events IS 'Tracks all user events including button clicks, workflow completion, and custom events';
COMMENT ON TABLE event_definitions IS 'Defines available event types that can be tracked in the system';

COMMENT ON COLUMN events.event_type IS 'Type of event: button_click, flow_completed, ctwa_click, custom, message_sent, message_delivered, message_read, message_replied';
COMMENT ON COLUMN events.source IS 'Source that triggered the event: campaign, workflow, manual, widget, system';
COMMENT ON COLUMN events.metadata IS 'Event-specific metadata such as button ID, button type, message ID, etc.';
COMMENT ON COLUMN events.traits IS 'Custom event attributes and properties';
COMMENT ON COLUMN events.session_id IS 'Session identifier for grouping related events';

COMMENT ON COLUMN event_definitions.is_system IS 'System events cannot be deleted or modified';
COMMENT ON COLUMN event_definitions.schema IS 'JSON Schema defining expected traits/attributes for this event type';
