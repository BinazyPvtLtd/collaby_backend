import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import xss from "xss";

const BusinessProfile = sequelize.define(
  "BusinessProfile",
  {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 100],
      },
    },

    businessCategory: {
      type: DataTypes.STRING,
      validate: {
        len: [0, 100],
      },
    },

    headquarters: {
      type: DataTypes.STRING,
      validate: {
        len: [0, 100],
      },
    },

    foundedIn: {
      type: DataTypes.INTEGER,
      validate: {
        isInt: true,
        min: 1800,
        max: new Date().getFullYear(),
      },
    },

    website: {
      type: DataTypes.STRING,
      validate: {
        isUrl: true,
      },
    },

    bio: {
      type: DataTypes.TEXT,
      validate: {
        len: [0, 2000],
      },
    },

    businessName: {
      type: DataTypes.STRING,
      validate: {
        len: [0, 150],
      },
    },

    gstin: {
      type: DataTypes.STRING,
      validate: {
        len: [0, 20],
        is: /^[0-9A-Z]*$/i,
      },
    },

    panNumber: {
      type: DataTypes.STRING,
      validate: {
        len: [0, 10],
        is: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, // PAN format
      },
    },

    businessAddress: {
      type: DataTypes.TEXT,
      validate: {
        len: [0, 500],
      },
    },

    postalCode: {
      type: DataTypes.STRING,
      validate: {
        is: /^[1-9][0-9]{5}$/, // Indian PIN code
      },
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    tableName: "business_profiles",
    timestamps: true,

    hooks: {
      beforeValidate: (data) => {
        sanitizeProfile(data);
      },
    },
  },
);

// 🔐 Sanitizer
function sanitizeProfile(data) {
  if (data.name) data.name = xss(data.name.trim());
  if (data.businessCategory)
    data.businessCategory = xss(data.businessCategory.trim());
  if (data.headquarters) data.headquarters = xss(data.headquarters.trim());
  if (data.website) data.website = xss(data.website.trim());
  if (data.bio) data.bio = xss(data.bio);
  if (data.businessName) data.businessName = xss(data.businessName.trim());
  if (data.gstin) data.gstin = xss(data.gstin.trim());
  if (data.panNumber) data.panNumber = xss(data.panNumber.trim());
  if (data.businessAddress) data.businessAddress = xss(data.businessAddress);
  if (data.postalCode) data.postalCode = xss(data.postalCode.trim());
}

export default BusinessProfile;
