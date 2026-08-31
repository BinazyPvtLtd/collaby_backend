"use strict";

/**
 * Migration: Create admins table
 * Used by the admin panel backend to store admin accounts.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("admins", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },

      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },

      password: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      role: {
        type: Sequelize.ENUM("admin"),
        allowNull: false,
        defaultValue: "admin",
      },

      status: {
        type: Sequelize.ENUM("active", "inactive"),
        allowNull: false,
        defaultValue: "active",
      },

      access_token: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      refresh_token: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },

      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.addIndex("admins", ["email"]);
    await queryInterface.addIndex("admins", ["role"]);
    await queryInterface.addIndex("admins", ["status"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("admins");
  },
};
