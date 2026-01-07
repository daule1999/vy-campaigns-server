const userRepository = require('./UserRepository');
const templateRepository = require('./TemplateRepository');
const contactRepository = require('./ContactRepository');
const personRepository = require('./PersonRepository');
const campaignRepository = require('./CampaignRepository');
const campaignContactRepository = require('./CampaignContactRepository');
const auditLogRepository = require('./AuditLogRepository');
const autoresponderRepository = require('./AutoresponderRepository');
const permissionRepository = require('./PermissionRepository');
const groupRepository = require('./GroupRepository');
const productRepository = require('./ProductRepository');
const applicationRepository = require('./ApplicationRepository');

module.exports = {
    userRepository,
    templateRepository,
    contactRepository,
    personRepository,
    campaignRepository,
    campaignContactRepository,
    auditLogRepository,
    errorLogRepository: require('./ErrorLogRepository'),
    autoresponderRepository,
    permissionRepository,
    groupRepository,
    productRepository,
    applicationRepository,
};

