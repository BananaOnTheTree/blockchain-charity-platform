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
    comment: 'Blockchain campaign ID'
  },
  imageUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Campaign banner image URL (primary)'
  },
  galleryImages: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'Array of additional campaign images'
  },
  category: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Campaign category (e.g., Health, Education, Environment)'
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Campaign location/region'
  },
  detailedDescription: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Extended description with formatting'
  },
  websiteUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  socialMedia: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {},
    comment: 'Social media links (Twitter, Facebook, etc.)'
  },
  updates: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'Campaign updates array'
  }
}, {
  tableName: 'campaign_metadata',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['campaignId']
    }
  ]
});

module.exports = CampaignMetadata;
