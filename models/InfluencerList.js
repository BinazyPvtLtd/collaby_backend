import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import xss from "xss";

const InfluencerList = sequelize.define(
  "InfluencerList",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 100],
      },
    },

    followers: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 50],
        is: /^[0-9.,KMBkmb ]+$/, // allows: 10K, 1.2M, 5000
      },
    },

    desc: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [5, 2000],
      },
    },
    
  },
  {
    tableName: "influencer_list",
    timestamps: true,

    hooks: {
      beforeValidate: (data) => {
        sanitizeInfluencerList(data);
      },
    },
  },
);

// 🔐 Sanitizer
function sanitizeInfluencerList(data) {
  if (data.name) {
    data.name = xss(data.name.trim());
  }

  if (data.followers) {
    data.followers = xss(data.followers.trim());
  }

  if (data.desc) {
    data.desc = xss(data.desc);
  }

  if (data.id !== undefined) {
    data.id = Number(data.id);
  }
}

export default InfluencerList;
