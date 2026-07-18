import { DataTypes, Sequelize } from "sequelize";
import sequelize from "../config/database.js";
import xss from "xss";

const Influencer = sequelize.define(
  "Influencer",
  {
    // ✅ ADD THIS BLOCK (MOST IMPORTANT)
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    fullName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 100],
      },
    },

    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true, // ✅ THIS LINE FIXES EVERYTHING
      field: "user_id",
    },

    slug: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 150],
        is: /^[a-z0-9-]+$/, // SEO safe slug
      },
    },

    profilePhoto: {
      type: DataTypes.STRING,
      validate: {
        len: [0, 500], // increase length if needed
      },
    },

    instagramUsername: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        len: [2, 100],
        is: /^[a-zA-Z0-9._]+$/, // valid IG username
      },
    },

    followersCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        isInt: true,
        min: 0,
        max: 1000000000,
      },
    },

    engagementRate: {
      type: DataTypes.FLOAT,
      validate: {
        isFloat: true,
        min: 0,
        max: 100,
      },
    },

    niche: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: Sequelize.literal("ARRAY[]::TEXT[]"),
    },

    city: {
      type: DataTypes.STRING,
      validate: {
        len: [0, 100],
      },
    },

    bio: {
      type: DataTypes.TEXT,
      validate: {
        len: [0, 2000],
      },
    },

    rateCard: {
      type: DataTypes.FLOAT,
      validate: {
        isFloat: true,
        min: 0,
        max: 10000000,
      },
    },

    portfolioLinks: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: Sequelize.literal("ARRAY[]::TEXT[]"),
    },

    languages: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: Sequelize.literal("ARRAY[]::TEXT[]"),
    },

    gender: {
      type: DataTypes.ENUM("Male", "Female", "Other"),
      allowNull: false,
    },

    contentCategories: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: Sequelize.literal("ARRAY[]::TEXT[]"),
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
        notEmpty: true,
        len: [5, 150],
      },
    },

    dob: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        isDate: true,
        isBefore: new Date().toISOString(), // DOB must be in past
      },
    },
  },
  {
    timestamps: true,

    hooks: {
      beforeValidate: (data) => {
        sanitizeInfluencer(data);
      },
    },
  },
);

// 🔐 Sanitizer
function sanitizeInfluencer(data) {
  if (data.fullName) data.fullName = xss(data.fullName.trim());

  if (data.slug) {
    data.slug = xss(data.slug.trim().toLowerCase());
  }

  if (data.profilePhoto) {
    data.profilePhoto = xss(data.profilePhoto.trim());
  }

  if (data.instagramUsername) {
    data.instagramUsername = xss(data.instagramUsername.trim());
  }

  if (data.city) data.city = xss(data.city.trim());
  if (data.bio) data.bio = xss(data.bio);
  if (data.email) data.email = xss(data.email.trim().toLowerCase());
  if (data.dob) data.dob = xss(data.dob);

  // sanitize arrays
  const arrayFields = [
    "niche",
    "portfolioLinks",
    "languages",
    "contentCategories",
  ];

  arrayFields.forEach((field) => {
    if (data[field] && Array.isArray(data[field])) {
      data[field] = data[field].map((item) =>
        typeof item === "string" ? xss(item.trim()) : item,
      );
    }
  });

  // safe numbers
  if (data.followersCount !== undefined) {
    data.followersCount = Number(data.followersCount);
    if (Number.isNaN(data.followersCount) || data.followersCount < 0) {
      data.followersCount = 0;
    }
  }

  if (data.engagementRate !== undefined) {
    data.engagementRate = Number(data.engagementRate);
  }

  if (data.rateCard !== undefined) {
    data.rateCard = Number(data.rateCard);
  }
}
Influencer.associate = (models) => {
  Influencer.belongsTo(models.User, {
    foreignKey: "userId",
  });
};

export default Influencer;
