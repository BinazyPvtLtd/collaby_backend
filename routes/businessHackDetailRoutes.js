import express from "express";
import {
  getAllBusinessHackDetails,
  getBusinessHackDetailById,
} from "../controller/businessHackDetailController.js";
import { verifyBusinessAccess } from "../middleware/BusinessAuthMiddleware.js";
import { mutateStep } from "../controller/campaignWorkflow.controller.js";

const router = express.Router();

router.post("/create", verifyBusinessAccess, mutateStep(2, "create"));
router.get("/", verifyBusinessAccess, getAllBusinessHackDetails);
router.get("/:id", verifyBusinessAccess, getBusinessHackDetailById);
router.put("/:id", verifyBusinessAccess, mutateStep(2, "update"));
router.delete("/:id", verifyBusinessAccess, mutateStep(2, "delete"));

export default router;
