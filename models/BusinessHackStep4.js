import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import BusinessHack from "./BusinessHacks.js";
import xss from "xss";

const BusinessHackStep4 = sequelize.define(
  "BusinessHackStep4",
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
    },

    campaignImage: {
      type: DataTypes.STRING,
      allowNull: true,
      // validate: {
      //   len: {
      //     args: [0, 255],
      //     msg: "Image path must be less than 255 characters",
      //   },
      //   isValidPath(value) {
      //     if (!value) return; // allow empty/null

      //     // simple safe file path check
      //     const regex = /^[a-zA-Z0-9._/-]+$/;

      //     if (!regex.test(value)) {
      //       throw new Error("Invalid image path format");
      //     }
      //   },
      // },
    },

    sampleMedia: {
      type: DataTypes.JSON,
      validate: {
        isArray(value) {
          if (value && !Array.isArray(value)) {
            throw new Error("sampleMedia must be an array");
          }
        },
        maxItems(value) {
          if (value && value.length > 20) {
            throw new Error("Too many media files (max 20)");
          }
        },
      },
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    tableName: "business_hack_step4",
    timestamps: true,

    hooks: {
      beforeValidate: (data) => {
        sanitizeStep4(data);
      },
    },
  },
);

// 🔐 Sanitizer
function sanitizeStep4(data) {
  // sanitize single image path
  if (data.campaignImage) {
    data.campaignImage = xss(data.campaignImage.trim());
  }

  // sanitize array of media paths
  if (data.sampleMedia && Array.isArray(data.sampleMedia)) {
    data.sampleMedia = data.sampleMedia.map((item) => {
      if (typeof item === "string") {
        return xss(item.trim());
      }
      return item;
    });
  }

  // ensure businessHackId is number
  if (data.businessHackId !== undefined) {
    data.businessHackId = Number(data.businessHackId);

    if (Number.isNaN(data.businessHackId)) {
      throw new Error("Invalid businessHackId");
    }
  }
}

// Association
BusinessHack.hasOne(BusinessHackStep4, {
  foreignKey: "businessHackId",
  onDelete: "CASCADE",
});

export default BusinessHackStep4;
