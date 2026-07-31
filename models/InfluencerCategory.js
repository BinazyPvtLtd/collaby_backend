import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

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
    },
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "influencer_category",
    timestamps: true,
  }
);

export default InfluencerCategory;