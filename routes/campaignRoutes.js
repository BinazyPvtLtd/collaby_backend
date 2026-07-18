import express from "express";
import {
  createCampaign,
  getAllCampaigns,
  getCampaignById,
  updateCampaign,
  deleteCampaign,
} from "../controller/campaignController.js";

const router = express.Router();

router.post("/create", createCampaign);
router.get("/", getAllCampaigns);
router.get("/:id", getCampaignById);
router.put("/:id", updateCampaign);
router.delete("/:id", deleteCampaign);

export default router;