import express from "express";
import {
  createInfluencer,
  getAllInfluencers,
  getMyInfluencer,
  updateInfluencer,
  deleteInfluencer,
} from "../controller/InfluencerControllers.js";
import {upload} from "../middleware/upload.js"
import { verifyToken } from "../middleware/AuthMiddleware.js";
const router = express.Router();

router.post("/create", upload.single("profilePhoto"),verifyToken, createInfluencer);
router.get("/", verifyToken,getAllInfluencers);
router.get("/me",verifyToken, getMyInfluencer);
router.put("/:id", upload.single('profilePhoto'),verifyToken, updateInfluencer);
router.delete("/:id",verifyToken, deleteInfluencer);

export default router;