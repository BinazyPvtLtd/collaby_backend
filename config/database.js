import { Sequelize } from "sequelize";
import dotenv from "dotenv";
dotenv.config();
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: "postgres",
    logging: false,

    pool: {
      max: 5,        // 🔥 max connections
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// test connection once
export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ DB Connected Successfully");
  } catch (error) {
    console.error("❌ DB Connection Failed:", error);
  }
};

export default sequelize;