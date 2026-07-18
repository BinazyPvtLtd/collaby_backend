import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import xss from "xss";

const Product = sequelize.define(
  "Product",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    productName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: { msg: "Product name is required" },
        len: {
          args: [2, 100],
          msg: "Product name must be between 2-100 characters",
        },
      },
    },

    productDescription: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: {
          args: [0, 1000],
          msg: "Description too long",
        },
      },
    },

    productQuantity: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        isInt: { msg: "Quantity must be a number" },
        min: {
          args: [0],
          msg: "Quantity cannot be negative",
        },
        max: {
          args: [100000],
          msg: "Quantity too large",
        },
      },
    },

    productImage: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: [0, 255],
        isSafePath(value) {
          if (value && value.includes("..")) {
            throw new Error("Invalid file path");
          }
        },
      },
    },
  },
  {
    tableName: "products",
    timestamps: true,

    defaultScope: {
      attributes: { exclude: [] },
    },

    hooks: {
      beforeValidate: (data) => {
        sanitizeProduct(data.dataValues);
      },
    },
  },
);

// 🔐 Sanitizer
function sanitizeProduct(data) {
  if (data.productName) {
    data.productName = xss(data.productName.trim());
  }

  if (data.productDescription) {
    data.productDescription = xss(data.productDescription);
  }

  if (data.productImage) {
    data.productImage = xss(data.productImage.trim());
  }

  // safe number conversion
  if (data.productQuantity !== undefined) {
    data.productQuantity = Number(data.productQuantity);

    if (Number.isNaN(data.productQuantity) || data.productQuantity < 0) {
      data.productQuantity = 0;
    }
  }
}

export default Product;
