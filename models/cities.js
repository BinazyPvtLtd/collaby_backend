import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import xss from "xss";

const City = sequelize.define(
  "City",
  {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        len: [2, 100],
      },
    },

    state: {
      type: DataTypes.STRING,
      validate: {
        len: [0, 100],
      },
    },

    country: {
      type: DataTypes.STRING,
      defaultValue: "India",
      validate: {
        len: [2, 100],
      },
    },
  },
  {
    tableName: "Cities",
    freezeTableName: true,
    timestamps: true,

    hooks: {
      beforeValidate: (data) => {
        sanitizeCity(data);
      },
    },
  },
);

// 🔐 Sanitizer
function sanitizeCity(data) {
  if (data.name) {
    data.name = xss(data.name.trim());
  }

  if (data.state) {
    data.state = xss(data.state.trim());
  }

  if (data.country) {
    data.country = xss(data.country.trim());
  }
}

export default City;
