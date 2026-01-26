/**
 * Seed script for RBAC system
 * This populates roles, permissions, and their mappings
 */

const { sequelize, Role, Permission, RolePermission } = require('../db/models/sequelize');

// Permission definitions organized by feature
const permissionsData = [
    // Contact Hub Permissions
    { name: 'contact.view_all', feature: 'contact', description: 'View all contacts' },
    { name: 'contact.view_assigned', feature: 'contact', description: 'View only assigned contacts' },
    { name: 'contact.export', feature: 'contact', description: 'Export contacts' },
    { name: 'contact.create', feature: 'contact', description: 'Add new contacts' },
    { name: 'contact.update', feature: 'contact', description: 'Edit contact details' },
    { name: 'contact.delete', feature: 'contact', description: 'Delete contacts' },
    { name: 'contact.bulk_tag', feature: 'contact', description: 'Bulk tag contacts' },
    { name: 'contact.view_phone', feature: 'contact', description: 'See contact phone numbers' },
    { name: 'contact.view_fields', feature: 'contact', description: 'See contact field data' },

    // Campaign Permissions
    { name: 'campaign.view_all', feature: 'campaign', description: 'View all campaigns' },
    { name: 'campaign.view_assigned', feature: 'campaign', description: 'View only assigned campaigns' },
    { name: 'campaign.create', feature: 'campaign', description: 'Create new campaigns' },
    { name: 'campaign.update', feature: 'campaign', description: 'Edit campaigns' },
    { name: 'campaign.delete', feature: 'campaign', description: 'Delete campaigns' },
    { name: 'campaign.export_report', feature: 'campaign', description: 'Export campaign reports' },
    { name: 'campaign.view_custom_reports', feature: 'campaign', description: 'View detailed campaign reports' },

    // Template Permissions
    { name: 'template.view', feature: 'template', description: 'View templates' },
    { name: 'template.create', feature: 'template', description: 'Create templates' },
    { name: 'template.update', feature: 'template', description: 'Edit templates' },
    { name: 'template.delete', feature: 'template', description: 'Delete templates' },
    { name: 'template.ai_suggestions', feature: 'template', description: 'Use AI smart buttons' },

    // Inbox/Chat Permissions
    { name: 'inbox.view_all', feature: 'inbox', description: 'View all conversations' },
    { name: 'inbox.view_assigned', feature: 'inbox', description: 'View only assigned conversations' },
    { name: 'inbox.view_unassigned', feature: 'inbox', description: 'View unassigned conversations' },
    { name: 'inbox.assign', feature: 'inbox', description: 'Assign conversations to agents' },
    { name: 'inbox.close', feature: 'inbox', description: 'Close conversations' },
    { name: 'inbox.export', feature: 'inbox', description: 'Export chat data' },

    // Automation Permissions
    { name: 'automation.view_workflows', feature: 'automation', description: 'View workflows' },
    { name: 'automation.create_workflows', feature: 'automation', description: 'Create workflows' },
    { name: 'automation.update_workflows', feature: 'automation', description: 'Edit workflows' },
    { name: 'automation.delete_workflows', feature: 'automation', description: 'Delete workflows' },
    { name: 'automation.export_workflow_report', feature: 'automation', description: 'Export workflow reports' },
    { name: 'automation.manage_welcome_message', feature: 'automation', description: 'Configure welcome message' },
    { name: 'automation.manage_ooo_message', feature: 'automation', description: 'Configure out of office message' },
    { name: 'automation.manage_delayed_message', feature: 'automation', description: 'Configure delayed message' },
    { name: 'automation.manage_custom_replies', feature: 'automation', description: 'Manage custom auto replies' },

    // Analytics Permissions
    { name: 'analytics.view_conversation', feature: 'analytics', description: 'View conversation analytics' },
    { name: 'analytics.export_conversation', feature: 'analytics', description: 'Export conversation analytics' },
    { name: 'analytics.view_agent_performance', feature: 'analytics', description: 'View agent performance analytics' },
    { name: 'analytics.view_campaign_analytics', feature: 'analytics', description: 'View campaign analytics' },

    // Team & Agent Management Permissions
    { name: 'team.view', feature: 'team', description: 'View teams' },
    { name: 'team.create', feature: 'team', description: 'Create teams' },
    { name: 'team.update', feature: 'team', description: 'Edit teams' },
    { name: 'team.delete', feature: 'team', description: 'Delete teams' },
    { name: 'agent.view', feature: 'agent', description: 'View agents' },
    { name: 'agent.invite', feature: 'agent', description: 'Invite new agents' },
    { name: 'agent.update', feature: 'agent', description: 'Edit agent details' },
    { name: 'agent.delete', feature: 'agent', description: 'Remove agents' },
    { name: 'agent.manage_roles', feature: 'agent', description: 'Assign roles to agents' },

    // Settings Permissions
    { name: 'settings.view_api_key', feature: 'settings', description: 'View API keys' },
    { name: 'settings.manage_api_key', feature: 'settings', description: 'Generate/regenerate API keys' },
    { name: 'settings.manage_whatsapp_setup', feature: 'settings', description: 'Configure WhatsApp Business' },
    { name: 'settings.view_billing', feature: 'settings', description: 'View billing and invoices' },
    { name: 'settings.manage_subscription', feature: 'settings', description: 'Manage subscription and add-ons' },
    { name: 'settings.manage_tags', feature: 'settings', description: 'Create/edit/delete tags' },
    { name: 'settings.reconnect_number', feature: 'settings', description: 'Reconnect WhatsApp number' },

    // Wallet & Billing Permissions
    { name: 'wallet.view_balance', feature: 'wallet', description: 'View wallet balance' },
    { name: 'wallet.view_transactions', feature: 'wallet', description: 'View transaction history' },
    { name: 'billing.view_insights', feature: 'billing', description: 'View paid message insights' },
    { name: 'billing.view_invoices', feature: 'billing', description: 'View invoice history' },
    { name: 'billing.manage_subscription', feature: 'billing', description: 'Manage subscription' },

    // Events Permissions
    { name: 'events.view', feature: 'events', description: 'View events' },
    { name: 'events.create_custom', feature: 'events', description: 'Create custom events' },
    { name: 'events.delete_custom', feature: 'events', description: 'Delete custom events' },

    // Contact Settings Permissions
    { name: 'contact_settings.manage_fields', feature: 'contact_settings', description: 'Add/delete custom fields' },

    // Instagram Permissions
    { name: 'instagram.connect', feature: 'instagram', description: 'Connect Instagram account' },
    { name: 'instagram.disconnect', feature: 'instagram', description: 'Disconnect Instagram account' },

    // Widget Permissions
    { name: 'widget.view', feature: 'widget', description: 'View widget settings' },
    { name: 'widget.customize', feature: 'widget', description: 'Customize widget appearance' },

    // CTWA Ads Permissions
    { name: 'ctwa.view', feature: 'ctwa', description: 'View CTWA ads page' }
];


