import express from "express";

import {
  createBusinessHack,
  getAllBusinessHacks,
  getBusinessHackById,
  updateBusinessHack,
  deleteBusinessHack,
} from "../controller/businessHackController.js";

import { verifyToken } from "../middleware/AuthMiddleware.js";

const router = express.Router();

router.post(
  "/create",
  verifyToken,
  createBusinessHack
);

router.get("/", verifyToken, getAllBusinessHacks);

router.get("/:id", verifyToken, getBusinessHackById);

router.put(
  "/:id",
  verifyToken,
  updateBusinessHack
);

router.delete("/:id", verifyToken, deleteBusinessHack);

export default router;