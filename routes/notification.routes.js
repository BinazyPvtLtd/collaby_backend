import express from "express";

import { verifyToken } from "../middleware/AuthMiddleware.js";

import {
  registerDevice,
  logoutDevice,
  getNotifications,
  markRead,
  markAllRead,
  getUnreadCount,
  sendNotification,
  cleanupTokens,
} from "../controller/notification.controller.js";

const router = express.Router();

router.post("/register-device", verifyToken, registerDevice);

router.post("/logout-device", verifyToken, logoutDevice);

router.get("/", verifyToken, getNotifications);

router.get("/unread-count", verifyToken, getUnreadCount);

router.patch("/:id/read", verifyToken, markRead);

router.patch("/read-all", verifyToken, markAllRead);

// Admin / internal endpoint to send bulk notifications.
router.post("/send", verifyToken, sendNotification);

// Admin / internal endpoint to purge stale/invalid FCM tokens.
router.delete("/cleanup", verifyToken, cleanupTokens);

export default router;

