import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import xss from "xss";

const Brand = sequelize.define(
  "Brand",
  {
    brandName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 100],
      },
    },

    logo: {
      type: DataTypes.STRING,
      validate: {
        len: [0, 255],
        is: /^[a-zA-Z0-9._/-]*$/i, // safe file path
      },
    },

    website: {
      type: DataTypes.STRING,
      validate: {
        isUrl: true,
      },
    },

    instagramPage: {
      type: DataTypes.STRING,
      validate: {
        isUrl: true,
      },
    },

    category: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 50],
      },
    },

    city: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 50],
      },
    },

    gstNumber: {
      type: DataTypes.STRING,
      validate: {
        len: [0, 20],
        is: /^[0-9A-Z]*$/i, // GST format (basic safe check)
      },
    },

    description: {
      type: DataTypes.TEXT,
      validate: {
        len: [0, 2000],
      },
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    tableName: "brands",
    timestamps: true,

    hooks: {
      beforeCreate: (brand) => {
        sanitizeBrand(brand);
      },
      beforeUpdate: (brand) => {
        sanitizeBrand(brand);
      },
    },
  },
);

// 🔐 Central sanitizer (clean + reusable)
function sanitizeBrand(brand) {
  if (brand.brandName) brand.brandName = xss(brand.brandName);
  if (brand.logo) brand.logo = xss(brand.logo);
  if (brand.website) brand.website = xss(brand.website);
  if (brand.instagramPage) brand.instagramPage = xss(brand.instagramPage);
  if (brand.category) brand.category = xss(brand.category);
  if (brand.city) brand.city = xss(brand.city);
  if (brand.gstNumber) brand.gstNumber = xss(brand.gstNumber);
  if (brand.description) brand.description = xss(brand.description);
}

export default Brand;
