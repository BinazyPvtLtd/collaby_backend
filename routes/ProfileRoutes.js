import express from "express";
import upload from "../middleware/ProfileUpload.js";
import {
  createProfile,
  getAllProfiles,
  updateProfile,
  deleteProfile,
  getMyProfile,
} from "../controller/ProfileController.js";
import { verifyToken } from "../middleware/AuthMiddleware.js";

const router = express.Router();

// Create
router.post("/", upload.single("profileImage"), verifyToken, createProfile);

// ✅ Specific route FIRST
router.get("/me", verifyToken, getMyProfile);

// Get all
router.get("/", verifyToken, getAllProfiles);

// ✅ Dynamic LAST (no regex)
router.put("/:id", upload.single("profileImage"), verifyToken, updateProfile);
router.delete("/:id", verifyToken, deleteProfile);

export default router;
