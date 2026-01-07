const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
    const User = sequelize.define('User', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        username: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true,
            comment: 'Username for login'
        },
        email: {
            type: DataTypes.STRING(255),
            allowNull: true,
            unique: true,
            validate: {
                isEmail: true
            }
        },
        passwordHash: {
            type: DataTypes.STRING(255),
            allowNull: false,
            field: 'password_hash'
        },
        name: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        isSuperAdmin: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            field: 'is_super_admin',
            comment: 'Superadmin has all permissions'
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            field: 'is_active'
        },
        apiKey: {
            type: DataTypes.STRING(255),
            allowNull: true,
            field: 'api_key'
        },
        refreshToken: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'refresh_token'
        }
    }, {
        tableName: 'users',
        timestamps: true,
        underscored: true
    });

    // Instance method to check password
    User.prototype.checkPassword = async function (password) {
        return bcrypt.compare(password, this.passwordHash);
    };

    // Static method to hash password
    User.hashPassword = async function (password) {
        const salt = await bcrypt.genSalt(10);
        return bcrypt.hash(password, salt);
    };

    // Static method to generate API key
    User.generateApiKey = function () {
        return `vyc_${uuidv4().replace(/-/g, '')}`;
    };

    // Static method to create superadmin user
    User.createSuperAdmin = async function () {
        const existingSuperAdmin = await User.findOne({ where: { username: 'superadmin' } });
        if (!existingSuperAdmin) {
            const passwordHash = await User.hashPassword('superadmin123');
            await User.create({
                username: 'superadmin',
                email: 'superadmin@vy.com',
                name: 'Super Admin',
                passwordHash,
                isSuperAdmin: true,
                isActive: true,
                apiKey: User.generateApiKey()
            });
            console.log('✓ Superadmin created: superadmin / superadmin123');
        }
    };

    return User;
};
