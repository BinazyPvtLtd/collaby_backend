import express from "express";
import {
  createBusinessHackStep3,
  getAllBusinessHackStep3,
  getBusinessHackStep3ById,
  updateBusinessHackStep3,
  deleteBusinessHackStep3,
} from "../controller/businessHackDetail2Controller.js";
import { verifyToken } from "../middleware/AuthMiddleware.js";

const router = express.Router();

router.post("/create", verifyToken, createBusinessHackStep3);
router.get("/", verifyToken, getAllBusinessHackStep3);
router.get("/:id", verifyToken, getBusinessHackStep3ById);
router.put("/:id", verifyToken, updateBusinessHackStep3);
router.delete("/:id", verifyToken, deleteBusinessHackStep3);

export default router;
