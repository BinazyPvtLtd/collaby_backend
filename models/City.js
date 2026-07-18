import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import xss from "xss";

const City = sequelize.define(
  "City",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 100],
      },
    },

    state: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 100],
      },
    },

    state_code: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 10],
        is: /^[A-Z]{2,10}$/, // e.g., UP, MH
      },
    },

    district: {
      type: DataTypes.STRING,
      validate: {
        len: [0, 100],
      },
    },

    latitude: {
      type: DataTypes.DECIMAL,
      validate: {
        isDecimal: true,
        min: -90,
        max: 90,
      },
    },

    longitude: {
      type: DataTypes.DECIMAL,
      validate: {
        isDecimal: true,
        min: -180,
        max: 180,
      },
    },

    population: {
      type: DataTypes.BIGINT,
      validate: {
        isInt: true,
        min: 0,
      },
    },

    is_capital: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    city_type: {
      type: DataTypes.ENUM("metropolitan", "tier1", "tier2", "tier3"),
      defaultValue: "tier2",
    },
  },
  {
    tableName: "cities",
    timestamps: true,
    underscored: true,

    hooks: {
      beforeValidate: (data) => {
        sanitizeCity(data);
      },
    },
  },
);

// 🔐 Sanitizer
function sanitizeCity(data) {
  if (data.name) data.name = xss(data.name.trim());
  if (data.state) data.state = xss(data.state.trim());
  if (data.state_code)
    data.state_code = xss(data.state_code.trim().toUpperCase());
  if (data.district) data.district = xss(data.district.trim());

  // safe number conversion
  if (data.latitude !== undefined) {
    data.latitude = Number(data.latitude);
  }

  if (data.longitude !== undefined) {
    data.longitude = Number(data.longitude);
  }

  if (data.population !== undefined) {
    data.population = Number(data.population);
  }

  if (Number.isNaN(data.latitude)) data.latitude = null;
  if (Number.isNaN(data.longitude)) data.longitude = null;
  if (Number.isNaN(data.population)) data.population = null;
}

export default City;
