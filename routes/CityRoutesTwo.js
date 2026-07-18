import express from "express";
const router = express.Router();

import {
  getAllCities,
  getCityById,
  getCitiesByState,
  getStatesList,
  getCapitals,
  getCities
} from "../controller/CityControllerTwo.js";

/**
 * @route   GET /api/cities
 * @desc    Get all cities (paginated, filterable)
 */
router.get("/", getAllCities);

/**
 * @route   GET /api/cities/states/list
 */
router.get("/states/list", getStatesList);

/**
 * @route   GET /api/cities/capitals
 */
router.get("/capitals", getCapitals);

/**
 * @route   GET /api/cities/state/:state
 */
router.get("/state/:state", getCitiesByState);

//get all cities with id and name 
router.get("/cities", getCities);

/**
 * @route   GET /api/cities/:id
 */
router.get("/:id", getCityById);



export default router;