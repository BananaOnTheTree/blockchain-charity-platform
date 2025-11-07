/**
 * Migration: Allow NULL for campaignId field
 * This is required for the new flow where database records are created BEFORE blockchain campaigns
 */

const { Sequelize } = require('sequelize');
const sequelize = require('../config/sequelize');

async function migrate() {
  try {
    console.log('🔄 Starting migration: Allow NULL for campaignId...');

    // Alter the column to allow NULL
    await sequelize.query(`
      ALTER TABLE campaign_metadata 
      ALTER COLUMN "campaignId" DROP NOT NULL;
    `);

    console.log('✅ Migration completed successfully!');
    console.log('   - campaignId column now allows NULL values');
    console.log('   - This enables database-first campaign creation flow');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
