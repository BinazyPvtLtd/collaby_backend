import InfluencerList from "../models/InfluencerList.js";

export const seedInfluencerList = async () => {
  try {
    const data = [
      {
        name: "Priya",
        followers: "9.8M",
        desc: "Just connected her Instagram and unlocked premium brand campaigns.",
      },
      {
        name: "Rahul",
        followers: "2.3M",
        desc: "Verified profile and started earning from brand deals.",
      },
      {
        name: "Aisha",
        followers: "5.1M",
        desc: "Unlocked exclusive barter and paid collaborations.",
      },
    ];

    await InfluencerList.bulkCreate(data, {
      ignoreDuplicates: true,
    });

    console.log("✅ Influencer list seeded successfully");
  } catch (error) {
    console.error("❌ Influencer Seeder Error:", error.message);
  }
};
