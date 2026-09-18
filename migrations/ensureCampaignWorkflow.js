import { createRequire } from "node:module";
import { Sequelize, DataTypes } from "sequelize";

const migrationName = "20260918000000-campaign-workflow.cjs";
const migration = createRequire(import.meta.url)(`./${migrationName}`);

// Share the same migration history for CLI runs and every server entry point.
export const ensureCampaignWorkflow = async (sequelize) => {
  const meta = sequelize.models.SequelizeMeta || sequelize.define(
    "SequelizeMeta",
    { name: { type: DataTypes.STRING, primaryKey: true } },
    { tableName: "SequelizeMeta", timestamps: false },
  );

  await sequelize.transaction(async (transaction) => {
    // Serialize startup across processes, including creation of the history table.
    await sequelize.query("SELECT pg_advisory_xact_lock(20260918)", {
      transaction,
    });
    await meta.sync({ transaction });
    if (await meta.findByPk(migrationName, { transaction })) {
      console.log("Campaign workflow migration is already applied.");
      return;
    }

    await migration.up(sequelize.getQueryInterface(), Sequelize, transaction);
    await meta.create({ name: migrationName }, { transaction });
  });
};
