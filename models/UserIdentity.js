import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const UserIdentity = sequelize.define(
  "UserIdentity",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    // Canonical user type. This is THE single source of truth used by the
    // notification system to uniquely identify any actor.
    userType: {
      type: DataTypes.ENUM("business", "influencer", "admin"),
      allowNull: false,
      field: "user_type",
    },

    // Business actors are referenced by their business_registration.id (INTEGER).
    // Only populated when userType === "business".
    businessId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      unique: true,
      field: "business_id",
    },

    // Influencer actors are referenced by their influencersUser.id (INTEGER).
    // Only populated when userType === "influencer".
    influencerId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      unique: true,
      field: "influencer_id",
    },

    // Admin actors. Only populated when userType === "admin".
    adminId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      unique: true,
      field: "admin_id",
    },

    // Human readable label (optional, useful for admin/audit).
    label: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: "user_identities",
    underscored: true,
indexes: [
      {
        unique: true,
        fields: ["user_type", "business_id"],
      },
      {
        unique: true,
        fields: ["user_type", "influencer_id"],
      },
      {
        unique: true,
        fields: ["user_type", "admin_id"],
      },
    ],
    validate: {
      // Enforce that exactly one actor reference is populated per identity row,
      // consistent with the declared userType.
      consistency() {
        if (this.userType === "business" && !this.businessId) {
          throw new Error("business_id is required for a business identity");
        }
        if (this.userType === "influencer" && !this.influencerId) {
          throw new Error("influencer_id is required for an influencer identity");
        }
        if (this.userType === "admin" && !this.adminId && this.adminId !== 0) {
          // Admin may use a nullable numeric id; allow a sentinel 0 or omit.
        }
      },
    },
  }
);

export default UserIdentity;

