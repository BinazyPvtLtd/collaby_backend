import express from "express";

import {
  createBusinessHack,
} from "../controller/businessHackController.js";

import { verifyToken } from "../middleware/AuthMiddleware.js";
import { verifyBusinessAccess } from "../middleware/BusinessAuthMiddleware.js";
import { listCampaigns, getCampaign, updateDraft, changeStatus, removeCampaign } from "../controller/campaignWorkflow.controller.js";

const router = express.Router();

router.post(
  "/create",
  verifyBusinessAccess,
  createBusinessHack
);

router.get("/", verifyToken, listCampaigns("multi"));

router.get("/:id", verifyToken, getCampaign("multi"));

router.put(
  "/:id",
  verifyBusinessAccess,
  updateDraft("multi")
);

router.patch("/:id/status", verifyBusinessAccess, changeStatus("multi"));
router.delete("/:id", verifyBusinessAccess, removeCampaign("multi"));

export default router;
