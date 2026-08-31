"use strict";

/**
 * Migration: Add deletedAt to influencersUser
 *
 * WHY:
 *   The InfluencerUser model has `paranoid: true` (soft delete), so Sequelize
 *   appends `WHERE deletedAt IS NULL` on every query. The table was created
 *   without the `deletedAt` column, causing all InfluencerUser queries (and the
 *   admin dashboard count) to fail with "column InfluencerUser.deletedAt does
 *   not exist". This additive, nullable column aligns the schema with the model.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const cols = await queryInterface.describeTable("influencersUser");
    if (!cols.deletedAt) {
      await queryInterface.addColumn("influencersUser", "deletedAt", {
        type: Sequelize.DATE,
        allowNull: true,
      });
      await queryInterface.addIndex("influencersUser", ["deletedAt"]);
    }
  },

  async down(queryInterface, Sequelize) {
    const cols = await queryInterface.describeTable("influencersUser");
    if (cols.deletedAt) {
      await queryInterface.removeIndex("influencersUser", ["deletedAt"]);
      await queryInterface.removeColumn("influencersUser", "deletedAt");
    }
  },
};