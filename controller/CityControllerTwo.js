import { Op } from "sequelize";
import City from "../models/City.js";

// GET /api/cities
export const getAllCities = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      state,
      city_type,
      is_capital,
      search,
      sort_by = "name",
      order = "ASC",
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = {};

    if (state) where.state = { [Op.iLike]: `%${state}%` };
    if (city_type) where.city_type = city_type;
    if (is_capital !== undefined) where.is_capital = is_capital === "true";

    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { state: { [Op.iLike]: `%${search}%` } },
        { district: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const allowedSortFields = ["name", "state", "population", "city_type", "created_at"];
    const sortField = allowedSortFields.includes(sort_by) ? sort_by : "name";
    const sortOrder = order.toUpperCase() === "DESC" ? "DESC" : "ASC";

    const { count, rows } = await City.findAndCountAll({
      where,
      limit: Math.min(parseInt(limit), 100),
      offset,
      order: [[sortField, sortOrder]],
    });

    return res.status(200).json({
      success: true,
      message: "Cities Fetched successfully",
      page: parseInt(page),
      limit: parseInt(limit),
      total_pages: Math.ceil(count / parseInt(limit)),
      data: rows,
    });
  } catch (error) {
    console.error("getAllCities error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// GET /api/cities/:id
export const getCityById = async (req, res) => {
  try {
    const city = await City.findByPk(req.params.id);

    if (!city) {
      return res.status(404).json({
        success: false,
        message: "City not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: city,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// GET /api/cities/state/:state
export const getCitiesByState = async (req, res) => {
  try {
    const cities = await City.findAll({
      where: { state: { [Op.iLike]: `%${req.params.state}%` } },
      order: [["name", "ASC"]],
    });

    return res.status(200).json({
      success: true,
      total: cities.length,
      data: cities,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// GET /api/cities/states/list
export const getStatesList = async (req, res) => {
  try {
    const states = await City.findAll({
      attributes: ["state", "state_code"],
      group: ["state", "state_code"],
      order: [["state", "ASC"]],
    });

    return res.status(200).json({
      success: true,
      total: states.length,
      data: states,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// GET /api/cities/capitals
export const getCapitals = async (req, res) => {
  try {
    const capitals = await City.findAll({
      where: { is_capital: true },
      order: [["state", "ASC"]],
    });

    return res.status(200).json({
      success: true,
      total: capitals.length,
      data: capitals,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get only city id and name
export const getCities = async (req, res) => {
  try {
    const cities = await City.findAll({
      attributes: ["id", "name"],
      order: [["name", "ASC"]],
    });

    const formattedCities = cities.map(city => ({
      id: String(city.id),
      name: city.name
    }));

    res.status(200).json({
      success: true,
      message: "Cities fetched successfully",
      data: formattedCities,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching cities",
      error: error.message,
    });
  }
};