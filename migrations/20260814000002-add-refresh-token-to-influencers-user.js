"use strict";

/**
 * Migration: Add refreshToken column to influencersUser table
 * The model defines refreshToken but the column was never added.
 * Fixes 500 error on GET /api/admin/influencers
 * ("column 'refreshToken' does not exist").
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("influencersUser", "refreshToken", {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("influencersUser", "refreshToken");
  },
};
