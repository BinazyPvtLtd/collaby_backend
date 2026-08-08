import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import xss from "xss";

const BusinessRegistration = sequelize.define(
  "BusinessRegistration",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    businessName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 100],
      },
    },

    mobileNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        is: /^[6-9]\d{9}$/, // Indian mobile format
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

    businessType: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 50],
      },
    },

    gstNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
      validate: {
        len: [0, 20],
        is: /^[0-9A-Z]*$/i,
      },
    },

business_user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    refreshToken: {
      type: DataTypes.TEXT,
      allowNull: true,
      // ⚠️ NOTE: TEXT + default [] is not ideal but keeping non-breaking
    },
  },
  {
    tableName: "business_registration",
    freezeTableName: true,
    timestamps: true,

    hooks: {
      beforeCreate: (business, options) => {
        // existing logic (kept safe)
        if (options.userId) {
          business.business_user_id = options.userId;
        }

        sanitizeBusiness(business);
      },

      beforeUpdate: (business) => {
        sanitizeBusiness(business);
      },
    },
    paranoid: true, // ✅ soft delete enabled (commented out to avoid breaking changes)
  },
);

// 🔐 Central sanitizer
function sanitizeBusiness(business) {
  if (business.businessName) business.businessName = xss(business.businessName);

  if (business.mobileNumber) business.mobileNumber = xss(business.mobileNumber);

  if (business.city) business.city = xss(business.city);

  if (business.businessType) business.businessType = xss(business.businessType);

  if (business.gstNumber) business.gstNumber = xss(business.gstNumber);
}

export default BusinessRegistration;
