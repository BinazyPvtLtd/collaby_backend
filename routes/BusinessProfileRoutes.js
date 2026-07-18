import express from "express";
import {
  createBusiness,
  getAllBusinesses,
  getBusinessById,
  updateBusiness,
  deleteBusiness,
} from "../controller/BusinessProfileController.js";

const router = express.Router();

router.post("/create", createBusiness);

router.get("/", getAllBusinesses);

router.get("/:id", getBusinessById);

router.put("/:id", updateBusiness);

router.delete("/:id", deleteBusiness);

export default router;