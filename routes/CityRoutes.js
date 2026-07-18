import express from "express";
import { importIndianCities, getAllCitiesDropdown } from "../controller/cityController.js";

const router = express.Router();

router.post("/import-indian-cities", importIndianCities);
router.get("/cities",getAllCitiesDropdown)
export default router;
