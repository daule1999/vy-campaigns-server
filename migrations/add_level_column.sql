-- Migration: Add level column to groups table
-- Run this manually on TiDB Serverless

-- Add level column to groups table (for hierarchy system)
-- Note: 'groups' is a reserved word, so we use backticks
ALTER TABLE `groups` ADD COLUMN `level` INT NOT NULL DEFAULT 10;

-- The level determines hierarchy:
-- 1 = Highest rank (Admin level)
-- 10 = Lowest rank (Default for new groups)
-- Users can only manage users in groups with higher level numbers (lower rank)
