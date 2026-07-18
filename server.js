import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();
//last chnges caps imported file 23-05-26
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "path";
import sequelize from "./config/database.js";
import cookieParser from "cookie-parser";
import otpRoutes from "./routes/OtpRoutes.js";
import authRoutes from "./routes/AuthRoutes.js";
import influencerRoutes from "./routes/InfluencerRoutes.js";
import cityRoutes from "./routes/CityRoutes.js";
import businessTypeRoutes from "./routes/businessTypeRoutes.js";
import businessRoutes from "./routes/businessRoutes.js";
import campaignRoutes from "./routes/campaignRoutes.js";
import brandRoutes from "./routes/brandRoutes.js";
import businessHackRoutes from "./routes/businessHackRoutes.js";
import businessHackDetailRoutes from "./routes/businessHackDetailRoutes.js";
import businessHackStep3Routes from "./routes/businessHackDetail2Routes.js";
import businessHackStep4Routes from "./routes/businessHackStep4Routes.js";
import influencerUserRoutes from "./routes/InfluencerUserRoutes.js";
import influencerCategoryRoutes from "./routes/InfluencerCategoryRoutes.js";
import profileRoutes from "./routes/ProfileRoutes.js";
import BusinessRoutes from "./routes/businessRoutes.js";
import cityRoutesTwo from "./routes/CityRoutesTwo.js";
import influencerListRoutes from "./routes/influencerListRoutes.js";
import inhacksRoutes from "./routes/inhacksRoutes.js";
import businessHacksRoutes from "./routes/businessHackRoutes.js";
import referralRoutes from "./routes/referralRoutes.js";
import bannerRoutes from "./routes/bannerRoutes.js";
import influencerDashboardRoutes from "./routes/influencerDashboardRoutes.js";
import campaignDataRoutes from "./routes/campaignRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import allCampaignDataRoutes from "./routes/AllCampaignDataRoute.js";
import applicationRoutes from "./routes/applicationRoutes.js";
import dealRoutes from "./routes/dealRoutes.js";
import { seedCampaignTypes } from "./seeders/seedCampaignTypes.js";
import { runAllSeeders } from "./seeders/runAllSeeders.js";
import "./models/Associations.js";
// ❌ REMOVE bodyParser (not needed)
// import bodyParser from "body-parser";
const app = express();

app.use(cookieParser());
// ✅ Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
/* ================== 🔒 SECURITY ================== */

// ✅ Helmet
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

/* ================== 🔥 RATE LIMIT FIX ================== */

// ⚠️ This can BLOCK Flutter testing → increase limit
const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 50, // 🔥 increased from 5 → prevents blocking
  message: "Too many attempts, try again later",
});
app.use("/api/auth", authLimiter);

/* ================== 🪵 DEBUG ================== */

app.use((req, res, next) => {
  console.log("👉 Incoming:", req.method, req.url);
  next();
});

/* ================== 🔥 CORS FIX ================== */

// ❌ OLD (too restrictive)
// origin: process.env.FRONTEND_URL || "http://localhost:3000"

// ✅ NEW (Flutter + Web safe)
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  }),
);

/* ================== 🔥 BODY LIMIT FIX ================== */

// increase limit (Flutter images/json may fail on 10kb)
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

/* ================== 📁 STATIC ================== */

app.use(
  "/uploads",
  express.static(path.join(process.cwd(), "uploads"), {
    maxAge: "1d",
    dotfiles: "deny",
  }),
);

/* ================== TEST ROUTE ================== */

app.get("/", (req, res) => {
  res.send("InfluenceX Backend Running 🚀");
});

/* ================== 🌐 ROUTES ================== */

// (NO CHANGE HERE — your routes are fine)
app.use("/api/auth", otpRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/influencers", influencerRoutes);
app.use("/api/cities", cityRoutes);
app.use("/api", businessTypeRoutes);
app.use("/api/business", businessRoutes);
app.use("/api/campaigns", campaignRoutes);
app.use("/api/brands", brandRoutes);
app.use("/api/campaigns-step1", businessHackRoutes);
app.use("/api/campaigns-details", businessHackDetailRoutes);
app.use("/api/campaigns-step3", businessHackStep3Routes);
app.use("/api/campaigns-step4", businessHackStep4Routes);
app.use("/api/influencers-user", influencerUserRoutes);
app.use("/api/categories", influencerCategoryRoutes);
app.use("/api/profiles", profileRoutes);
app.use("/api/business-profile", BusinessRoutes);
app.use("/api/city", cityRoutesTwo);
app.use("/api", influencerListRoutes);
app.use("/api/inhacks", inhacksRoutes);
app.use("/api/business-hacks-video", businessHacksRoutes);
app.use("/api/referrals", referralRoutes);
app.use("/api/banners", bannerRoutes);
app.use("/api/influencer-dashboard", influencerDashboardRoutes);
app.use("/api/data", campaignDataRoutes);
app.use("/api/products", productRoutes);
app.use("/api/all-detail", allCampaignDataRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/deals", dealRoutes);

/* ================== ❌ ERROR HANDLER ================== */

app.use((err, req, res, next) => {
  console.error("❌ Error:", err.stack);
  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

console.log("ENV CHECK --->", process.env.RUN_SEEDER);
/* ================== 🚀 SERVER START ================== */
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected successfully");

    await sequelize.sync(); // ❌ REMOVE force:true on live
    console.log("✅ Tables synced");

    if (process.env.RUN_SEEDER === "true") {
      await runAllSeeders();
    }

    const PORT = process.env.PORT;

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running on :${PORT}`);
    });
  } catch (error) {
    console.error("❌ DB Error:", error.message);
  }
};

startServer();

/* ================== 🔻 SHUTDOWN ================== */
/* ================== 🔻 SHUTDOWN ================== */

const shutdown = async (signal) => {
  console.log(`⚠️ Received ${signal}`);

  try {
    await sequelize.close();
    console.log("✅ DB connection closed");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error closing DB:", err.message);
    process.exit(1);
  }
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

process.on("SIGUSR2", async () => {
  console.log("🔄 Nodemon restart...");
  await sequelize.close();
  process.kill(process.pid, "SIGUSR2");
});
