import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import BusinessHack from "./BusinessHacks.js";
import xss from "xss";
const BusinessHackDetail = sequelize.define(
  "BusinessHackDetail",
  {
    businessHackId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isInt: true,
        min: 1,
      },
      references: {
        model: "business_hacks",
        key: "id",
      },
      onDelete: "CASCADE",
      unique: true, // 1-to-1 relationship
    },

    // Deliverables
    noOfReels: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        isInt: true,
        min: 0,
        max: 1000,
      },
    },

    noOfPosts: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        isInt: true,
        min: 0,
        max: 1000,
      },
    },

    noOfStories: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        isInt: true,
        min: 0,
        max: 1000,
      },
    },

    numberOfInfluencersRequired: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isInt: true,
        min: 1,
        max: 100000,
      },
    },

    minimumFollowersRequired: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isInt: true,
        min: 0,
        max: 100000000,
      },
    },

    costPerInfluencer: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        isFloat: true,
        min: 0,
        max: 10000000,
      },
    },

    tax: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        isFloat: true,
        min: 0,
        max: 100,
      },
    },

    totalBudget: {
      type: DataTypes.FLOAT,
      validate: {
        isFloat: true,
        min: 0,
      },
    },

    freeProduct: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    tableName: "business_hack_details",
    timestamps: true,

    hooks: {
      beforeValidate: (data, options) => {
        if (!data.user_id && options.userId) {
          data.user_id = options.userId;
        }
      },

      beforeCreate: (data) => {
        sanitizeData(data);
        calculateBudget(data);
      },

      beforeUpdate: (data) => {
        sanitizeData(data);
        calculateBudget(data);
      },
    },
  },
);

// 🔐 sanitize (minimal here, mostly numeric model)
function sanitizeData(data) {
  if (data.businessHackId) data.businessHackId = parseInt(data.businessHackId);

  if (data.noOfReels) data.noOfReels = parseInt(data.noOfReels);
  if (data.noOfPosts) data.noOfPosts = parseInt(data.noOfPosts);
  if (data.noOfStories) data.noOfStories = parseInt(data.noOfStories);

  if (data.numberOfInfluencersRequired)
    data.numberOfInfluencersRequired = parseInt(
      data.numberOfInfluencersRequired,
    );

  if (data.minimumFollowersRequired)
    data.minimumFollowersRequired = parseInt(data.minimumFollowersRequired);

  if (data.costPerInfluencer)
    data.costPerInfluencer = parseFloat(data.costPerInfluencer);

  if (data.tax) data.tax = parseFloat(data.tax);
}

// 💰 auto-calculate total budget (prevents manipulation)
function calculateBudget(data) {
  if (
    data.numberOfInfluencersRequired &&
    data.costPerInfluencer &&
    data.tax !== undefined
  ) {
    const base = data.numberOfInfluencersRequired * data.costPerInfluencer;

    const taxAmount = (base * data.tax) / 100;

    data.totalBudget = base + taxAmount;
  }
}

// Association
BusinessHack.hasOne(BusinessHackDetail, {
  foreignKey: "businessHackId",
  onDelete: "CASCADE",
});

export default BusinessHackDetail;
