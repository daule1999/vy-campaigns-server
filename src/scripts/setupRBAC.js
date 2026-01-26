/**
 * Setup script for RBAC system
 * This syncs the database and seeds initial data
 */

const { sequelize } = require('../db/models/sequelize');
const { seedRBAC } = require('./seedRBAC');

async function setup() {
    try {
        console.log('🔧 Setting up RBAC system...\n');

        // Step 1: Create tables
        console.log('📦 Creating database tables...');
        // Use force: false to only create new tables, don't alter existing ones (TiDB limitation)
        await sequelize.sync({ force: false });
        console.log('✓ Tables created successfully\n');

        // Step 2: Seed data
        await seedRBAC();

        console.log('\n✅ RBAC setup completed successfully!');
        process.exit(0);

    } catch (error) {
        console.error('\n❌ Setup failed:', error);
        process.exit(1);
    }
}

setup();
