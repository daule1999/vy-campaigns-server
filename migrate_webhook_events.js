/**
 * Database Migration Script
 * Adds enhanced webhook event tracking fields to webhook_events table
 */

const config = require('./src/config');
const mysql = require('mysql2/promise');

async function runMigration() {
    let connection;

    try {
        // Create connection
        connection = await mysql.createConnection({
            host: config.db.host,
            user: config.db.username,
            password: config.db.password,
            database: config.db.database
        });

        console.log('✓ Connected to database');

        // Check if columns already exist
        const [columns] = await connection.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'webhook_events'
        `, [config.db.database]);

        const existingColumns = columns.map(c => c.COLUMN_NAME);

        // Add webhook_type column
        if (!existingColumns.includes('webhook_type')) {
            console.log('Adding webhook_type column...');
            await connection.query(`
                ALTER TABLE webhook_events 
                ADD COLUMN webhook_type VARCHAR(50) NULL COMMENT 'Webhook category: message_received, message_status, etc.' 
                AFTER event_type
            `);
            console.log('✓ Added webhook_type column');
        } else {
            console.log('• webhook_type column already exists');
        }

        // Add message_id column
        if (!existingColumns.includes('message_id')) {
            console.log('Adding message_id column...');
            await connection.query(`
                ALTER TABLE webhook_events 
                ADD COLUMN message_id VARCHAR(255) NULL COMMENT 'WhatsApp message ID (WAMID)' 
                AFTER message_text
            `);
            console.log('✓ Added message_id column');
        } else {
            console.log('• message_id column already exists');
        }

        // Add status_type column
        if (!existingColumns.includes('status_type')) {
            console.log('Adding status_type column...');
            await connection.query(`
                ALTER TABLE webhook_events 
                ADD COLUMN status_type VARCHAR(20) NULL COMMENT 'sent, delivered, read, failed for status events' 
                AFTER message_id
            `);
            console.log('✓ Added status_type column');
        } else {
            console.log('• status_type column already exists');
        }

        // Add error_code column
        if (!existingColumns.includes('error_code')) {
            console.log('Adding error_code column...');
            await connection.query(`
                ALTER TABLE webhook_events 
                ADD COLUMN error_code INT NULL COMMENT 'Error code if event contains error' 
                AFTER template_status
            `);
            console.log('✓ Added error_code column');
        } else {
            console.log('• error_code column already exists');
        }

        // Add error_message column
        if (!existingColumns.includes('error_message')) {
            console.log('Adding error_message column...');
            await connection.query(`
                ALTER TABLE webhook_events 
                ADD COLUMN error_message TEXT NULL COMMENT 'Error message if event contains error' 
                AFTER error_code
            `);
            console.log('✓ Added error_message column');
        } else {
            console.log('• error_message column already exists');
        }

        // Check and add indexes
        console.log('\nAdding indexes...');
        const [indexes] = await connection.query(`
            SHOW INDEX FROM webhook_events
        `);

        const existingIndexes = indexes.map(i => i.Key_name);

        if (!existingIndexes.includes('idx_webhook_type')) {
            await connection.query('CREATE INDEX idx_webhook_type ON webhook_events (webhook_type)');
            console.log('✓ Added index on webhook_type');
        } else {
            console.log('• Index on webhook_type already exists');
        }

        if (!existingIndexes.includes('idx_message_id')) {
            await connection.query('CREATE INDEX idx_message_id ON webhook_events (message_id)');
            console.log('✓ Added index on message_id');
        } else {
            console.log('• Index on message_id already exists');
        }

        if (!existingIndexes.includes('idx_status_type')) {
            await connection.query('CREATE INDEX idx_status_type ON webhook_events (status_type)');
            console.log('✓ Added index on status_type');
        } else {
            console.log('• Index on status_type already exists');
        }

        console.log('\n✅ Migration completed successfully!');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

runMigration();
