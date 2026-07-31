import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const ContentCategory = sequelize.define(
  "ContentCategory",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    category_name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    status: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: "content_categories",
    timestamps: true,
  }
);

export default ContentCategory;