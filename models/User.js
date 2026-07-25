import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import xss from "xss";

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    uuid: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      unique: true,
    },
    name: {
      type: DataTypes.STRING,
      validate: {
        len: [0, 100],
      },
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      validate: {
        isEmail: true,
        notEmpty: true,
        len: [5, 150],
      },
    },
    phone: {
      type: DataTypes.STRING,
      unique: true,
      validate: {
        is: /^[6-9]\d{9}$/,
      },
    },
    role: {
      type: DataTypes.ENUM("influencer", "brand", "admin"),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("pending", "approved", "rejected"),
      defaultValue: "pending",
    },
    refresh_token: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    access_token: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,

    hooks: {
      beforeValidate: (data) => {
        sanitizeUser(data);
      },
    },
  }
);

// 🔐 Sanitizer
function sanitizeUser(data) {
  if (data.name) data.name = xss(data.name.trim());
  if (data.email) data.email = xss(data.email.trim().toLowerCase());
  if (data.phone) data.phone = xss(data.phone.trim());

  if (data.id && typeof data.id !== "string") {
    data.id = String(data.id);
  }
}

// ✅ ADD ASSOCIATION LIKE THIS (correct way)
User.associate = (models) => {
  User.hasMany(models.Influencer, {
    foreignKey: "userId",
  });
};

export default User;