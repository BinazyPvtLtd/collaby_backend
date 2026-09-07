import express from "express";
import {
  createInfluencer,
  getInfluencerById,
  updateInfluencer,
  deleteInfluencerByPhone,
} from "../controller/InfluencerUserController.js";

import { verifyInfluencerAccountAccess } from "../middleware/InfluencerAccountAuthMiddleware.js";

const router = express.Router();

router.post("/user-create", createInfluencer);
router.get("/:id", verifyInfluencerAccountAccess, getInfluencerById);
router.put("/:id", verifyInfluencerAccountAccess, updateInfluencer);
router.delete(
  "/:phone",
  verifyInfluencerAccountAccess,
  deleteInfluencerByPhone,
);
export default router;
