import sequelize from "../config/database.js";

import { seedCampaignTypes } from "./seedCampaignTypes.js";
import seedCities  from "./CitySeeder.js";
import { seedInfluencerList } from "./influencerListSeeder.js";
import seedBusinessTypes from "./business-types.js"; // make sure export exists

export const runAllSeeders = async () => {
  try {
    console.log("🌱 Running all seeders...");

    await sequelize.authenticate();
    console.log("✅ DB Connected");

    // ⚠️ IMPORTANT: DO NOT use force:true in production
    await sequelize.sync();

    await seedCampaignTypes();
    await seedBusinessTypes();
    await seedCities();
    await seedInfluencerList();

    console.log("🎉 All seeders executed successfully");
  } catch (error) {
    console.error("❌ Seeder Runner Error:", error);
  }
};
