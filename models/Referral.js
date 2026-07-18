import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import xss from "xss";

const Referral = sequelize.define(
  "Referral",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },

    referral_name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 100],
      },
    },

    referred_by: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 100],
      },
    },
  },
  {
    tableName: "referrals",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",

    hooks: {
      beforeValidate: (data) => {
        sanitizeReferral(data);
      },
    },
  },
);

// 🔐 Sanitizer
function sanitizeReferral(data) {
  if (data.referral_name) {
    data.referral_name = xss(data.referral_name.trim());
  }

  if (data.referred_by) {
    data.referred_by = xss(data.referred_by.trim());
  }

  if (data.id !== undefined) {
    data.id = Number(data.id);
  }
}

export default Referral;
