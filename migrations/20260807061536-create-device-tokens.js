"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("device_tokens", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },

      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },

      user_type: {
        type: Sequelize.ENUM(
          "business",
          "influencer",
          "admin"
        ),
        allowNull: false,
      },

      device_type: {
        type: Sequelize.ENUM(
          "android",
          "ios",
          "web"
        ),
        allowNull: false,
      },

      fcm_token: {
        type: Sequelize.TEXT,
        allowNull: false,
        unique: true,
      },

      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
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

    await queryInterface.addIndex("device_tokens", ["user_id"]);
    await queryInterface.addIndex("device_tokens", ["user_type"]);
    await queryInterface.addIndex("device_tokens", ["fcm_token"]);
    await queryInterface.addIndex("device_tokens", [
      "user_id",
      "user_type",
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("device_tokens");
  },
};