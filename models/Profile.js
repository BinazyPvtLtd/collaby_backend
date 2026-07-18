import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import xss from "xss";

const Profile = sequelize.define(
  "Profile",
  {
    name: {
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

    businessName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 150],
      },
    },

    businessCategories: {
      type: DataTypes.STRING,
      validate: {
        len: [0, 150],
      },
    },

    headQuarters: {
      type: DataTypes.STRING,
      validate: {
        len: [0, 150],
      },
    },

    foundedIn: {
      type: DataTypes.INTEGER,
      validate: {
        isInt: true,
        min: 1800,
        max: new Date().getFullYear(),
      },
    },

    website: {
      type: DataTypes.STRING,
      validate: {
        isUrl: true,
        len: [0, 255],
      },
    },

    bio: {
      type: DataTypes.TEXT,
      validate: {
        len: [0, 2000],
      },
    },

    businessDetails: {
      type: DataTypes.TEXT,
      validate: {
        len: [0, 3000],
      },
    },

    gstin: {
      type: DataTypes.STRING,
      validate: {
        is: /^[0-9A-Z]{15}$/,
      },
    },

    panNumber: {
      type: DataTypes.STRING,
      validate: {
        is: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
      },
    },

    businessAddress: {
      type: DataTypes.TEXT,
      validate: {
        len: [0, 500],
      },
    },

    postalCode: {
      type: DataTypes.STRING,
      validate: {
        is: /^[1-9][0-9]{5}$/,
      },
    },

    profileImage: {
      type: DataTypes.STRING,
      validate: {
        len: [0, 255],
        is: /^[a-zA-Z0-9._/-]*$/i,
      },
    },
  },
  {
    timestamps: true,

    hooks: {
      beforeValidate: (data) => {
        sanitizeProfile(data);
      },
    },
  },
);

// 🔐 Sanitizer
function sanitizeProfile(data) {
  const textFields = [
    "name",
    "businessName",
    "businessCategories",
    "headQuarters",
    "bio",
    "businessDetails",
    "businessAddress",
  ];

  textFields.forEach((field) => {
    if (data[field]) {
      data[field] = xss(data[field].trim());
    }
  });

  if (data.website) {
    data.website = xss(data.website.trim());
  }

  if (data.profileImage) {
    data.profileImage = xss(data.profileImage.trim());
  }

  if (data.gstin) {
    data.gstin = xss(data.gstin.trim().toUpperCase());
  }

  if (data.panNumber) {
    data.panNumber = xss(data.panNumber.trim().toUpperCase());
  }

  if (data.postalCode) {
    data.postalCode = xss(data.postalCode.trim());
  }

  if (data.foundedIn !== undefined) {
    data.foundedIn = Number(data.foundedIn);
  }
}

export default Profile;
