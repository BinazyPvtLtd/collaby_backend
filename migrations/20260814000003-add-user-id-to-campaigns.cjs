"use strict";

/**
 * Migration: Add user_id column to Campaigns table
 * The model defines user_id but the column was never added.
 * Fixes 500 error on GET /api/admin/campaigns
 * ("column Campaign.user_id does not exist").
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Campaigns", "user_id", {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Campaigns", "user_id");
  },
};