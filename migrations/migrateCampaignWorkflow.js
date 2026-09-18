import { createRequire } from "node:module";
import { Sequelize, DataTypes } from "sequelize";
import sequelize from "../config/database.js";

// Targeted runner avoids executing legacy CommonJS .js migrations under type:module.
const migrationName = "20260918000000-campaign-workflow.cjs";
const migration = createRequire(import.meta.url)(
  `./${migrationName}`,
);
const meta = sequelize.define(
  "SequelizeMeta",
  { name: { type: DataTypes.STRING, primaryKey: true } },
  { tableName: "SequelizeMeta", timestamps: false },
);
try {
  await sequelize.authenticate();
  await meta.sync();
  await sequelize.transaction(async (transaction) => {
    await sequelize.query("SELECT pg_advisory_xact_lock(20260918)", {
      transaction,
    });
    if (await meta.findByPk(migrationName, { transaction }))
      console.log("Campaign workflow migration is already applied.");
    else {
      await migration.up(sequelize.getQueryInterface(), Sequelize, transaction);
      await meta.create({ name: migrationName }, { transaction });
      console.log("Campaign workflow migration applied.");
    }
  });
} catch (error) {
  console.error("Campaign workflow migration failed:", error.message);
  process.exitCode = 1;
} finally {
  await sequelize.close();
}
