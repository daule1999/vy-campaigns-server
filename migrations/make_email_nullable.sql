-- Make email column nullable in users table
-- This allows users to be created without an email address
ALTER TABLE users MODIFY COLUMN email VARCHAR(255) NULL DEFAULT NULL;
