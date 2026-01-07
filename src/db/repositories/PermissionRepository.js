/**
 * Permission Repository
 */

// Default permissions to seed
const DEFAULT_PERMISSIONS = [
    { name: 'dashboard:view', feature: 'dashboard', description: 'View dashboard' },
    { name: 'campaigns:read', feature: 'campaigns', description: 'View campaigns' },
    { name: 'campaigns:write', feature: 'campaigns', description: 'Create/edit campaigns' },
    { name: 'campaigns:delete', feature: 'campaigns', description: 'Delete campaigns' },
    { name: 'campaigns:send', feature: 'campaigns', description: 'Send campaigns' },
    { name: 'templates:read', feature: 'templates', description: 'View templates' },
    { name: 'templates:write', feature: 'templates', description: 'Create/edit templates' },
    { name: 'templates:delete', feature: 'templates', description: 'Delete templates' },
    { name: 'persons:read', feature: 'persons', description: 'View contacts' },
    { name: 'persons:write', feature: 'persons', description: 'Create/edit contacts' },
    { name: 'persons:delete', feature: 'persons', description: 'Delete contacts' },
    { name: 'audit:read', feature: 'audit', description: 'View audit logs' },
    { name: 'admin:users', feature: 'admin', description: 'Manage users' },
    { name: 'admin:groups', feature: 'admin', description: 'Manage groups' },
    { name: 'rbac:read', feature: 'rbac', description: 'View groups/permissions' },
    { name: 'rbac:write', feature: 'rbac', description: 'Manage groups/permissions' },
    { name: 'autoresponders:read', feature: 'autoresponders', description: 'View autoresponders' },
    { name: 'autoresponders:write', feature: 'autoresponders', description: 'Manage autoresponders' },
    // Workflow System Permissions
    { name: 'products:read', feature: 'products', description: 'View campaign products' },
    { name: 'products:write', feature: 'products', description: 'Create/edit campaign products' },
    { name: 'products:delete', feature: 'products', description: 'Delete campaign products' },
    { name: 'applications:read', feature: 'applications', description: 'View applications' },
    { name: 'applications:write', feature: 'applications', description: 'Create/edit applications' },
    { name: 'applications:import', feature: 'applications', description: 'Import applications from CSV' },
    { name: 'workqueue:access', feature: 'workqueue', description: 'Access agent workqueue' },
    { name: 'workqueue:claim', feature: 'workqueue', description: 'Claim/release applications' },
];

class PermissionRepository {
    getModel() {
        const { Permission } = require('../models/sequelize');
        return Permission;
    }

    async findById(id) {
        const Permission = this.getModel();
        const permission = await Permission.findByPk(id);
        return permission ? permission.toJSON() : null;
    }

    async findByName(name) {
        const Permission = this.getModel();
        const permission = await Permission.findOne({ where: { name } });
        return permission ? permission.toJSON() : null;
    }

    async findAll(filter = {}, options = {}) {
        const Permission = this.getModel();
        const { rows, count } = await Permission.findAndCountAll({
            where: filter,
            limit: options.limit || 100,
            offset: options.skip || 0,
            order: [['feature', 'ASC'], ['name', 'ASC']]
        });
        return { rows: rows.map(p => p.toJSON()), count };
    }

    async findByFeature(feature) {
        const Permission = this.getModel();
        const permissions = await Permission.findAll({ where: { feature } });
        return permissions.map(p => p.toJSON());
    }

    async create(data) {
        const Permission = this.getModel();
        const permission = await Permission.create(data);
        return permission.toJSON();
    }

    async updateById(id, data) {
        const Permission = this.getModel();
        await Permission.update(data, { where: { id } });
        return await this.findById(id);
    }

    async deleteById(id) {
        const Permission = this.getModel();
        const deleted = await Permission.destroy({ where: { id } });
        return deleted > 0;
    }

    async count(filter = {}) {
        const Permission = this.getModel();
        return await Permission.count({ where: filter });
    }

    /**
     * Seed default permissions if they don't exist
     */
    async seedDefaults() {
        const Permission = this.getModel();
        let created = 0;

        for (const perm of DEFAULT_PERMISSIONS) {
            const existing = await Permission.findOne({ where: { name: perm.name } });
            if (!existing) {
                await Permission.create(perm);
                created++;
            }
        }

        if (created > 0) {
            console.log(`✓ Seeded ${created} default permissions`);
        }

        return created;
    }
}

module.exports = new PermissionRepository();
