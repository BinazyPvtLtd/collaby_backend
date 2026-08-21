'use strict'

/**
 * Migration: Add brand_archived_at / creator_archived_at to chat_rooms
 *
 * WHY:
 *   ChatRoom model defines `brandArchivedAt` and `creatorArchivedAt` attributes
 *   which Sequelize maps (via `underscored: true`) to `brand_archived_at` /
 *   `creator_archived_at` columns. However `sync({ alter: false })` only
 *   creates missing TABLES — it never adds columns to an existing table —
 *   so the `chat_rooms` table was created without these columns, producing:
 *     error: column "brand_archived_at" does not exist
 *   when the accept-application flow runs ChatService.createRoom().
 *
 * This migration adds the two nullable timestamp columns so the existing
 * model + chat.controller.js archive logic works.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = 'chat_rooms'

    const brandColumn = await queryInterface.describeTable(table)
      .then(cols => Object.prototype.hasOwnProperty.call(cols, 'brand_archived_at'))
      .catch(() => false)

    if (!brandColumn) {
      await queryInterface.addColumn(table, 'brand_archived_at', {
        type: Sequelize.DATE,
        allowNull: true
      })
    }

    const creatorColumn = await queryInterface.describeTable(table)
      .then(cols => Object.prototype.hasOwnProperty.call(cols, 'creator_archived_at'))
      .catch(() => false)

    if (!creatorColumn) {
      await queryInterface.addColumn(table, 'creator_archived_at', {
        type: Sequelize.DATE,
        allowNull: true
      })
    }
  },

  async down(queryInterface) {
    const table = 'chat_rooms'

    const cols = await queryInterface.describeTable(table).catch(() => ({}))

    if (Object.prototype.hasOwnProperty.call(cols, 'creator_archived_at')) {
      await queryInterface.removeColumn(table, 'creator_archived_at')
    }

    if (Object.prototype.hasOwnProperty.call(cols, 'brand_archived_at')) {
      await queryInterface.removeColumn(table, 'brand_archived_at')
    }
  }
}
