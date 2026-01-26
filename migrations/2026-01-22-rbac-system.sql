-- Migration: RBAC System - Roles, Permissions, and Teams
-- Created: 2026-01-22
-- Description: Implements comprehensive role-based access control system

-- ============================================================
-- TABLES
-- ============================================================

-- Roles table
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Permissions table
CREATE TABLE IF NOT EXISTS permissions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Role-Permission mapping
CREATE TABLE IF NOT EXISTS role_permissions (
    id SERIAL PRIMARY KEY,
    role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
    permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role_id, permission_id)
);

-- User-Role mapping (users can have multiple roles)
CREATE TABLE IF NOT EXISTS user_roles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, role_id)
);

-- Teams table
CREATE TABLE IF NOT EXISTS teams (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Team members (with hierarchy: lead or member)
CREATE TABLE IF NOT EXISTS team_members (
    id SERIAL PRIMARY KEY,
    team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    is_lead BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(team_id, user_id)
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_permissions_category ON permissions(category);

-- ============================================================
-- SEED DATA - PERMISSIONS
-- ============================================================

-- Contact Hub Permissions
INSERT INTO permissions (name, category, description) VALUES
('contact.view_all', 'contact', 'View all contacts'),
('contact.view_assigned', 'contact', 'View only assigned contacts'),
('contact.export', 'contact', 'Export contacts'),
('contact.create', 'contact', 'Add new contacts'),
('contact.update', 'contact', 'Edit contact details'),
('contact.delete', 'contact', 'Delete contacts'),
('contact.bulk_tag', 'contact', 'Bulk tag contacts'),
('contact.view_phone', 'contact', 'See contact phone numbers'),
('contact.view_fields', 'contact', 'See contact field data')
ON CONFLICT (name) DO NOTHING;

-- Campaign Permissions
INSERT INTO permissions (name, category, description) VALUES
('campaign.view_all', 'campaign', 'View all campaigns'),
('campaign.view_assigned', 'campaign', 'View only assigned campaigns'),
('campaign.create', 'campaign', 'Create new campaigns'),
('campaign.update', 'campaign', 'Edit campaigns'),
('campaign.delete', 'campaign', 'Delete campaigns'),
('campaign.export_report', 'campaign', 'Export campaign reports'),
('campaign.view_custom_reports', 'campaign', 'View detailed campaign reports')
ON CONFLICT (name) DO NOTHING;

-- Template Permissions
INSERT INTO permissions (name, category, description) VALUES
('template.view', 'template', 'View templates'),
('template.create', 'template', 'Create templates'),
('template.update', 'template', 'Edit templates'),
('template.delete', 'template', 'Delete templates'),
('template.ai_suggestions', 'template', 'Use AI smart buttons')
ON CONFLICT (name) DO NOTHING;

-- Inbox/Chat Permissions
INSERT INTO permissions (name, category, description) VALUES
('inbox.view_all', 'inbox', 'View all conversations'),
('inbox.view_assigned', 'inbox', 'View only assigned conversations'),
('inbox.view_unassigned', 'inbox', 'View unassigned conversations'),
('inbox.assign', 'inbox', 'Assign conversations to agents'),
('inbox.close', 'inbox', 'Close conversations'),
('inbox.export', 'inbox', 'Export chat data')
ON CONFLICT (name) DO NOTHING;

-- Automation Permissions
INSERT INTO permissions (name, category, description) VALUES
('automation.view_workflows', 'automation', 'View workflows'),
('automation.create_workflows', 'automation', 'Create workflows'),
('automation.update_workflows', 'automation', 'Edit workflows'),
('automation.delete_workflows', 'automation', 'Delete workflows'),
('automation.export_workflow_report', 'automation', 'Export workflow reports'),
('automation.manage_welcome_message', 'automation', 'Configure welcome message'),
('automation.manage_ooo_message', 'automation', 'Configure out of office message'),
('automation.manage_delayed_message', 'automation', 'Configure delayed message'),
('automation.manage_custom_replies', 'automation', 'Manage custom auto replies')
ON CONFLICT (name) DO NOTHING;

-- Analytics Permissions
INSERT INTO permissions (name, category, description) VALUES
('analytics.view_conversation', 'analytics', 'View conversation analytics'),
('analytics.export_conversation', 'analytics', 'Export conversation analytics'),
('analytics.view_agent_performance', 'analytics', 'View agent performance analytics'),
('analytics.view_campaign_analytics', 'analytics', 'View campaign analytics')
ON CONFLICT (name) DO NOTHING;

-- Team & Agent Management Permissions
INSERT INTO permissions (name, category, description) VALUES
('team.view', 'team', 'View teams'),
('team.create', 'team', 'Create teams'),
('team.update', 'team', 'Edit teams'),
('team.delete', 'team', 'Delete teams'),
('agent.view', 'agent', 'View agents'),
('agent.invite', 'agent', 'Invite new agents'),
('agent.update', 'agent', 'Edit agent details'),
('agent.delete', 'agent', 'Remove agents'),
('agent.manage_roles', 'agent', 'Assign roles to agents')
ON CONFLICT (name) DO NOTHING;

-- Settings Permissions
INSERT INTO permissions (name, category, description) VALUES
('settings.view_api_key', 'settings', 'View API keys'),
('settings.manage_api_key', 'settings', 'Generate/regenerate API keys'),
('settings.manage_whatsapp_setup', 'settings', 'Configure WhatsApp Business'),
('settings.view_billing', 'settings', 'View billing and invoices'),
('settings.manage_subscription', 'settings', 'Manage subscription and add-ons'),
('settings.manage_tags', 'settings', 'Create/edit/delete tags'),
('settings.reconnect_number', 'settings', 'Reconnect WhatsApp number')
ON CONFLICT (name) DO NOTHING;

-- Wallet & Billing Permissions
INSERT INTO permissions (name, category, description) VALUES
('wallet.view_balance', 'wallet', 'View wallet balance'),
('wallet.view_transactions', 'wallet', 'View transaction history'),
('billing.view_insights', 'billing', 'View paid message insights'),
('billing.view_invoices', 'billing', 'View invoice history'),
('billing.manage_subscription', 'billing', 'Manage subscription')
ON CONFLICT (name) DO NOTHING;

-- Events Permissions
INSERT INTO permissions (name, category, description) VALUES
('events.view', 'events', 'View events'),
('events.create_custom', 'events', 'Create custom events'),
('events.delete_custom', 'events', 'Delete custom events')
ON CONFLICT (name) DO NOTHING;

-- Contact Settings Permissions
INSERT INTO permissions (name, category, description) VALUES
('contact_settings.manage_fields', 'contact_settings', 'Add/delete custom fields')
ON CONFLICT (name) DO NOTHING;

-- Instagram Permissions
INSERT INTO permissions (name, category, description) VALUES
('instagram.connect', 'instagram', 'Connect Instagram account'),
('instagram.disconnect', 'instagram', 'Disconnect Instagram account')
ON CONFLICT (name) DO NOTHING;

-- Widget Permissions
INSERT INTO permissions (name, category, description) VALUES
('widget.view', 'widget', 'View widget settings'),
('widget.customize', 'widget', 'Customize widget appearance')
ON CONFLICT (name) DO NOTHING;

-- CTWA Ads Permissions
INSERT INTO permissions (name, category, description) VALUES
('ctwa.view', 'ctwa', 'View CTWA ads page')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- SEED DATA - ROLES
-- ============================================================

-- Insert system roles
INSERT INTO roles (name, display_name, description, is_system) VALUES
('owner', 'Owner', 'Business owner with full access to all features', true),
('super_admin', 'Super Admin', 'Full administrative access with some billing restrictions', true),
('admin', 'Admin', 'Administrative access with moderate restrictions', true),
('sales_lead', 'Sales Lead', 'Team lead with access to team members data and workflows', true),
('sales_agent', 'Sales Agent', 'Individual sales agent with limited access', true),
('teammate', 'Teammate', 'General team member for customer support', true)
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- SEED DATA - ROLE PERMISSIONS
-- ============================================================

-- Owner: All permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'owner'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Super Admin: All except some billing permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'super_admin'
  AND p.name NOT IN ('billing.manage_subscription')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Admin: Most permissions with restrictions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin'
  AND p.name NOT IN (
    'agent.delete',
    'agent.manage_roles',
    'settings.manage_api_key',
    'settings.manage_subscription',
    'billing.manage_subscription',
    'settings.reconnect_number'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Sales Lead: Team-focused permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'sales_lead'
  AND p.category IN ('contact', 'campaign', 'inbox', 'analytics', 'team')
  AND p.name NOT IN (
    'contact.delete',
    'campaign.delete',
    'team.delete'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Sales Agent: Limited to assigned contacts and campaigns
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'sales_agent'
  AND p.name IN (
    'contact.view_assigned',
    'contact.create',
    'contact.update',
    'contact.view_phone',
    'contact.view_fields',
    'campaign.view_assigned',
    'campaign.create',
    'campaign.export_report',
    'inbox.view_assigned',
    'template.view',
    'analytics.view_campaign_analytics'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Teammate: Support-focused permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'teammate'
  AND p.name IN (
    'contact.view_assigned',
    'contact.view_phone',
    'contact.view_fields',
    'inbox.view_assigned',
    'inbox.close',
    'template.view',
    'automation.view_workflows'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ============================================================
-- MIGRATION COMPLETE
-- ============================================================

COMMENT ON TABLE roles IS 'Defines user roles with hierarchical permissions';
COMMENT ON TABLE permissions IS 'Granular permissions that can be assigned to roles';
COMMENT ON TABLE role_permissions IS 'Maps permissions to roles';
COMMENT ON TABLE user_roles IS 'Assigns roles to users (many-to-many)';
COMMENT ON TABLE teams IS 'Organizational teams for grouping users and contacts';
COMMENT ON TABLE team_members IS 'Team membership with lead/member hierarchy';
