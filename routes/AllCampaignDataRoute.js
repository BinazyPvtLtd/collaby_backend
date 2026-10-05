import express from "express";
import { verifyToken } from "../middleware/AuthMiddleware.js";
import { verifyAdminToken } from "../middleware/AdminAuthMiddleware.js";
import {
  getAllBusinessHackData,
  getBusinessUserCampaigns,
  getBusinessCampaigns,
} from "../controller/AllCampaignData.js";

const router = express.Router();
// ✅ New API - fetch ALL campaigns (admin/influencer)
router.get(
  "/get-all-business-hacks",
  verifyToken,
  (req, res, next) => {
    if (req.user?.adminId) {
      return verifyAdminToken(req, res, next);
    }
    return next();
  },
  getAllBusinessHackData,
);

// ✅ New API - fetch only logged-in user's campaigns
router.get("/get-my-business-hacks", verifyToken, getBusinessUserCampaigns);

//route to get campaigns according to logged in business user

router.get("/my-campaigns", verifyToken, getBusinessCampaigns);

export default router;
