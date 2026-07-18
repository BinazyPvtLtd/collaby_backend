import express from "express";
import {
  createBusinessHack,
  updateBusinessHack,
  getAllBusinessHacks,
  getBusinessHackById,
  deleteBusinessHack,
} from "../controller/businessHacksVideoController.js";

import { uploadBusinessHack } from "../middleware/uploadBusinessHacksMedia.js";
import { verifyToken } from "../middleware/AuthMiddleware.js";

const router = express.Router();

router.post(
  "/create",
  uploadBusinessHack.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "video", maxCount: 1 },
  ]),
  verifyToken,
  createBusinessHack,
);

router.put(
  "/update/:id",
  uploadBusinessHack.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "video", maxCount: 1 },
  ]),
  verifyToken,
  updateBusinessHack,
);

router.get("/videos", verifyToken, getAllBusinessHacks);

router.get("/video/:id", verifyToken, getBusinessHackById);

router.delete("/video/:id", verifyToken, deleteBusinessHack);

export default router;
