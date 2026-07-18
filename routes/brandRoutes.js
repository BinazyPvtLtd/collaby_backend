import express from "express";
import {
  createBrand,
  getAllBrands,
  getBrandById,
  updateBrand,
  deleteBrand,
  uploadLogo,
} from "../controller/BrandController.js";
import { verifyToken } from "../middleware/AuthMiddleware.js";

const router = express.Router();

router.post("/",verifyToken, uploadLogo, createBrand);
router.get("/",verifyToken, getAllBrands);
router.get("/:id",verifyToken, getBrandById);
router.put("/:id",verifyToken, uploadLogo, updateBrand);
router.delete("/:id",verifyToken, deleteBrand);

export default router;
