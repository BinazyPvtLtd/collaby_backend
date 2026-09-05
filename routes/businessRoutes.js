import express from "express";
import {
  createBusiness,
  getAllBusinesses,
  getBusinessById,
  updateBusiness,
  deleteBusinessByPhone,
} from "../controller/businessController.js";
import {
  verifyBusinessAccess,
  requireBusinessAdmin,
} from "../middleware/BusinessAuthMiddleware.js";
const router = express.Router();

router.post("/register", createBusiness);
router.get("/", verifyBusinessAccess, getAllBusinesses);
router.get("/:id", verifyBusinessAccess, getBusinessById);
router.put("/:id", verifyBusinessAccess, updateBusiness);
router.delete(
  "/:phone",
  verifyBusinessAccess,
  requireBusinessAdmin,
  deleteBusinessByPhone,
);
export default router;
