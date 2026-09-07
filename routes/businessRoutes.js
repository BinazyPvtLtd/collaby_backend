import express from "express";
import {
  createBusiness,
  getAllBusinesses,
  getBusinessById,
  updateBusiness,
} from "../controller/businessController.js";
import { verifyBusinessAccess } from "../middleware/BusinessAuthMiddleware.js";
const router = express.Router();

router.post("/register", createBusiness);
router.get("/", verifyBusinessAccess, getAllBusinesses);
router.get("/:id", verifyBusinessAccess, getBusinessById);
router.put("/:id", verifyBusinessAccess, updateBusiness);
export default router;
