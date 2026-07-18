import express from "express";
import upload from "../middleware/uploadInhacks.js";

import {
  createInhack,
  getAllInhacks,
  getSingleInhack,
  updateInhack,
  deleteInhack,
} from "../controller/inhacksController.js";
import { verifyToken } from "../middleware/AuthMiddleware.js";

const router = express.Router();

router.post(
  "/create",
  verifyToken,
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "video", maxCount: 1 },
  ]),
  createInhack,
);

router.get("/list", verifyToken, getAllInhacks);
router.get("/:id", verifyToken, getSingleInhack);

router.put(
  "/update/:id",
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "video", maxCount: 1 },
  ]),
  verifyToken,
  updateInhack,
);

router.delete("/delete/:id", verifyToken, deleteInhack);

export default router;
