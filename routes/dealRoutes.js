import express from "express";
import {verifyToken} from "../middleware/AuthMiddleware.js";

import {
  getInfluencerDeals,
  getMyDealsByBusiness,
  submitWork,
  startReview,
  approveWork,
  rejectWork,
} from "../controller/DealController.js";

const router = express.Router();

router.get("/influencer", verifyToken, getInfluencerDeals);
router.get("/business", verifyToken, getMyDealsByBusiness);
router.post("/:id/submit", verifyToken, submitWork);
router.post("/:id/review", verifyToken, startReview);
router.post("/:id/approve", verifyToken, approveWork);
router.post("/:id/reject", verifyToken, rejectWork);

export default router;