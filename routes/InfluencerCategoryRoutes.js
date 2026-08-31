import express from "express";
import {
  getAllCategories,
  saveInfluencerCategories,
  getInfluencerCategories,
} from "../controller/InfluencerCategoryController.js";

const router = express.Router();

// Master Categories (public read)
router.get("/categories", getAllCategories);

// Influencer Category Mapping
router.post("/influencer/categories", saveInfluencerCategories);
router.get("/influencer/categories/:influencer_id", getInfluencerCategories);

export default router;
