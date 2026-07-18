import CampaignType from "../models/CampaignType.js";

export const seedCampaignTypes = async () => {
  try {
    const types = [
      { typeName: "Paid" },
      { typeName: "Reimbursement" },
      { typeName: "Barter" },
    ];

    await CampaignType.bulkCreate(types, {
      ignoreDuplicates: true, // 🔥 key line
    });

    console.log("✅ Campaign types seeded safely (no duplicates)");
  } catch (error) {
    console.error("❌ Seeder Error:", error.message);
  }
};