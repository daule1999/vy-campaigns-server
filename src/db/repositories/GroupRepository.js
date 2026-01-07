/**
 * Group Repository
 */
class GroupRepository {
    getModel() {
        const { Group, Permission, User, GroupPermission, UserGroup } = require('../models/sequelize');
        return { Group, Permission, User, GroupPermission, UserGroup };
    }

    async findById(id, options = {}) {
        const { Group, Permission, User } = this.getModel();
        const include = [];

        if (options.includePermissions) {
            include.push({ model: Permission, as: 'permissions' });
        }
        if (options.includeUsers) {
            include.push({
                model: User,
                as: 'users',
                attributes: ['id', 'username', 'name', 'email', 'isActive']
            });
        }

        const group = await Group.findByPk(id, { include });
        return group ? this._format(group) : null;
    }

    async findByName(name) {
        const { Group } = this.getModel();
        const group = await Group.findOne({ where: { name } });
        return group ? this._format(group) : null;
    }

    async findAll(filter = {}, options = {}) {
        const { Group, Permission, User } = this.getModel();
        const include = [];

        if (options.includePermissions) {
            include.push({ model: Permission, as: 'permissions' });
        }
        if (options.includeUsers) {
            include.push({
                model: User,
                as: 'users',
                attributes: ['id', 'username', 'name', 'email', 'isActive']
            });
        }

        const { rows, count } = await Group.findAndCountAll({
            where: filter,
            include,
            limit: options.limit || 50,
            offset: options.skip || 0,
            order: [['name', 'ASC']]
        });
        return { rows: rows.map(g => this._format(g)), count };
    }

    async create(data) {
        const { Group } = this.getModel();
        const group = await Group.create(data);
        return this._format(group);
    }

    async updateById(id, data) {
        const { Group } = this.getModel();
        await Group.update(data, { where: { id } });
        return await this.findById(id);
    }

    async deleteById(id) {
        const { Group } = this.getModel();
        const deleted = await Group.destroy({ where: { id } });
        return deleted > 0;
    }

    async count(filter = {}) {
        const { Group } = this.getModel();
        return await Group.count({ where: filter });
    }

    /**
     * Assign permissions to a group
     */
    async addPermissions(groupId, permissionIds) {
        const { Group, Permission } = this.getModel();
        const group = await Group.findByPk(groupId);
        if (!group) throw new Error('Group not found');

        const permissions = await Permission.findAll({
            where: { id: permissionIds }
        });

        await group.addPermissions(permissions);
        return await this.findById(groupId, { includePermissions: true });
    }

    /**
     * Remove a permission from a group
     */
    async removePermission(groupId, permissionId) {
        const { GroupPermission } = this.getModel();
        const deleted = await GroupPermission.destroy({
            where: { groupId, permissionId }
        });
        return deleted > 0;
    }

    /**
     * Set permissions (replace all)
     */
    async setPermissions(groupId, permissionIds) {
        const { Group, Permission } = this.getModel();
        const group = await Group.findByPk(groupId);
        if (!group) throw new Error('Group not found');

        const permissions = await Permission.findAll({
            where: { id: permissionIds }
        });

        await group.setPermissions(permissions);
        return await this.findById(groupId, { includePermissions: true });
    }

    /**
     * Add users to a group
     */
    async addUsers(groupId, userIds) {
        const { Group, User } = this.getModel();
        const group = await Group.findByPk(groupId);
        if (!group) throw new Error('Group not found');

        const users = await User.findAll({ where: { id: userIds } });
        await group.addUsers(users);
        return await this.findById(groupId, { includeUsers: true });
    }

    /**
     * Remove a user from a group
     */
    async removeUser(groupId, userId) {
        const { UserGroup } = this.getModel();
        const deleted = await UserGroup.destroy({
            where: { groupId, userId }
        });
        return deleted > 0;
    }

    _format(group) {
        const obj = group.toJSON();
        return {
            id: obj.id,
            name: obj.name,
            description: obj.description,
            permissions: obj.permissions || [],
            users: obj.users || [],
            createdAt: obj.createdAt,
            updatedAt: obj.updatedAt
        };
    }
}

module.exports = new GroupRepository();
