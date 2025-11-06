const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const CampaignMetadata = sequelize.define('CampaignMetadata', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  campaignId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Reference to blockchain campaign ID (source of truth)'
  },
  
  // === MEDIA (Not on blockchain - too expensive) ===
  imageUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Campaign banner image URL'
  },
  galleryImages: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'Array of additional image URLs'
  },
  videoUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'YouTube or video URL'
  },
  
  // === EXTENDED CONTENT (Too large for blockchain) ===
  detailedDescription: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Extended description beyond blockchain description'
  },
  story: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Full campaign story/narrative'
  },
  impactStatement: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Expected impact and outcomes'
  },
  
  // === CATEGORIZATION (For search/filter) ===
  category: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Health, Education, Environment, Animals, Emergency, etc.'
  },
  tags: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'Searchable tags array'
  },
  
  // === LOCATION (Not on blockchain) ===
  location: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'City/region'
  },
  country: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Country code (US, UK, IN, etc.)'
  },
  
  // === CONTACT & LINKS (Not on blockchain) ===
  websiteUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  contactEmail: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Public contact email'
  },
  socialMedia: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {},
    comment: 'Social links: {twitter, facebook, instagram, linkedin}'
  },
  
  // === CAMPAIGN UPDATES (Mutable content) ===
  updates: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'Campaign updates: [{date, title, message}]'
  },
  
  // === STRETCH GOALS (Optional, not on blockchain) ===
  milestones: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'Stretch goals: [{amount, description, reached}]'
  },
  
  // === FAQ (Not on blockchain) ===
  faqs: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'FAQs: [{question, answer}]'
  },
  
  // === VERIFICATION (Platform-specific) ===
  verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Verified by platform admins'
  },
  verificationDocuments: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'Document URLs for verification'
  },
  
  // === ANALYTICS (Off-chain metrics) ===
  viewCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Page views count'
  },
  shareCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Social shares count'
  }
  
  // === REMOVED FIELDS (Use blockchain instead): ===
  // ❌ title - Get from blockchain
  // ❌ shortDescription - Get from blockchain  
  // ❌ creator - Get from blockchain
  // ❌ beneficiary - Get from blockchain
  // ❌ goal - Get from blockchain
  // ❌ deadline - Get from blockchain
  // ❌ totalRaised - Get from blockchain
  // ❌ finalized - Get from blockchain
  
}, {
  tableName: 'campaign_metadata',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['campaignId']
    },
    {
      fields: ['category']
    },
    {
      fields: ['country']
    },
    {
      fields: ['verified']
    }
  ]
});

module.exports = CampaignMetadata;