// Role definitions
const rolesData = [
    {
        name: 'owner',
        displayName: 'Owner',
        description: 'Business owner with full access to all features',
        isSystem: true
    },
    {
        name: 'super_admin',
        displayName: 'Super Admin',
        description: 'Full administrative access with some billing restrictions',
        isSystem: true
    },
    {
        name: 'admin',
        displayName: 'Admin',
        description: 'Administrative access with moderate restrictions',
        isSystem: true
    },
    {
        name: 'sales_lead',
        displayName: 'Sales Lead',
        description: 'Team lead with access to team members data and workflows',
        isSystem: true
    },
    {
        name: 'sales_agent',
        displayName: 'Sales Agent',
        description: 'Individual sales agent with limited access',
        isSystem: true
    },
    {
        name: 'teammate',
        displayName: 'Teammate',
        description: 'General team member for customer support',
        isSystem: true
    }
];

async function seedRBAC() {
    try {
        console.log('🌱 Starting RBAC seeding...');

        // Step 1: Create all permissions
        console.log('Creating permissions...');
        for (const perm of permissionsData) {
            await Permission.findOrCreate({
                where: { name: perm.name },
                defaults: perm
            });
        }
        console.log(`✓ Created ${permissionsData.length} permissions`);

        // Step 2: Create all roles
        console.log('Creating roles...');
        for (const role of rolesData) {
            await Role.findOrCreate({
                where: { name: role.name },
                defaults: role
            });
        }
        console.log(`✓ Created ${rolesData.length} roles`);

        // Step 3: Assign permissions to roles
        console.log('Assigning permissions to roles...');

        // Owner: All permissions
        const owner = await Role.findOne({ where: { name: 'owner' } });
        const allPermissions = await Permission.findAll();
        await owner.setPermissions(allPermissions);
        console.log(`✓ Owner assigned ${allPermissions.length} permissions`);

        // Super Admin: All except billing.manage_subscription
        const superAdmin = await Role.findOne({ where: { name: 'super_admin' } });
        const superAdminPerms = allPermissions.filter(p => p.name !== 'billing.manage_subscription');
        await superAdmin.setPermissions(superAdminPerms);
        console.log(`✓ Super Admin assigned ${superAdminPerms.length} permissions`);

        // Admin: Most  permissions with restrictions
        const admin = await Role.findOne({ where: { name: 'admin' } });
        const restrictedPermissions = [
            'agent.delete',
            'agent.manage_roles',
            'settings.manage_api_key',
            'settings.manage_subscription',
            'billing.manage_subscription',
            'settings.reconnect_number'
        ];
        const adminPerms = allPermissions.filter(p => !restrictedPermissions.includes(p.name));
        await admin.setPermissions(adminPerms);
        console.log(`✓ Admin assigned ${adminPerms.length} permissions`);

        // Sales Lead: Team-focused permissions
        const salesLead = await Role.findOne({ where: { name: 'sales_lead' } });
        const salesLeadCategories = ['contact', 'campaign', 'inbox', 'analytics', 'team'];
        const salesLeadRestricted = ['contact.delete', 'campaign.delete', 'team.delete'];
        const salesLeadPerms = allPermissions.filter(p =>
            salesLeadCategories.includes(p.category) && !salesLeadRestricted.includes(p.name)
        );
        await salesLead.setPermissions(salesLeadPerms);
        console.log(`✓ Sales Lead assigned ${salesLeadPerms.length} permissions`);

        // Sales Agent: Limited to assigned contacts and campaigns
        const salesAgent = await Role.findOne({ where: { name: 'sales_agent' } });
        const salesAgentPermNames = [
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
        ];
        const salesAgentPerms = allPermissions.filter(p => salesAgentPermNames.includes(p.name));
        await salesAgent.setPermissions(salesAgentPerms);
        console.log(`✓ Sales Agent assigned ${salesAgentPerms.length} permissions`);

        // Teammate: Support-focused permissions
        const teammate = await Role.findOne({ where: { name: 'teammate' } });
        const teammatePermNames = [
            'contact.view_assigned',
            'contact.view_phone',
            'contact.view_fields',
            'inbox.view_assigned',
            'inbox.close',
            'template.view',
            'automation.view_workflows'
        ];
        const teammatePerms = allPermissions.filter(p => teammatePermNames.includes(p.name));
        await teammate.setPermissions(teammatePerms);
        console.log(`✓ Teammate assigned ${teammatePerms.length} permissions`);

        console.log('🎉 RBAC seeding completed successfully!');

    } catch (error) {
        console.error('❌ Error seeding RBAC:', error);
        throw error;
    }
}

// Run the seeder if called directly
if (require.main === module) {
    seedRBAC()
        .then(() => {
            console.log('Seeding complete. Exiting...');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Seeding failed:', error);
            process.exit(1);
        });
}

module.exports = { seedRBAC };
