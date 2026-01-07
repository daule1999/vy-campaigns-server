/**
 * User Repository - MySQL only (Updated for RBAC)
 */
class UserRepository {
    getModel() {
        const { User, Group, Permission } = require('../models/sequelize');
        return { User, Group, Permission };
    }

    async findById(id, options = {}) {
        const { User, Group, Permission } = this.getModel();
        const include = [];

        if (options.includeGroups) {
            include.push({
                model: Group,
                as: 'groups',
                include: options.includePermissions ? [{ model: Permission, as: 'permissions' }] : []
            });
        }

        const user = await User.findByPk(id, { include });
        return user ? this._format(user, options.includePermissions) : null;
    }

    async findOne(filter, options = {}) {
        const { User, Group, Permission } = this.getModel();
        const include = [];

        if (options.includeGroups) {
            include.push({
                model: Group,
                as: 'groups',
                include: options.includePermissions ? [{ model: Permission, as: 'permissions' }] : []
            });
        }

        const user = await User.findOne({ where: filter, include });
        return user ? this._format(user, options.includePermissions) : null;
    }

    async findByApiKey(apiKey) {
        return this.findOne({ apiKey });
    }

    async findByEmail(email) {
        return this.findOne({ email });
    }

    async findByUsername(username, options = {}) {
        return this.findOne({ username }, options);
    }

    async findAll(filter = {}, options = {}) {
        const { User, Group } = this.getModel();
        const include = [];

        if (options.includeGroups) {
            include.push({ model: Group, as: 'groups' });
        }

        const { rows, count } = await User.findAndCountAll({
            where: filter,
            include,
            limit: options.limit || 50,
            offset: options.skip || 0,
            order: [['createdAt', 'DESC']]
        });
        return { rows: rows.map(u => this._format(u)), count };
    }

    async findByIdRaw(id) {
        const { User } = this.getModel();
        return await User.findByPk(id);
    }

    async findOneRaw(filter) {
        const { User } = this.getModel();
        return await User.findOne({ where: filter });
    }

    async count(filter = {}) {
        const { User } = this.getModel();
        return await User.count({ where: filter });
    }

    async create(data) {
        const { User } = this.getModel();
        const user = await User.create(data);
        return this._format(user);
    }

    async updateById(id, data) {
        const { User } = this.getModel();
        await User.update(data, { where: { id } });
        return true;
    }

    async hashPassword(password) {
        const { User } = this.getModel();
        return await User.hashPassword(password);
    }

    async createSuperAdmin() {
        const { User } = this.getModel();
        return await User.createSuperAdmin();
    }

    async generateApiKey() {
        const { User } = this.getModel();
        return User.generateApiKey();
    }

    /**
     * Get all permissions for a user (aggregated from all groups)
     */
    async getUserPermissions(userId) {
        const { User, Group, Permission } = this.getModel();
        const user = await User.findByPk(userId, {
            include: [{
                model: Group,
                as: 'groups',
                include: [{ model: Permission, as: 'permissions' }]
            }]
        });

        if (!user) return [];

        // If superadmin, return special flag
        if (user.isSuperAdmin) {
            return ['*']; // Represents all permissions
        }

        // Aggregate permissions from all groups
        const permissionSet = new Set();
        const groups = user.groups || [];

        for (const group of groups) {
            const permissions = group.permissions || [];
            for (const perm of permissions) {
                permissionSet.add(perm.name);
            }
        }

        return Array.from(permissionSet);
    }

    /**
     * Check if user has a specific permission
     */
    async hasPermission(userId, permissionName) {
        const permissions = await this.getUserPermissions(userId);
        return permissions.includes('*') || permissions.includes(permissionName);
    }

    /**
     * Set user's groups (replaces existing groups)
     */
    async setUserGroups(userId, groupIds) {
        const { User, Group } = this.getModel();
        const user = await User.findByPk(userId);
        if (!user) throw new Error('User not found');

        const groups = await Group.findAll({ where: { id: groupIds } });
        await user.setGroups(groups);
        return true;
    }


