import express from "express";
import {
  getAllBusinessHackStep3,
  getBusinessHackStep3ById,
} from "../controller/businessHackDetail2Controller.js";
import { verifyBusinessAccess } from "../middleware/BusinessAuthMiddleware.js";
import { mutateStep } from "../controller/campaignWorkflow.controller.js";

const router = express.Router();

router.post("/create", verifyBusinessAccess, mutateStep(3, "create"));
router.get("/", verifyBusinessAccess, getAllBusinessHackStep3);
router.get("/:id", verifyBusinessAccess, getBusinessHackStep3ById);
router.put("/:id", verifyBusinessAccess, mutateStep(3, "update"));
router.delete("/:id", verifyBusinessAccess, mutateStep(3, "delete"));

export default router;
