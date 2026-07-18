import sequelize from "../config/database.js";
import City from "../models/City.js";
import fs from "fs";

const seedCities = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connected");

    // Read local JSON file
    const rawData = fs.readFileSync("./data/indiaCities.json");
    const jsonData = JSON.parse(rawData);

    let citiesArray = [];

    jsonData.forEach((stateObj) => {
      stateObj.cities.forEach((cityName) => {
        citiesArray.push({
          name: cityName,
          state: stateObj.state,
          country: "India",
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      });
    });

    await City.bulkCreate(citiesArray, {
      ignoreDuplicates: true,
    });

    console.log("Cities inserted successfully");
    process.exit();
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

seedCities();
