-- Migration: Create workflow system tables
-- Run this manually on TiDB Serverless

-- Campaign Products table
CREATE TABLE IF NOT EXISTS `campaign_products` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `is_active` TINYINT(1) DEFAULT 1,
  `config` JSON,
  `created_by` INT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_is_active` (`is_active`),
  INDEX `idx_created_by` (`created_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Product Workflows table
CREATE TABLE IF NOT EXISTS `product_workflows` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `product_id` INT NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_product_id` (`product_id`),
  INDEX `idx_is_active` (`is_active`),
  FOREIGN KEY (`product_id`) REFERENCES `campaign_products`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Workflow Steps table
CREATE TABLE IF NOT EXISTS `workflow_steps` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `workflow_id` INT NOT NULL,
  `order` INT NOT NULL DEFAULT 1,
  `name` VARCHAR(255) NOT NULL,
  `type` ENUM('data_entry', 'call', 'whatsapp', 'approval', 'automated') DEFAULT 'data_entry',
  `assigned_group_id` INT,
  `form_schema` JSON,
  `conditions` JSON,
  `config` JSON,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_workflow_id` (`workflow_id`),
  INDEX `idx_workflow_order` (`workflow_id`, `order`),
  INDEX `idx_assigned_group` (`assigned_group_id`),
  FOREIGN KEY (`workflow_id`) REFERENCES `product_workflows`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`assigned_group_id`) REFERENCES `groups`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Applications table
CREATE TABLE IF NOT EXISTS `applications` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `product_id` INT NOT NULL,
  `person_id` INT NOT NULL,
  `status` ENUM('pending', 'in_progress', 'completed', 'rejected', 'cancelled') DEFAULT 'pending',
  `current_step_id` INT,
  `initial_data` JSON,
  `priority` INT DEFAULT 0,
  `created_by` INT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_product_id` (`product_id`),
  INDEX `idx_person_id` (`person_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_current_step` (`current_step_id`),
  INDEX `idx_product_status` (`product_id`, `status`),
  INDEX `idx_priority` (`priority`),
  FOREIGN KEY (`product_id`) REFERENCES `campaign_products`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`person_id`) REFERENCES `persons`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`current_step_id`) REFERENCES `workflow_steps`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Step Executions table
CREATE TABLE IF NOT EXISTS `step_executions` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `application_id` INT NOT NULL,
  `step_id` INT NOT NULL,
  `status` ENUM('pending', 'in_progress', 'completed', 'skipped', 'rejected') DEFAULT 'pending',
  `form_data` JSON,
  `assigned_to` INT,
  `notes` TEXT,
  `started_at` DATETIME,
  `completed_at` DATETIME,
  `completed_by` INT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_application_id` (`application_id`),
  INDEX `idx_step_id` (`step_id`),
  INDEX `idx_assigned_to` (`assigned_to`),
  INDEX `idx_status` (`status`),
  UNIQUE INDEX `idx_app_step` (`application_id`, `step_id`),
  FOREIGN KEY (`application_id`) REFERENCES `applications`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`step_id`) REFERENCES `workflow_steps`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`assigned_to`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
