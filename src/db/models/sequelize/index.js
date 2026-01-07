const { Sequelize } = require('sequelize');
const config = require('../../../config');

// Create Sequelize instance
const sequelize = new Sequelize(
    config.database.mysql.name,
    config.database.mysql.user,
    config.database.mysql.password,
    {
        host: config.database.mysql.host,
        port: config.database.mysql.port,
        dialect: 'mysql',
        logging: false,
        pool: {
            max: 10,
            min: 0,
            acquire: 30000,
            idle: 10000
        },
        define: {
            timestamps: true,
            underscored: true,
        },
        // SSL required for TiDB Serverless / PlanetScale / cloud MySQL
        dialectOptions: {
            ssl: {
                minVersion: 'TLSv1.2',
                rejectUnauthorized: true
            }
        }
    }
);

// Initialize models
const User = require('./User')(sequelize);
const Template = require('./Template')(sequelize);
const Contact = require('./Contact')(sequelize);
const Person = require('./Person')(sequelize);
const Campaign = require('./Campaign')(sequelize);
const CampaignContact = require('./CampaignContact')(sequelize);
const AuditLog = require('./AuditLog')(sequelize);
const ErrorLog = require('./ErrorLog')(sequelize);
const Autoresponder = require('./Autoresponder')(sequelize);

// RBAC Models
const Permission = require('./Permission')(sequelize);
const Group = require('./Group')(sequelize);
const GroupPermission = require('./GroupPermission')(sequelize);
const UserGroup = require('./UserGroup')(sequelize);

// Workflow Models
const CampaignProduct = require('./CampaignProduct')(sequelize);
const ProductWorkflow = require('./ProductWorkflow')(sequelize);
const WorkflowStep = require('./WorkflowStep')(sequelize);
const Application = require('./Application')(sequelize);
const StepExecution = require('./StepExecution')(sequelize);

// Define associations - Existing
User.hasMany(Template, { foreignKey: 'createdBy', as: 'templates' });
User.hasMany(Campaign, { foreignKey: 'createdBy', as: 'campaigns' });
User.hasMany(Autoresponder, { foreignKey: 'createdBy', as: 'autoresponders' });

Template.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
Template.hasMany(Campaign, { foreignKey: 'templateId', as: 'campaigns' });

Campaign.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
Campaign.belongsTo(Template, { foreignKey: 'templateId', as: 'template' });
Campaign.belongsToMany(Person, {
    through: CampaignContact,
    foreignKey: 'campaignId',
    otherKey: 'contactId',
    as: 'contacts' // Keeping alias 'contacts' for backward compatibility in API response
});

Person.belongsToMany(Campaign, {
    through: CampaignContact,
    foreignKey: 'contactId',
    otherKey: 'campaignId',
    as: 'campaigns'
});

CampaignContact.belongsTo(Campaign, { foreignKey: 'campaignId' });
CampaignContact.belongsTo(Person, { foreignKey: 'contactId' });

Autoresponder.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

// RBAC Associations
// User <-> Group (many-to-many)
User.belongsToMany(Group, {
    through: UserGroup,
    foreignKey: 'userId',
    otherKey: 'groupId',
    as: 'groups'
});

Group.belongsToMany(User, {
    through: UserGroup,
    foreignKey: 'groupId',
    otherKey: 'userId',
    as: 'users'
});

// Group <-> Permission (many-to-many)
Group.belongsToMany(Permission, {
    through: GroupPermission,
    foreignKey: 'groupId',
    otherKey: 'permissionId',
    as: 'permissions'
});

Permission.belongsToMany(Group, {
    through: GroupPermission,
    foreignKey: 'permissionId',
    otherKey: 'groupId',
    as: 'groups'
});

// Direct access to join tables
UserGroup.belongsTo(User, { foreignKey: 'userId' });
UserGroup.belongsTo(Group, { foreignKey: 'groupId' });
GroupPermission.belongsTo(Group, { foreignKey: 'groupId' });
GroupPermission.belongsTo(Permission, { foreignKey: 'permissionId' });

// Workflow Associations
// CampaignProduct -> ProductWorkflow (one-to-one for simplicity, can have many)
CampaignProduct.hasOne(ProductWorkflow, { foreignKey: 'productId', as: 'workflow' });
ProductWorkflow.belongsTo(CampaignProduct, { foreignKey: 'productId', as: 'product' });

// ProductWorkflow -> WorkflowSteps (one-to-many)
ProductWorkflow.hasMany(WorkflowStep, { foreignKey: 'workflowId', as: 'steps' });
WorkflowStep.belongsTo(ProductWorkflow, { foreignKey: 'workflowId', as: 'workflow' });

// WorkflowStep -> Group (step assigned to group)
WorkflowStep.belongsTo(Group, { foreignKey: 'assignedGroupId', as: 'assignedGroup' });

// CampaignProduct -> Applications (one-to-many)
CampaignProduct.hasMany(Application, { foreignKey: 'productId', as: 'applications' });
Application.belongsTo(CampaignProduct, { foreignKey: 'productId', as: 'product' });

// Person -> Applications (one-to-many)
Person.hasMany(Application, { foreignKey: 'personId', as: 'applications' });
Application.belongsTo(Person, { foreignKey: 'personId', as: 'person' });

// Application -> WorkflowStep (current step)
Application.belongsTo(WorkflowStep, { foreignKey: 'currentStepId', as: 'currentStep' });

// Application -> User (created by)
Application.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

// Application -> StepExecutions (one-to-many)
Application.hasMany(StepExecution, { foreignKey: 'applicationId', as: 'stepExecutions' });
StepExecution.belongsTo(Application, { foreignKey: 'applicationId', as: 'application' });

// StepExecution -> WorkflowStep
StepExecution.belongsTo(WorkflowStep, { foreignKey: 'stepId', as: 'step' });

// StepExecution -> User (assigned agent)
StepExecution.belongsTo(User, { foreignKey: 'assignedTo', as: 'agent' });

module.exports = {
    sequelize,
    User,
    Template,
    Contact,
    Person,
    Campaign,
    CampaignContact,
    AuditLog,
    ErrorLog,
    Autoresponder,
    // RBAC exports
    Permission,
    Group,
    GroupPermission,
    UserGroup,
    // Workflow exports
    CampaignProduct,
    ProductWorkflow,
    WorkflowStep,
    Application,
    StepExecution,
};

