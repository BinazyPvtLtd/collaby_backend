import express from "express";

import {
  sendOtp,
  verifyOtp,
  logout,
  refreshAccessToken,
} from "../controller/OtpController.js";

import { verifyToken } from "../middleware/AuthMiddleware.js";

const router = express.Router();

/* =========================================================
   FIREBASE AUTH ROUTES
========================================================= */

// ✅ STEP 1
// Check Mobile Number Exists
router.post(
  "/send-otp",
  sendOtp
);

// ✅ STEP 2
// Firebase Verify + Login
router.post(
  "/verify-otp",
  verifyOtp
);

/* =========================================================
   REFRESH TOKEN
========================================================= */

// ✅ Generate New Access Token
router.post(
  "/refresh-token",
  refreshAccessToken
);

/* =========================================================
   LOGOUT
========================================================= */

// ✅ Logout User
router.post(
  "/logout",
  verifyToken,
  logout
);

export default router;