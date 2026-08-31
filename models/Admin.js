import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import xss from "xss";
import bcrypt from "bcryptjs";

const Admin = sequelize.define(
  "Admin",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 100],
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
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [8, 255],
      },
    },
    role: {
      type: DataTypes.ENUM("admin"),
      defaultValue: "admin",
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("active", "inactive"),
      defaultValue: "active",
      allowNull: false,
    },
    access_token: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    refresh_token: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "admins",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",

    hooks: {
      beforeValidate: (data) => {
        sanitizeAdmin(data);
      },
      beforeCreate: async (admin) => {
        const count = await Admin.count();
        if (count > 0) {
          throw new Error("Only one admin is allowed");
        }
        if (admin.password) {
          admin.password = await bcrypt.hash(admin.password, 10);
        }
      },
      beforeUpdate: async (admin) => {
        if (admin.changed("password")) {
          admin.password = await bcrypt.hash(admin.password, 10);
        }
      },
    },
  },
);

function sanitizeAdmin(data) {
  if (data.name) data.name = xss(data.name.trim());
  if (data.email) data.email = xss(data.email.trim().toLowerCase());
}

Admin.prototype.comparePassword = function (plainPassword) {
  return bcrypt.compare(plainPassword, this.password);
};

export default Admin;
