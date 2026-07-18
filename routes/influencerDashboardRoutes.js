import express from "express";
import { getInfluencerDashboard } from "../controller/influencerDashboardController.js";
import { verifyToken } from "../middleware/AuthMiddleware.js";
const router = express.Router();

router.post("/influencer-dashboard-main", getInfluencerDashboard);

export default router;
