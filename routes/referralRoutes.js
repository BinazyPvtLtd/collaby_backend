import express from "express";
import {
  createReferral,
  getAllReferrals,
  getReferralById,
  updateReferral,
  deleteReferral,
} from "../controller/referralController.js";
import { verifyToken } from "../middleware/AuthMiddleware.js";
const router = express.Router();

router.post("/create",verifyToken, createReferral);

router.get("/all",verifyToken, getAllReferrals);

router.get("/:id",verifyToken, getReferralById);

router.put("/update/:id",verifyToken, updateReferral);

router.delete("/delete/:id",verifyToken, deleteReferral);

export default router;