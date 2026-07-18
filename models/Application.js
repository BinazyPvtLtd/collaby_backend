import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import xss from "xss";

const Application = sequelize.define(
  "Application",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    campaign_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isInt: true,
      },
    },

    influencer_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },

    brand_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isInt: true,
      },
    },

    pitch_message: {
      type: DataTypes.TEXT,
      validate: {
        len: [0, 2000], // prevent huge payload attack
      },
    },

    expected_rate: {
      type: DataTypes.FLOAT,
      validate: {
        isFloat: true,
        min: 0, // no negative values
      },
    },

    status: {
      type: DataTypes.ENUM("pending", "accepted", "rejected", "withdrawn"),
      defaultValue: "pending",
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    tableName: "applications",
    timestamps: true,

    hooks: {
      beforeCreate: (application) => {
        if (application.pitch_message) {
          application.pitch_message = xss(application.pitch_message);
        }
      },

      beforeUpdate: (application) => {
        if (application.pitch_message) {
          application.pitch_message = xss(application.pitch_message);
        }
      },
    },
  },
);

export default Application;
