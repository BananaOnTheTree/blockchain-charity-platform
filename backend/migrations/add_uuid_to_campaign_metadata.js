/**
 * Migration: Add `uuid` column to campaign_metadata and populate existing rows
 * - Adds `uuid` (UUID) column
 * - Populates existing rows with random UUIDs
 * - Sets column to NOT NULL
 *
 * Run: `node migrations/add_uuid_to_campaign_metadata.js`
 */

const { Sequelize } = require('sequelize');
const sequelize = require('../config/sequelize');
const crypto = require('crypto');

async function migrate() {
  try {
    console.log('🔄 Starting migration: add uuid to campaign_metadata...');

    // Add column if it doesn't exist
    await sequelize.query(`ALTER TABLE IF EXISTS campaign_metadata ADD COLUMN IF NOT EXISTS "uuid" UUID;`);

    // Fetch rows that have NULL uuid and populate them
    const [rows] = await sequelize.query(`SELECT id FROM campaign_metadata WHERE "uuid" IS NULL;`);

    console.log(`Found ${rows.length} row(s) without uuid`);

    for (const r of rows) {
      const newUuid = crypto.randomUUID();
      await sequelize.query(`UPDATE campaign_metadata SET "uuid" = :uuid WHERE id = :id;`, {
        replacements: { uuid: newUuid, id: r.id }
      });
      console.log(`  - Set uuid for id=${r.id} -> ${newUuid}`);
    }

    // Make column NOT NULL
    await sequelize.query(`ALTER TABLE campaign_metadata ALTER COLUMN "uuid" SET NOT NULL;`);

    // Add unique index for uuid
    await sequelize.query(`CREATE UNIQUE INDEX IF NOT EXISTS campaign_metadata_uuid_idx ON campaign_metadata (uuid);`);

    console.log('✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
