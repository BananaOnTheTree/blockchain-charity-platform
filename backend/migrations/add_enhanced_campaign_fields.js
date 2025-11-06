const { Sequelize } = require('sequelize');
const sequelize = require('../config/sequelize');

async function migrate() {
  const queryInterface = sequelize.getQueryInterface();

  console.log('🔄 Starting migration: Adding enhanced campaign metadata fields...');

  try {
    // Add new columns
    await queryInterface.addColumn('campaign_metadata', 'title', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'Campaign title (synced from blockchain)'
    });

    await queryInterface.addColumn('campaign_metadata', 'shortDescription', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'Short description (synced from blockchain)'
    });

    await queryInterface.addColumn('campaign_metadata', 'creator', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'Creator wallet address'
    });

    await queryInterface.addColumn('campaign_metadata', 'beneficiary', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'Beneficiary wallet address'
    });

    await queryInterface.addColumn('campaign_metadata', 'videoUrl', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'YouTube or video URL'
    });

    await queryInterface.addColumn('campaign_metadata', 'tags', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: [],
      comment: 'Array of tags for better search'
    });

    await queryInterface.addColumn('campaign_metadata', 'country', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'Country code (e.g., US, UK, IN)'
    });

    await queryInterface.addColumn('campaign_metadata', 'story', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'Full campaign story/narrative'
    });

    await queryInterface.addColumn('campaign_metadata', 'impactStatement', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'Expected impact and outcomes'
    });

    await queryInterface.addColumn('campaign_metadata', 'contactEmail', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'Public contact email'
    });

    await queryInterface.addColumn('campaign_metadata', 'milestones', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: [],
      comment: 'Campaign milestones/goals at different funding levels'
    });

    await queryInterface.addColumn('campaign_metadata', 'faqs', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: [],
      comment: 'Frequently asked questions'
    });

    await queryInterface.addColumn('campaign_metadata', 'verified', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      comment: 'Campaign verified by platform admins'
    });

    await queryInterface.addColumn('campaign_metadata', 'verificationDocuments', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: [],
      comment: 'URLs to verification documents'
    });

    await queryInterface.addColumn('campaign_metadata', 'viewCount', {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      comment: 'Number of times campaign page was viewed'
    });

    await queryInterface.addColumn('campaign_metadata', 'shareCount', {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      comment: 'Number of times campaign was shared'
    });

    // Add indexes for better query performance
    await queryInterface.addIndex('campaign_metadata', ['category'], {
      name: 'campaign_metadata_category_idx'
    });

    await queryInterface.addIndex('campaign_metadata', ['country'], {
      name: 'campaign_metadata_country_idx'
    });

    await queryInterface.addIndex('campaign_metadata', ['verified'], {
      name: 'campaign_metadata_verified_idx'
    });

    await queryInterface.addIndex('campaign_metadata', ['creator'], {
      name: 'campaign_metadata_creator_idx'
    });

    console.log('✅ Migration completed successfully!');
    console.log('📊 Enhanced campaign metadata schema is ready.');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run migration
if (require.main === module) {
  migrate()
    .then(() => {
      console.log('Migration finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration error:', error);
      process.exit(1);
    });
}

module.exports = migrate;
