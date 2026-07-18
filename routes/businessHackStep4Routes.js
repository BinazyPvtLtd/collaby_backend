import express from "express";
import {
  createBusinessHackStep4,
  getAllBusinessHackStep4,
  updateBusinessHackStep4,
  deleteBusinessHackStep4,
} from "../controller/businessHackStep4Controller.js";
import uploadStep4 from "../middleware/uploadStep4.js";
import { verifyToken } from "../middleware/AuthMiddleware.js";

const router = express.Router();

router.post("/create", uploadStep4, verifyToken, createBusinessHackStep4);
router.get("/", verifyToken, getAllBusinessHackStep4);
router.put("/:id", uploadStep4, verifyToken, updateBusinessHackStep4);
router.delete("/:id", verifyToken, deleteBusinessHackStep4);

export default router;
