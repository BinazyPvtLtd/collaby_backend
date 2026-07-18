import express from "express";
import {
  createBusinessHackDetail,
  getAllBusinessHackDetails,
  getBusinessHackDetailById,
  updateBusinessHackDetail,
  deleteBusinessHackDetail,
} from "../controller/businessHackDetailController.js";
import { verifyToken } from "../middleware/AuthMiddleware.js";

const router = express.Router();

router.post("/create", verifyToken, createBusinessHackDetail);
router.get("/", verifyToken, getAllBusinessHackDetails);
router.get("/:id", verifyToken, getBusinessHackDetailById);
router.put("/:id", verifyToken, updateBusinessHackDetail);
router.delete("/:id", verifyToken, deleteBusinessHackDetail);

export default router;
