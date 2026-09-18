import express from "express";
import { verifyBusinessAccess } from "../middleware/BusinessAuthMiddleware.js";
import { verifyToken } from "../middleware/AuthMiddleware.js";
import { listCampaigns, getCampaign, updateDraft, changeStatus, removeCampaign } from "../controller/campaignWorkflow.controller.js";
import {
  createCampaign,
} from "../controller/campaignController.js";

const router = express.Router();

router.post("/create", verifyBusinessAccess, createCampaign);
router.get("/", verifyToken, listCampaigns("basic"));
router.get("/:id", verifyToken, getCampaign("basic"));
router.put("/:id", verifyBusinessAccess, updateDraft("basic"));
router.patch("/:id/status", verifyBusinessAccess, changeStatus("basic"));
router.delete("/:id", verifyBusinessAccess, removeCampaign("basic"));

export default router;
