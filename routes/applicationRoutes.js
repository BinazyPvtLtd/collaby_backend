import express from "express";
import {
  applyToCampaign,
  getMyApplications,
  getApplicationsByCampaign,
  acceptApplication,
  rejectApplication,
  withdrawApplication,
  getCampaignApplicants,
} from "../controller/ApplicationController.js";
import { verifyToken } from "../middleware/AuthMiddleware.js";

const router = express.Router();

router.post("/", verifyToken, applyToCampaign);
router.get("/my", verifyToken, getMyApplications);
router.get("/campaign/:campaignId", verifyToken, getApplicationsByCampaign);
router.post("/:id/accept", verifyToken, acceptApplication);
router.post("/:id/reject", verifyToken, rejectApplication);
router.post("/:id/withdraw", verifyToken, withdrawApplication);

router.get(
  "/campaign/:campaignId/applicants",
  verifyToken,
  getCampaignApplicants,
);
export default router;
