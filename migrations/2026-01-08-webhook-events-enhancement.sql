-- Migration: Add enhanced webhook event tracking fields
-- Date: 2026-01-08
-- Description: Adds new columns to webhook_events table for better event tracking and categorization

-- Add new columns
ALTER TABLE `webhook_events` 
ADD COLUMN `webhook_type` VARCHAR(50) NULL COMMENT 'Webhook category: message_received, message_status, etc.' AFTER `event_type`;

ALTER TABLE `webhook_events` 
ADD COLUMN `message_id` VARCHAR(255) NULL COMMENT 'WhatsApp message ID (WAMID)' AFTER `message_text`;

ALTER TABLE `webhook_events` 
ADD COLUMN `status_type` VARCHAR(20) NULL COMMENT 'sent, delivered, read, failed for status events' AFTER `message_id`;

ALTER TABLE `webhook_events` 
ADD COLUMN `error_code` INT NULL COMMENT 'Error code if event contains error' AFTER `template_status`;

ALTER TABLE `webhook_events` 
ADD COLUMN `error_message` TEXT NULL COMMENT 'Error message if event contains error' AFTER `error_code`;

-- Add indexes for new columns
CREATE INDEX `idx_webhook_type` ON `webhook_events` (`webhook_type`);
CREATE INDEX `idx_message_id` ON `webhook_events` (`message_id`);
CREATE INDEX `idx_status_type` ON `webhook_events` (`status_type`);
