-- VY Campaigns RBAC Database Migration for TiDB Serverless
-- Run these statements in the TiDB SQL Editor: https://tidbcloud.com/clusters/10216810750264918698/sqleditor

-- Step 1: Add username column (without UNIQUE constraint first)
ALTER TABLE users ADD COLUMN username VARCHAR(50);

-- Step 2: Populate username from email (extract part before @)
UPDATE users SET username = SUBSTRING_INDEX(email, '@', 1) WHERE username IS NULL;

-- Step 3: Add unique index after data is populated
ALTER TABLE users ADD UNIQUE INDEX idx_username (username);

-- Step 4: Add is_super_admin column (can be done in one step)
ALTER TABLE users ADD COLUMN is_super_admin TINYINT(1) DEFAULT 0;

-- Step 5: Convert existing admin to superadmin
UPDATE users SET is_super_admin = 1 WHERE role = 'admin' LIMIT 1;

-- Step 6: Create permissions table
CREATE TABLE IF NOT EXISTS permissions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(255),
    feature VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Step 7: Create groups table
CREATE TABLE IF NOT EXISTS `groups` (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Step 8: Create group_permissions join table
CREATE TABLE IF NOT EXISTS group_permissions (
    group_id INT NOT NULL,
    permission_id INT NOT NULL,
    PRIMARY KEY (group_id, permission_id),
    FOREIGN KEY (group_id) REFERENCES `groups`(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

-- Step 9: Create user_groups join table
CREATE TABLE IF NOT EXISTS user_groups (
    user_id INT NOT NULL,
    group_id INT NOT NULL,
    PRIMARY KEY (user_id, group_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (group_id) REFERENCES `groups`(id) ON DELETE CASCADE
);

-- Step 10: Seed default permissions
INSERT IGNORE INTO permissions (name, feature, description) VALUES
('dashboard:view', 'dashboard', 'View dashboard'),
('campaigns:read', 'campaigns', 'View campaigns'),
('campaigns:write', 'campaigns', 'Create/edit campaigns'),
('campaigns:delete', 'campaigns', 'Delete campaigns'),
('campaigns:send', 'campaigns', 'Send campaigns'),
('templates:read', 'templates', 'View templates'),
('templates:write', 'templates', 'Create/edit templates'),
('templates:delete', 'templates', 'Delete templates'),
('persons:read', 'persons', 'View contacts'),
('persons:write', 'persons', 'Create/edit contacts'),
('persons:delete', 'persons', 'Delete contacts'),
('audit:read', 'audit', 'View audit logs'),
('admin:users', 'admin', 'Manage users'),
('rbac:read', 'rbac', 'View groups/permissions'),
('rbac:write', 'rbac', 'Manage groups/permissions'),
('autoresponders:read', 'autoresponders', 'View autoresponders'),
('autoresponders:write', 'autoresponders', 'Manage autoresponders');

-- Step 11: Create or update superadmin user
-- If you want a fresh superadmin, run:
-- INSERT INTO users (username, email, password_hash, name, is_super_admin, is_active, created_at, updated_at)
-- VALUES ('superadmin', 'superadmin@vy.com', '<bcrypt_hash>', 'Super Admin', 1, 1, NOW(), NOW());
