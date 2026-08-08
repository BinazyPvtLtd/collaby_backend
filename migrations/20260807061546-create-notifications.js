"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("notifications", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },

      title: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      body: {
        type: Sequelize.TEXT,
        allowNull: false,
      },

      image_url: {
        type: Sequelize.TEXT,
      },

      type: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      data: {
        type: Sequelize.JSONB,
      },

      created_by: {
        type: Sequelize.INTEGER,
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

    await queryInterface.addIndex("notifications", ["type"]);
    await queryInterface.addIndex("notifications", ["created_by"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("notifications");
  },
};