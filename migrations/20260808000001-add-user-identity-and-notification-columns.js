"use strict";

/**
 * Migration: Universal User Identity + Notification Schema Refactor
 *
 * WHY:
 *   The project previously used TWO different user identities:
 *     - Business  : business_registration.uuid  (UUID)
 *     - Influencer: influencersUser.id          (INTEGER)
 *   DeviceToken.userId / NotificationRecipient.userId were typed INTEGER,
 *   so business (UUID) notifications could not be sent.
 *
 * WHAT THIS DOES:
 *   1. Creates `user_identities` — a universal actor mapping table.
 *   2. Adds `identity_id` (FK -> user_identities.id) to `device_tokens`
 *      and `notification_recipients` as the canonical reference.
 *   3. Adds `reference_id`, `click_action`, `recipient_count` columns to
 *      `notifications`.
 *   4. Relaxes `device_tokens.user_id` / `notification_recipients.user_id`
 *      to allow NULL (informational, backward-compatible).
 *
 * NOTE: This migration is additive and fully backward-compatible. Existing
 * rows keep their legacy `user_id` values. New rows are keyed by `identity_id`.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    // ============================================================
    // 1) Create the universal user_identities table
    // ============================================================
    await queryInterface.createTable("user_identities", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },

      user_type: {
        type: Sequelize.ENUM("business", "influencer", "admin"),
        allowNull: false,
      },

      business_uuid: {
        type: Sequelize.UUID,
        allowNull: true,
        unique: true,
      },

      influencer_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        unique: true,
      },

      admin_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        unique: true,
      },

      label: {
        type: Sequelize.STRING,
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

    await queryInterface.addIndex("user_identities", ["user_type"]);
    await queryInterface.addIndex("user_identities", [
      "user_type",
      "business_uuid",
    ]);
    await queryInterface.addIndex("user_identities", [
      "user_type",
      "influencer_id",
    ]);
    await queryInterface.addIndex("user_identities", [
      "user_type",
      "admin_id",
    ]);

    // ============================================================
    // 2) device_tokens: add identity_id, relax user_id
    // ============================================================
    await queryInterface.addColumn("device_tokens", "identity_id", {
      type: Sequelize.INTEGER,
      allowNull: true, // temporarily nullable so we can backfill
      references: {
        model: "user_identities",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    });

    await queryInterface.changeColumn("device_tokens", "user_id", {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    await queryInterface.addIndex("device_tokens", ["identity_id"]);

    // ============================================================
    // 3) notifications: add reference_id, click_action, recipient_count
    // ============================================================
    await queryInterface.addColumn("notifications", "reference_id", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn("notifications", "click_action", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn("notifications", "recipient_count", {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });

    await queryInterface.addIndex("notifications", ["reference_id"]);

    // ============================================================
    // 4) notification_recipients: add identity_id, relax user_id
    // ============================================================
    await queryInterface.addColumn(
      "notification_recipients",
      "identity_id",
      {
        type: Sequelize.INTEGER,
        allowNull: true, // temporarily nullable so we can backfill
        references: {
          model: "user_identities",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      }
    );

    await queryInterface.changeColumn("notification_recipients", "user_id", {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    await queryInterface.addIndex("notification_recipients", ["identity_id"]);
  },

  async down(queryInterface, Sequelize) {
    // Remove identity_id indexes
    await queryInterface.removeIndex("notification_recipients", [
      "identity_id",
    ]);
    await queryInterface.removeIndex("device_tokens", ["identity_id"]);
    await queryInterface.removeIndex("notifications", ["reference_id"]);

    // Drop added columns
    await queryInterface.removeColumn(
      "notification_recipients",
      "identity_id"
    );
    await queryInterface.removeColumn("notifications", "recipient_count");
    await queryInterface.removeColumn("notifications", "click_action");
    await queryInterface.removeColumn("notifications", "reference_id");
    await queryInterface.removeColumn("device_tokens", "identity_id");

    // Drop the universal identity table
    await queryInterface.dropTable("user_identities");
  },
};