    /**
     * Get user's effective hierarchy level (lowest level number = highest rank)
     * SuperAdmin returns 0 (highest), users with no groups return 999 (lowest)
     */
    async getUserLevel(userId) {
        const { User, Group } = this.getModel();
        const user = await User.findByPk(userId, {
            include: [{ model: Group, as: 'groups' }]
        });

        if (!user) return 999;
        if (user.isSuperAdmin) return 0; // Superadmin is above all

        const groups = user.groups || [];
        if (groups.length === 0) return 999; // No groups = lowest rank

        // Return the lowest level number (highest rank)
        return Math.min(...groups.map(g => g.level || 10));
    }

    /**
     * Get users that can be managed by the given user (based on hierarchy)
     */
    async getManagedUsers(managerId, options = {}) {
        const managerLevel = await this.getUserLevel(managerId);
        const { User, Group } = this.getModel();

        // SuperAdmin (level 0) can see all users
        if (managerLevel === 0) {
            return this.findAll({}, options);
        }

        // Get all users with their groups and filter by level
        const { rows: allUsers, count } = await User.findAndCountAll({
            include: [{ model: Group, as: 'groups' }],
            limit: options.limit || 100,
            offset: options.skip || 0,
            order: [['createdAt', 'DESC']]
        });

        // Filter to only users with level > managerLevel (lower rank)
        const managedUsers = allUsers.filter(user => {
            if (user.isSuperAdmin) return false; // Can never manage superadmin
            const userGroups = user.groups || [];
            if (userGroups.length === 0) return true; // Users with no groups can be managed
            const userLevel = Math.min(...userGroups.map(g => g.level || 10));
            return userLevel > managerLevel;
        });

        return {
            rows: managedUsers.map(u => this._format(u)),
            count: managedUsers.length
        };
    }

    /**
     * Add user to groups
     */
    async addToGroups(userId, groupIds) {
        const { User, Group } = this.getModel();
        const user = await User.findByPk(userId);
        if (!user) throw new Error('User not found');

        const groups = await Group.findAll({ where: { id: groupIds } });
        await user.addGroups(groups);
        return await this.findById(userId, { includeGroups: true });
    }

    /**
     * Remove user from a group
     */
    async removeFromGroup(userId, groupId) {
        const { User, Group } = this.getModel();
        const user = await User.findByPk(userId);
        if (!user) throw new Error('User not found');

        const group = await Group.findByPk(groupId);
        if (group) {
            await user.removeGroup(group);
        }
        return await this.findById(userId, { includeGroups: true });
    }

    /**
     * Set user's groups (replace all)
     */
    async setGroups(userId, groupIds) {
        const { User, Group } = this.getModel();
        const user = await User.findByPk(userId);
        if (!user) throw new Error('User not found');

        const groups = await Group.findAll({ where: { id: groupIds } });
        await user.setGroups(groups);
        return await this.findById(userId, { includeGroups: true });
    }

    /**
     * Get user's group IDs for workqueue filtering
     */
    async getUserGroupIds(userId) {
        const { User, Group } = this.getModel();
        const user = await User.findByPk(userId, {
            include: [{ model: Group, as: 'groups', attributes: ['id'] }]
        });

        if (!user || !user.groups) return [];
        return user.groups.map(g => g.id);
    }

    /**
     * Get members of a specific group
     */
    async getGroupMembers(groupId) {
        const { User, Group } = this.getModel();
        const group = await Group.findByPk(groupId, {
            include: [{
                model: User,
                as: 'users',
                attributes: ['id', 'username', 'name', 'email', 'isActive'],
                where: { isActive: true }
            }]
        });

        return group ? group.users : [];
    }

    _format(user, includePermissions = false) {
        if (!user) return null;
        const obj = user.toJSON ? user.toJSON() : user;

        // Collect all permissions from groups
        let permissions = [];
        if (includePermissions && obj.groups) {
            for (const group of obj.groups) {
                if (group.permissions) {
                    permissions = permissions.concat(group.permissions.map(p => p.name));
                }
            }
            permissions = [...new Set(permissions)]; // Unique
        }

        return {
            id: obj.id,
            username: obj.username,
            email: obj.email,
            passwordHash: obj.passwordHash,
            name: obj.name,
            isSuperAdmin: obj.isSuperAdmin,
            isActive: obj.isActive,
            apiKey: obj.apiKey,
            refreshToken: obj.refreshToken,
            groups: obj.groups || [],
            permissions: obj.isSuperAdmin ? ['*'] : permissions,
            createdAt: obj.createdAt,
            updatedAt: obj.updatedAt,
            _raw: user
        };
    }
}

module.exports = new UserRepository();
