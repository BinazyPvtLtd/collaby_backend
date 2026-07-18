import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import xss from "xss";

const Campaign = sequelize.define(
  "Campaign",
  {
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [3, 150],
      },
    },

    campaignType: {
      type: DataTypes.ENUM("Paid", "Reimbursement", "Barter"),
      allowNull: false,
    },

    budgetPerInfluencer: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      validate: {
        isDecimal: true,
        min: 0,
      },
    },

    totalInfluencersNeeded: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isInt: true,
        min: 1,
        max: 100000,
      },
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    deliverables: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 100],
      },
    },

    captionRequirements: {
      type: DataTypes.TEXT,
      validate: {
        len: [0, 2000],
      },
    },

    hashtags: {
      type: DataTypes.STRING,
      validate: {
        len: [0, 500],
      },
    },

    productDetails: {
      type: DataTypes.TEXT,
      validate: {
        len: [0, 2000],
      },
    },

    shippingDetails: {
      type: DataTypes.TEXT,
      validate: {
        len: [0, 2000],
      },
    },

    reimbursementPolicy: {
      type: DataTypes.TEXT,
      validate: {
        len: [0, 2000],
      },
    },

    deadline: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        isDate: true,
      },
    },

    targetNiche: {
      type: DataTypes.STRING,
      validate: {
        len: [0, 100],
      },
    },

    targetCity: {
      type: DataTypes.STRING,
      validate: {
        len: [0, 100],
      },
    },

    minimumFollowers: {
      type: DataTypes.INTEGER,
      validate: {
        isInt: true,
        min: 0,
        max: 100000000,
      },
    },

    campaignStatus: {
      type: DataTypes.ENUM("Draft", "Live", "Closed", "Completed"),
      allowNull: false,
      defaultValue: "Draft",
    },
  },
  {
    timestamps: true,

    hooks: {
      beforeValidate: (data) => {
        sanitizeCampaign(data);
        validateLogic(data);
      },
    },
  },
);

// 🔐 Sanitizer
function sanitizeCampaign(data) {
  const fields = [
    "title",
    "deliverables",
    "captionRequirements",
    "hashtags",
    "productDetails",
    "shippingDetails",
    "reimbursementPolicy",
    "targetNiche",
    "targetCity",
  ];

  fields.forEach((field) => {
    if (data[field]) {
      data[field] = xss(data[field].toString().trim());
    }
  });

  // number safety
  if (data.totalInfluencersNeeded !== undefined) {
    data.totalInfluencersNeeded = Number(data.totalInfluencersNeeded);
  }

  if (data.minimumFollowers !== undefined) {
    data.minimumFollowers = Number(data.minimumFollowers);
  }

  if (data.budgetPerInfluencer !== undefined) {
    data.budgetPerInfluencer = Number(data.budgetPerInfluencer);
  }
}

// 🔐 Business Logic Validation
function validateLogic(data) {
  // deadline should not be in past
  if (data.deadline && new Date(data.deadline) < new Date()) {
    throw new Error("Deadline cannot be in the past");
  }

  // Paid campaigns must have budget
  if (
    data.campaignType === "Paid" &&
    (!data.budgetPerInfluencer || data.budgetPerInfluencer <= 0)
  ) {
    throw new Error("Paid campaign must have budget");
  }
}

export default Campaign;
