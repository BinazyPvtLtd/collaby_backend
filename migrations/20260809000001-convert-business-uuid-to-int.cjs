"use strict";

/**
 * Migration: Convert Business identity from UUID to INTEGER
 *
 * WHY:
 *   BusinessRegistration previously used an implicit UUID primary key
 *   (`uuid` column with DataTypes.UUID / UUIDV4). Every related foreign key
 *   (business_hacks.user_id, campaigns.user_id, user_identities.business_uuid,
 *   deals.business_id, etc.) referenced this UUID.
 *
 *   Influencer identities use INTEGER (influencersUser.id). Mixing a UUID
 *   business identity with an INTEGER influencer identity caused type
 *   collisions in shared APIs and the notification system.
 *
 * WHAT THIS DOES:
 *   1. Ensures `business_registration` has an explicit INTEGER auto-increment
 *      primary key `id` (the Sequelize model now declares it this way).
 *   2. Drops the identity `uuid` column from `business_registration`.
 *   3. Converts `user_identities.business_uuid` (UUID) -> `business_id`
 *      (INTEGER) so business actors are keyed the same way as influencers.
 *
 * !!! IMPORTANT DATA-STRATEGY NOTE !!!
 *   Because existing UUID values CANNOT be cast to INTEGER, this migration is
 *   meant to run against a CLEAN/development database (drop & recreate).
 *   It does not attempt to migrate live UUID rows into integers — that is not
 *   safely possible in-place.
 *
 *   For a clean dev reset with `sequelize.sync({ force: true })` + reseed,
 *   the model definitions alone are sufficient. This migration exists so that
 *   environments using the Sequelize-CLI migration runner get the same
 *   final schema.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    // ============================================================
    // 1) business_registration: ensure INTEGER auto-increment PK
    // ============================================================
    // The model declares `id` as INTEGER autoIncrement primaryKey.
    // On a clean database this is created by sync(). For migration-based
    // environments we ensure an integer `id` column exists.
    await queryInterface.addColumn("business_registration", "id", {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    }).catch(() => {
      // Column may already exist if sync() ran first — ignore.
    });

    // 2) Drop the identity `uuid` column (no longer used for identity).
    //    Keep this guarded: it is safe on a clean DB. UUID strings cannot be
    //    cast to INTEGER so we do NOT attempt an in-place cast of existing rows.
    await queryInterface.removeColumn("business_registration", "uuid").catch(
      () => {
        // Column may not exist yet — ignore.
      }
    );

    // ============================================================
    // 3) user_identities: throw-away the UUID business reference,
    //    replace with an INTEGER business reference.
    // ============================================================
    const identityColumns = await queryInterface.describeTable(
      "user_identities"
    ).catch(() => null);

    if (identityColumns) {
      if (identityColumns.business_uuid) {
        // Drop old unique index if present
        await queryInterface
          .removeIndex("user_identities", [
            "user_type",
            "business_uuid",
          ])
          .catch(() => {});
        await queryInterface
          .removeColumn("user_identities", "business_uuid")
          .catch(() => {});
      }

      if (!identityColumns.business_id) {
        await queryInterface.addColumn("user_identities", "business_id", {
          type: Sequelize.INTEGER,
          allowNull: true,
          unique: true,
        });

        await queryInterface
          .addIndex("user_identities", ["user_type", "business_id"], {
            unique: true,
          })
          .catch(() => {});
      }
    }
  },

  async down(queryInterface, Sequelize) {
    // Best-effort rollback: re-add a UUID business reference.
    const identityColumns = await queryInterface
      .describeTable("user_identities")
      .catch(() => null);

    if (identityColumns) {
      if (identityColumns.business_id) {
        await queryInterface
          .removeIndex("user_identities", ["user_type", "business_id"])
          .catch(() => {});
        await queryInterface
          .removeIndex("user_identities", ["business_id"])
          .catch(() => {});
        await queryInterface
          .removeColumn("user_identities", "business_id")
          .catch(() => {});
      }

      if (!identityColumns.business_uuid) {
        await queryInterface.addColumn("user_identities", "business_uuid", {
          type: Sequelize.UUID,
          allowNull: true,
          unique: true,
        });
      }
    }
  },
};

