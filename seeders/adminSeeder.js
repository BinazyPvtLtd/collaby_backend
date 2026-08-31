import Admin from "../models/Admin.js";

const seedAdmin = async () => {
  try {
    const email = (
      process.env.ADMIN_EMAIL || "admin@collaby.com"
    ).toLowerCase();

    const existing = await Admin.findOne({ where: { email } });
    if (existing) {
      console.log("Admin already exists, skipping...");
      return;
    }

    await Admin.create({
      name: process.env.ADMIN_NAME || "Admin",
      email,
      password: process.env.ADMIN_PASSWORD || "Admin@1234",
      role: "admin",
      status: "active",
    });

    console.log(`Default admin created (${email})`);
  } catch (error) {
    console.error(" Admin seeder error:", error.message);
  }
};

export default seedAdmin;
