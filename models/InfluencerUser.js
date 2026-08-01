import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import xss from "xss";

const InfluencerUser = sequelize.define(
  "InfluencerUser",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    fullName: {
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
        is: /^[6-9]\d{9}$/, // Indian mobile validation
      },
    },

    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        isEmail: true,
        len: [5, 150],
      },
    },

    dob: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        isDate: true,
        isBefore: new Date().toISOString(),
      },
    },

    city: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 100],
      },
    },

    gender: {
      type: DataTypes.ENUM("Male", "Female", "Other"),
    },

    refreshToken: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "influencersUser",
    timestamps: true,

    hooks: {
      beforeValidate: (data) => {
        sanitizeInfluencerUser(data);
      },
    },
    paranoid: true, // ✅ soft delete enabled
  },
);

// 🔐 Sanitizer
function sanitizeInfluencerUser(data) {
  if (data.fullName) {
    data.fullName = xss(data.fullName.trim());
  }

  if (data.email) {
    data.email = xss(data.email.trim().toLowerCase());
  }

  if (data.mobileNumber) {
    data.mobileNumber = xss(data.mobileNumber.trim());
  }

  if (data.city) {
    data.city = xss(data.city.trim());
  }

  if (data.gender) {
    data.gender = xss(data.gender.trim());
  }

  // 🔐 CRITICAL: sanitize token
  if (data.refreshToken) {
    data.refreshToken = xss(data.refreshToken.trim());
  }
}
InfluencerUser.associate = (models) => {
  InfluencerUser.hasOne(models.Influencer, {
    foreignKey: "userId",
    sourceKey: "id",
    as: "profile",
  });
};

export default InfluencerUser;
