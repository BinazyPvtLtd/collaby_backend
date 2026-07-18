import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import xss from "xss";

const CampaignType = sequelize.define(
  "CampaignType",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    typeName: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        len: [2, 50],
        isIn: [["Paid", "Reimbursement", "Barter"]], // keep consistent values
      },
    },
    
  },

  {
    tableName: "campaign_types",
    freezeTableName: true,
    timestamps: true,

    hooks: {
      beforeValidate: (data) => {
        sanitizeCampaignType(data);
      },
    },
  },
  
);

// 🔐 Sanitizer
function sanitizeCampaignType(data) {
  if (data.typeName) {
    data.typeName = xss(data.typeName.trim());
  }

  if (data.id !== undefined) {
    data.id = Number(data.id);
  }
}

export default CampaignType;
