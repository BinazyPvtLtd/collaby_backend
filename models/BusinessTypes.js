import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import xss from "xss";

const BusinessType = sequelize.define(
  "BusinessType",
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

    description: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: [0, 255],
      },
    },
  },
  {
    tableName: "business_types",
    timestamps: true,

    hooks: {
      beforeValidate: (data) => {
        sanitizeBusinessType(data);
      },
    },
  },
);

// 🔐 Sanitizer
function sanitizeBusinessType(data) {
  if (data.name) {
    data.name = xss(data.name.trim());
  }

  if (data.description) {
    data.description = xss(data.description.trim());
  }

  if (data.id !== undefined) {
    data.id = Number(data.id);
  }
}

export default BusinessType;
