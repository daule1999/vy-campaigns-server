const config = require('../config');

let sequelize = null;

/**
 * Connect to MySQL database
 */
async function connectDB() {
    try {
        const { sequelize: sq } = require('./models/sequelize');
        sequelize = sq;
        await sequelize.authenticate();
        console.log('✓ MySQL database connected');
        return true;
    } catch (error) {
        console.error('✗ MySQL connection failed:', error.message);
        return false;
    }
}

/**
 * Sync database tables
 */
async function syncDB() {
    if (!sequelize) {
        console.error('Database not connected');
        return;
    }

    try {
        // Create tables if not exist (without alter for TiDB compatibility)
        // For schema changes in TiDB, use migrations/rbac_migration.sql
        await sequelize.sync();
        console.log('✓ Database tables synchronized');
    } catch (error) {
        // Ignore duplicate index errors from TiDB (DDL jobs still processing)
        if (error.parent?.code === 'ER_DUP_KEYNAME') {
            console.log('✓ Database tables synchronized (some indexes already exist)');
        } else {
            throw error;
        }
    }
}

/**
 * Get Sequelize instance
 */
function getSequelize() {
    if (!sequelize) {
        const { sequelize: sq } = require('./models/sequelize');
        return sq;
    }
    return sequelize;
}

module.exports = {
    connectDB,
    syncDB,
    getSequelize
};
