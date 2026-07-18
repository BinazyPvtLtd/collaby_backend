import express from "express";

import {
  createBanner,
  getAllBanners,
  getBannerById,
  updateBanner,
  deleteBanner,
  uploadBanner,
} from "../controller/bannerController.js";
import { verifyToken } from "../middleware/AuthMiddleware.js";

const router = express.Router();

router.post("/create", verifyToken, uploadBanner, createBanner);

router.get("/", verifyToken, getAllBanners);

router.get("/:id", verifyToken, getBannerById);

router.put("/update/:id", verifyToken, uploadBanner, updateBanner);

router.delete("/delete/:id", verifyToken, deleteBanner);

export default router;
