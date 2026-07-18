import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import xss from "xss";

const InHacks = sequelize.define(
  "InHacks",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },

    title: {
      type: DataTypes.STRING,
      validate: {
        len: [2, 150],
      },
    },

    description: {
      type: DataTypes.TEXT,
      validate: {
        len: [0, 2000],
      },
    },

    thumbnail: {
      type: DataTypes.STRING,
      validate: {
        len: [0, 255],
        is: /^[a-zA-Z0-9._/-]*$/i, // safe file path
      },
    },

    video_url: {
      type: DataTypes.STRING,
      validate: {
        len: [0, 255],
      },
    },

    uploader: {
      type: DataTypes.STRING,
      validate: {
        len: [0, 100],
      },
    },

    duration: {
      type: DataTypes.STRING,
      validate: {
        len: [0, 20],
        is: /^[0-9:]*$/, // 10:30 format
      },
    },

    views: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        isInt: true,
        min: 0,
      },
    },

    likes: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        isInt: true,
        min: 0,
      },
    },
  },
  {
    tableName: "inhacks",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",

    hooks: {
      beforeValidate: (data) => {
        sanitizeInHacks(data);
      },
    },
  },
);

// 🔐 Sanitizer
function sanitizeInHacks(data) {
  if (data.title) data.title = xss(data.title.trim());
  if (data.description) data.description = xss(data.description);
  if (data.thumbnail) data.thumbnail = xss(data.thumbnail.trim());
  if (data.video_url) data.video_url = xss(data.video_url.trim());
  if (data.uploader) data.uploader = xss(data.uploader.trim());
  if (data.duration) data.duration = xss(data.duration.trim());

  // safe numbers
  if (data.views !== undefined) {
    data.views = Number(data.views);
    if (Number.isNaN(data.views) || data.views < 0) {
      data.views = 0;
    }
  }

  if (data.likes !== undefined) {
    data.likes = Number(data.likes);
    if (Number.isNaN(data.likes) || data.likes < 0) {
      data.likes = 0;
    }
  }
}

export default InHacks;
