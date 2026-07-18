import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import BusinessHack from "./BusinessHacks.js";
import xss from "xss";

const BusinessHackStep3 = sequelize.define(
  "BusinessHackStep3",
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

    // ✅ FIXED influencerCategory
    influencerCategory: {
      type: DataTypes.JSONB,
      allowNull: false,
      validate: {
        isValidCategory(value) {
          if (!Array.isArray(value)) {
            throw new Error("influencerCategory must be an array");
          }

          if (value.length === 0) {
            throw new Error("At least one influencer category is required");
          }

          const allowedCategories = [
            "Fashion",
            "Lifestyle",
            "Fitness",
            "Beauty",
            "Travel",
            "Food",
            "Tech",
          ];

          value.forEach((item) => {
            if (typeof item !== "string") {
              throw new Error("Each category must be a string");
            }

            const formatted =
              item.charAt(0).toUpperCase() + item.slice(1).toLowerCase();

            if (!allowedCategories.includes(formatted)) {
              throw new Error(`Invalid category: ${item}`);
            }
          });
        },
      },
    },

    gender: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: ["All"],
      validate: {
        isArray(value) {
          if (!Array.isArray(value)) {
            throw new Error("Gender must be an array");
          }
        },
        validValues(value) {
          const allowed = ["Male", "Female", "Other", "All"];
          value.forEach((v) => {
            if (!allowed.includes(v)) {
              throw new Error(`Invalid gender: ${v}`);
            }
          });
        },
      },
    },

    minAge: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isInt: true,
        min: 13,
        max: 100,
      },
    },

    maxAge: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isInt: true,
        min: 13,
        max: 100,
      },
    },

    campaignDescription: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [5, 3000],
      },
    },

    // ✅ FIXED dos
    dos: {
      type: DataTypes.JSONB,
      allowNull: true,
      validate: {
        isArrayOfStrings(value) {
          if (value == null) return;

          if (!Array.isArray(value)) {
            throw new Error("dos must be an array");
          }

          value.forEach((item) => {
            if (typeof item !== "string") {
              throw new Error("Each dos item must be a string");
            }
          });
        },
      },
    },

    // ✅ FIXED donts
    donts: {
      type: DataTypes.JSONB,
      allowNull: true,
      validate: {
        isArrayOfStrings(value) {
          if (value == null) return;

          if (!Array.isArray(value)) {
            throw new Error("donts must be an array");
          }

          value.forEach((item) => {
            if (typeof item !== "string") {
              throw new Error("Each donts item must be a string");
            }
          });
        },
      },
    },

    isDosRequired: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    isDontsRequired: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    tableName: "business_hack_step3",
    timestamps: true,

    hooks: {
      beforeCreate: (data) => {
        sanitizeStep3(data);
        validateAgeLogic(data);
      },
      beforeUpdate: (data) => {
        sanitizeStep3(data);
        validateAgeLogic(data);
      },
    },
  },
  
);

// 🔐 sanitize all inputs
function sanitizeStep3(data) {
  if (data.campaignDescription) {
    data.campaignDescription = xss(data.campaignDescription);
  }

  // sanitize arrays
  if (data.dos && Array.isArray(data.dos)) {
    data.dos = data.dos.map((item) => xss(item));
  }

  if (data.donts && Array.isArray(data.donts)) {
    data.donts = data.donts.map((item) => xss(item));
  }

  // sanitize influencerCategory (deep clean)
  if (data.influencerCategory && typeof data.influencerCategory === "object") {
    Object.keys(data.influencerCategory).forEach((key) => {
      const val = data.influencerCategory[key];
      if (typeof val === "string") {
        data.influencerCategory[key] = xss(val);
      }
    });
  }
}

// 🔐 logical validation
function validateAgeLogic(data) {
  if (data.minAge && data.maxAge && data.minAge > data.maxAge) {
    throw new Error("minAge cannot be greater than maxAge");
  }
}

// Association
BusinessHack.hasOne(BusinessHackStep3, {
  foreignKey: "businessHackId",
  onDelete: "CASCADE",
});

export default BusinessHackStep3;
