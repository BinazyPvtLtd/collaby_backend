import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import xss from "xss";

const InfluencerCategory = sequelize.define(
  "InfluencerCategory",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    influencer_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isInt: true,
        min: 1,
      },
      references: {
        model: "influencersUser",
        key: "id",
      },
    },

    categoryName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 100],
      },
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    tableName: "influencer_category",
    timestamps: true,

    hooks: {
      beforeValidate: (data) => {
        sanitizeInfluencerCategory(data);
      },
    },
  },
);

// 🔐 Sanitizer
function sanitizeInfluencerCategory(data) {
  if (data.categoryName) {
    data.categoryName = xss(data.categoryName.trim());
  }

  if (data.influencer_id !== undefined) {
    data.influencer_id = Number(data.influencer_id);

    if (Number.isNaN(data.influencer_id)) {
      throw new Error("Invalid influencer_id");
    }
  }
}

export default InfluencerCategory;
