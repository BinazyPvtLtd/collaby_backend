import BusinessType from "../models/BusinessTypes.js";

const seedBusinessTypes = async () => {
  try {
    const data = [
      { id: 1, name: "Private Ltd" },
      { id: 2, name: "Public Ltd" },
      { id: 3, name: "Partnership" },
    ];

    await BusinessType.bulkCreate(data, {
      ignoreDuplicates: true, // ✅ prevents crash
    });

    console.log("✅ Business types seeded");
  } catch (error) {
    console.error("❌ Business types seeder error:", error.message);
  }
};

export default seedBusinessTypes;