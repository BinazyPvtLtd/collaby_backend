import express from "express";
import { getAllBusinessTypes } from "../controller/businessTypeController.js";

const router = express.Router();


// GET API
router.get("/business-types", getAllBusinessTypes);

export default router;