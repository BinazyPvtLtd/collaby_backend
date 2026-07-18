import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import xss from "xss";

const BusinessHacks = sequelize.define(
  "BusinessHacksVideo",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },

    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
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
      type: DataTypes.STRING(255),
      validate: {
        len: [0, 255],
        is: /^[a-zA-Z0-9._/-]*$/i, // safe file path
      },
    },

    video: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        len: [0, 255],
        is: /^[a-zA-Z0-9._/-]*$/i, // safe file path
      },
    },

    uploader: {
      type: DataTypes.STRING(100),
      validate: {
        len: [0, 100],
      },
    },

    duration: {
      type: DataTypes.STRING(20),
      validate: {
        len: [0, 20],
        is: /^[0-9:]*$/, // format like 10:30
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
    tableName: "business_hacks_video",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",

    hooks: {
      beforeValidate: (data) => {
        sanitizeVideo(data);
      },
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
);

// 🔐 Sanitizer
function sanitizeVideo(data) {
  if (data.title) {
    data.title = xss(data.title.trim());
  }

  if (data.description) {
    data.description = xss(data.description);
  }

  if (data.thumbnail) {
    data.thumbnail = xss(data.thumbnail.trim());
  }

  if (data.video) {
    data.video = xss(data.video.trim());
  }

  if (data.uploader) {
    data.uploader = xss(data.uploader.trim());
  }

  if (data.duration) {
    data.duration = xss(data.duration.trim());
  }

  // safe number conversion (extra safety)
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

export default BusinessHacks;
