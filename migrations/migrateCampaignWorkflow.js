import sequelize from "../config/database.js";
import { ensureCampaignWorkflow } from "./ensureCampaignWorkflow.js";

// Targeted runner avoids executing legacy CommonJS .js migrations under type:module.
try {
  await sequelize.authenticate();
  await ensureCampaignWorkflow(sequelize);
  console.log("Campaign workflow migration is ready.");
} catch (error) {
  console.error("Campaign workflow migration failed:", error.message);
  process.exitCode = 1;
} finally {
  await sequelize.close();
}
