import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import xss from "xss";
import { CAMPAIGN_STATUSES } from "../services/campaignPolicy.js";

const BusinessHack = sequelize.define(
  "BusinessHack",
  {
    campaignStatus: { type: DataTypes.STRING(32), allowNull: false, defaultValue: "Draft", validate: { isIn: [CAMPAIGN_STATUSES] } },
    applicationDeadline: { type: DataTypes.DATE, allowNull: true },
    suspendedFrom: { type: DataTypes.STRING(32), allowNull: true },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    campaignName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 150],
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

    city: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 100],
      },
    },

    campaignType: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [["Paid", "Reimbursement", "Barter"]],
      },
    },
  },
  {
    tableName: "business_hacks",
    timestamps: true,

    hooks: {
      beforeValidate: (data) => {
        sanitizeBusinessHack(data);
      },
    },
  },
);

// 🔐 Sanitizer (Improved)
function sanitizeBusinessHack(data) {
  if (data.campaignName) {
    data.campaignName = xss(data.campaignName.trim());
  }

  if (data.state) {
    data.state = xss(data.state.trim());
  }

  if (data.city) {
    data.city = xss(data.city.trim());
  }
}

export default BusinessHack;
