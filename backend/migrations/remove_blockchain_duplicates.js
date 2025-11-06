const sequelize = require('../config/sequelize');

async function migrate() {
  const queryInterface = sequelize.getQueryInterface();

  console.log('🔄 Removing duplicate blockchain data from database...');
  console.log('📋 These fields will be fetched from blockchain instead:\n');
  console.log('   - title');
  console.log('   - shortDescription');
  console.log('   - creator');
  console.log('   - beneficiary\n');

  try {
    // Remove columns that duplicate blockchain data
    await queryInterface.removeColumn('campaign_metadata', 'title');
    console.log('✅ Removed: title');

    await queryInterface.removeColumn('campaign_metadata', 'shortDescription');
    console.log('✅ Removed: shortDescription');

    await queryInterface.removeColumn('campaign_metadata', 'creator');
    console.log('✅ Removed: creator');

    await queryInterface.removeColumn('campaign_metadata', 'beneficiary');
    console.log('✅ Removed: beneficiary');

    // Remove creator index if it exists
    try {
      await queryInterface.removeIndex('campaign_metadata', 'campaign_metadata_creator_idx');
      console.log('✅ Removed: creator index');
    } catch (err) {
      // Index might not exist, ignore
    }

    console.log('\n✨ Migration completed successfully!');
    console.log('📊 Database now stores only complementary data.');
    console.log('🔗 Blockchain is the single source of truth for core campaign data.');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run migration
if (require.main === module) {
  migrate()
    .then(() => {
      console.log('\n🎉 Database refactored - no more duplication!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration error:', error);
      process.exit(1);
    });
}

module.exports = migrate;
