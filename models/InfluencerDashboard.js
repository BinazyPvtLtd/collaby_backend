import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import xss from "xss";

const InfluencerDashboard = sequelize.define(
  "influencer_dashboard",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    device_type: {
      type: DataTypes.STRING,
      validate: {
        len: [0, 50],
        isIn: [["android", "ios", "web"]], // restrict known devices
      },
    },

    token: {
      type: DataTypes.TEXT,
      validate: {
        len: [0, 1000],
      },
    },
  },
  {
    timestamps: true,

    hooks: {
      beforeValidate: (data) => {
        sanitizeDashboard(data);
      },
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
);

// 🔐 Sanitizer
function sanitizeDashboard(data) {
  if (data.device_type) {
    data.device_type = xss(data.device_type.trim().toLowerCase());
  }

  if (data.token) {
    data.token = xss(data.token.trim());
  }

  if (data.id !== undefined) {
    data.id = Number(data.id);
  }
}

export default InfluencerDashboard;
