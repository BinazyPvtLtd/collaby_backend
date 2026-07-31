import express from "express";
import {
  createCategory,
  getAllCategories,
  saveInfluencerCategories,
  getInfluencerCategories,
} from "../controller/InfluencerCategoryController.js";

const router = express.Router();

// Master Categories
router.post("/category", createCategory);
router.get("/categories", getAllCategories);

// Influencer Category Mapping
router.post("/influencer/categories", saveInfluencerCategories);
router.get(
  "/influencer/categories/:influencer_id",
  getInfluencerCategories
);

export default router;