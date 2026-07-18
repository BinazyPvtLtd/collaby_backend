import express from "express";
import { getInfluencerDashboard } from "../controller/influencerListController.js";
import { verifyToken } from "../middleware/AuthMiddleware.js";

const router = express.Router();

router.get("/influencer-dashboard",verifyToken, getInfluencerDashboard);

export default router;