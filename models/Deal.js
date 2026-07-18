import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import xss from "xss";
import { validate as isUUID } from "uuid";

const Deal = sequelize.define(
  "Deal",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    campaign_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { isInt: true, min: 1 },
    },

    application_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { isInt: true, min: 1 },
    },

    influencer_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    business_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },

    brand_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { isInt: true, min: 1 },
    },

    agreed_price: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
      validate: {
        isFloat: true,
        min: 0,
        max: 10000000,
      },
    },

    deal_status: {
      type: DataTypes.ENUM(
        "accepted",
        "submitted",
        "under_review",
        "approved",
        "rejected",
        "completed",
      ),
      defaultValue: "accepted",
    },

    content_link: {
      type: DataTypes.TEXT,
      validate: {
        len: [0, 1000],
        isUrl: true,
      },
    },

    proof_files: {
      type: DataTypes.JSON,
      validate: {
        isArray(value) {
          if (value && !Array.isArray(value)) {
            throw new Error("proof_files must be an array");
          }
        },
        maxItems(value) {
          if (value && value.length > 10) {
            throw new Error("Max 10 proof files allowed");
          }
        },
      },
    },

    submitted_at: {
      type: DataTypes.DATE,
      validate: {
        isDate: true,
      },
    },

    approved_at: {
      type: DataTypes.DATE,
      validate: {
        isDate: true,
      },
    },

    // optional display fields
    businessName: {
      type: DataTypes.STRING,
      validate: { len: [0, 150] },
    },

    influencerName: {
      type: DataTypes.STRING,
      validate: { len: [0, 150] },
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    tableName: "deals",
    timestamps: true,
    freezeTableName: true,

    hooks: {
      beforeValidate: (data) => {
        sanitizeDeal(data);
        enforceStatusLogic(data);
      },
    },
  },
);

// 🔐 Sanitizer
function sanitizeDeal(data) {
  if (data.content_link) {
    data.content_link = xss(data.content_link.trim());
  }

  if (data.businessName) {
    data.businessName = xss(data.businessName.trim());
  }

  if (data.influencerName) {
    data.influencerName = xss(data.influencerName.trim());
  }

  // sanitize proof files
  if (data.proof_files && Array.isArray(data.proof_files)) {
    data.proof_files = data.proof_files.map((file) =>
      typeof file === "string" ? xss(file.trim()) : file,
    );
  }

  // safe number conversion
  // INTEGER fields only
  ["campaign_id", "application_id", "brand_id"].forEach((field) => {
    if (data[field] !== undefined) {
      data[field] = Number(data[field]);

      if (Number.isNaN(data[field])) {
        throw new Error(`Invalid ${field}`);
      }
    }
  });

  if (data.agreed_price !== undefined) {
    data.agreed_price = Number(data.agreed_price);
  }
}

// 🔐 Status Flow Protection (VERY IMPORTANT)
function enforceStatusLogic(data) {
  const validFlow = {
    accepted: ["submitted"],
    submitted: ["under_review", "rejected"],
    under_review: ["approved", "rejected"],
    approved: ["completed"],
    rejected: [],
    completed: [],
  };

  if (data._previousDataValues?.deal_status) {
    const current = data._previousDataValues.deal_status;
    const next = data.deal_status;

    if (current !== next && !validFlow[current]?.includes(next)) {
      throw new Error(`Invalid status transition: ${current} → ${next}`);
    }
  }

  // auto timestamps
  if (data.deal_status === "submitted" && !data.submitted_at) {
    data.submitted_at = new Date();
  }

  if (data.deal_status === "approved" && !data.approved_at) {
    data.approved_at = new Date();
  }
}

export default Deal;
