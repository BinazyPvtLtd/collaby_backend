import express from "express";
import {
  createBusiness,
  getAllBusinesses,
  getBusinessByUUID,
  updateBusiness,
  deleteBusinessByPhone,
} from "../controller/businessController.js";
import { verifyToken } from "../middleware/AuthMiddleware.js";
const router = express.Router();

router.post("/register", createBusiness);
router.get("/", verifyToken, getAllBusinesses);
router.get("/:id", verifyToken, getBusinessByUUID);
router.put("/:id", verifyToken, updateBusiness);
router.delete("/:phone", deleteBusinessByPhone);
export default router;
