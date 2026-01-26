-- Migration: Agents and Contacts Enhancement
-- Created: 2026-01-22
-- Description: Enhances users table for agent management and adds contact custom fields, tags, and ownership

-- ============================================================
-- USERS TABLE ENHANCEMENT
-- ============================================================

-- Add new fields to users table for agent management
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_logged_in TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS invited_by INTEGER REFERENCES users(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS invitation_sent_at TIMESTAMP;

-- Add check constraint for status
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'users_status_check'
    ) THEN
        ALTER TABLE users ADD CONSTRAINT users_status_check 
        CHECK (status IN ('active', 'inactive', 'pending'));
    END IF;
END $$;

-- ============================================================
-- CONTACT CUSTOM FIELDS
-- ============================================================

-- Contact custom fields definition
CREATE TABLE IF NOT EXISTS contact_fields (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    field_type VARCHAR(50) NOT NULL,
    options JSONB,
    is_required BOOLEAN DEFAULT FALSE,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Contact field values
CREATE TABLE IF NOT EXISTS contact_field_values (
    id SERIAL PRIMARY KEY,
    contact_id INTEGER REFERENCES contacts(id) ON DELETE CASCADE,
    field_id INTEGER REFERENCES contact_fields(id) ON DELETE CASCADE,
    value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(contact_id, field_id)
);

-- ============================================================
-- CONTACT TAGS
-- ============================================================

-- Tags table
CREATE TABLE IF NOT EXISTS tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    color VARCHAR(7),
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Contact-Tag mapping
CREATE TABLE IF NOT EXISTS contact_tags (
    id SERIAL PRIMARY KEY,
    contact_id INTEGER REFERENCES contacts(id) ON DELETE CASCADE,
    tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(contact_id, tag_id)
);

-- ============================================================
-- CONTACT OWNERSHIP
-- ============================================================

-- Add ownership and team fields to contacts
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS owner_id INTEGER REFERENCES users(id);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS team_id INTEGER REFERENCES teams(id);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS source VARCHAR(100);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_users_phone_number ON users(phone_number);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_invited_by ON users(invited_by);

CREATE INDEX IF NOT EXISTS idx_contact_fields_created_by ON contact_fields(created_by);
CREATE INDEX IF NOT EXISTS idx_contact_field_values_contact_id ON contact_field_values(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_field_values_field_id ON contact_field_values(field_id);

CREATE INDEX IF NOT EXISTS idx_tags_created_by ON tags(created_by);
CREATE INDEX IF NOT EXISTS idx_contact_tags_contact_id ON contact_tags(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_tags_tag_id ON contact_tags(tag_id);

CREATE INDEX IF NOT EXISTS idx_contacts_owner_id ON contacts(owner_id);
CREATE INDEX IF NOT EXISTS idx_contacts_team_id ON contacts(team_id);
CREATE INDEX IF NOT EXISTS idx_contacts_source ON contacts(source);

-- ============================================================
-- CHECK CONSTRAINTS
-- ============================================================

-- Ensure field_type is valid
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'contact_fields_field_type_check'
    ) THEN
        ALTER TABLE contact_fields ADD CONSTRAINT contact_fields_field_type_check 
        CHECK (field_type IN ('text', 'number', 'date', 'dropdown', 'email', 'phone', 'url', 'textarea'));
    END IF;
END $$;

-- Ensure color is valid hex code
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'tags_color_check'
    ) THEN
        ALTER TABLE tags ADD CONSTRAINT tags_color_check 
        CHECK (color IS NULL OR color ~ '^#[0-9A-Fa-f]{6}$');
    END IF;
END $$;

-- ============================================================
-- SEED DATA - COMMON TAGS
-- ============================================================

INSERT INTO tags (name, color) VALUES
('VIP', '#FF6B6B'),
('Lead', '#4ECDC4'),
('Customer', '#45B7D1'),
('Inactive', '#95A5A6'),
('Hot Lead', '#FF9F43'),
('Cold Lead', '#74B9FF')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- MIGRATION COMPLETE
-- ============================================================

COMMENT ON TABLE contact_fields IS 'Custom field definitions for contacts';
COMMENT ON TABLE contact_field_values IS 'Stores custom field values for each contact';
COMMENT ON TABLE tags IS 'Tags for categorizing contacts';
COMMENT ON TABLE contact_tags IS 'Maps tags to contacts';
COMMENT ON COLUMN users.phone_number IS 'Contact phone number for agent';
COMMENT ON COLUMN users.status IS 'Agent status: active, inactive, or pending invitation';
COMMENT ON COLUMN users.last_logged_in IS 'Last login timestamp';
COMMENT ON COLUMN users.invited_by IS 'User who invited this agent';
COMMENT ON COLUMN users.invitation_sent_at IS 'When invitation was sent';
COMMENT ON COLUMN contacts.owner_id IS 'Agent who owns this contact';
COMMENT ON COLUMN contacts.team_id IS 'Team this contact belongs to';
COMMENT ON COLUMN contacts.source IS 'How contact was added (Dashboard, Bulk Upload, API, etc.)';
