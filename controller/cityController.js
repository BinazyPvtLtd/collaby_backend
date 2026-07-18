import axios from "axios";
import chalk from "chalk";
import City from "../models/cities.js";
import { convertToString } from "../HelperFunction/Helper.js";

export const importIndianCities = async (req, res) => {
  console.log(chalk.blue("🚀 Starting Indian Cities Import..."));

  try {
    console.log(chalk.yellow("🌍 Fetching data from third-party API..."));

    const response = await axios.post(
      "https://countriesnow.space/api/v0.1/countries/cities",
      {
        country: "India", // Always better to keep first letter capital
      },
    );

    // Check if response exists
    if (!response.data || !response.data.data) {
      console.log(chalk.red("❌ No data received from API"));
      return res.status(400).json({ error: "No data received from API" });
    }

    const cities = response.data.data;

    console.log(
      chalk.green(
        `✅ Data fetched successfully. Total cities: ${cities.length}`,
      ),
    );

    if (cities.length === 0) {
      console.log(chalk.red("⚠️ Cities array is empty"));
      return res.status(400).json({ error: "No cities found" });
    }

    // Convert cities into array of objects
    const cityData = cities.map((city) => ({
      name: city,
      country: "India",
    }));

    console.log(chalk.cyan("💾 Inserting cities into database..."));

    const inserted = await City.bulkCreate(cityData, {
      ignoreDuplicates: true,
    });

    console.log(
      chalk.green.bold(
        `🎉 Successfully inserted ${inserted.length} cities into database`,
      ),
    );

    res.status(200).json({
      message: "Indian cities imported successfully",
      totalFetched: cities.length,
      totalInserted: inserted.length,
    });
  } catch (error) {
    console.log(chalk.red.bold("🔥 ERROR OCCURRED"));
    console.error(chalk.red(error.message));
    res.status(500).json({ error: "Failed to import cities" });
  }
};

// GET all cities for dropdown
export const getAllCitiesDropdown = async (req, res) => {
  try {
    const cities = await City.findAll({
      attributes: ["id", "name"],
      order: [["name", "ASC"]],
    });

    const cityData = cities.map((city) => city.toJSON());

    res.status(200).json({
      success: true,
      total: String(cities.length),
      message: "Cities fetched successfully",
      data: convertToString(cityData),
    });
  } catch (error) {
    console.error("Error fetching cities:", error.message);

    res.status(500).json({
      success: "false",
      message: "Failed to fetch cities",
    });
  }
};


//get all cities with id and name
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
      total: formattedCities.length,
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