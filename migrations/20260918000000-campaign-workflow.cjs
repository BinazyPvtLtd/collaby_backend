"use strict";

const permissions = [
  "campaign:read:any",
  "campaign:support-edit",
  "campaign:moderate",
  "campaign:close:any",
  "campaign:reopen:any",
  "campaign:complete:any",
  "campaign:cancel:any",
  "campaign:delete:any",
  "application:read:any",
  "application:support",
  "deal:read:any",
  "deal:resolve:any",
];

module.exports = {
  async up(queryInterface, Sequelize, outerTransaction) {
    const migrate = async (transaction) => {
      const options = { transaction };
      await queryInterface.addColumn(
        "business_hacks",
        "campaignStatus",
        { type: Sequelize.STRING(32), allowNull: false, defaultValue: "Draft" },
        options,
      );
      await queryInterface.addColumn(
        "business_hacks",
        "applicationDeadline",
        { type: Sequelize.DATE, allowNull: true },
        options,
      );
      await queryInterface.addColumn(
        "business_hacks",
        "suspendedFrom",
        { type: Sequelize.STRING(32), allowNull: true },
        options,
      );
      await queryInterface.addColumn(
        "Campaigns",
        "suspendedFrom",
        { type: Sequelize.STRING(32), allowNull: true },
        options,
      );
      await queryInterface.sequelize.query(
        'ALTER TABLE "Campaigns" ALTER COLUMN "campaignStatus" DROP DEFAULT',
        options,
      );
      await queryInterface.sequelize.query(
        'ALTER TABLE "Campaigns" ALTER COLUMN "campaignStatus" TYPE VARCHAR(32) USING "campaignStatus"::text',
        options,
      );
      await queryInterface.sequelize.query(
        'ALTER TABLE "Campaigns" ALTER COLUMN "campaignStatus" SET DEFAULT \'Draft\'',
        options,
      );
      await queryInterface.addColumn(
        "admins",
        "permissions",
        { type: Sequelize.JSONB, allowNull: false, defaultValue: [] },
        options,
      );
      // Preserve the existing singleton administrator's access through explicit grants.
      await queryInterface.sequelize.query(
        'UPDATE "admins" SET "permissions" = $1::jsonb',
        { ...options, bind: [JSON.stringify(permissions)] },
      );
      await queryInterface.addColumn(
        "deals",
        "obligationsResolvedAt",
        { type: Sequelize.DATE, allowNull: true },
        options,
      );
      await queryInterface.addColumn(
        "deals",
        "resolutionReference",
        { type: Sequelize.STRING(150), allowNull: true },
        options,
      );
      await queryInterface.createTable(
        "campaign_audits",
        {
          id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
          },
          campaignKind: { type: Sequelize.STRING(16), allowNull: false },
          campaignId: { type: Sequelize.INTEGER, allowNull: false },
          actorType: { type: Sequelize.STRING(16), allowNull: false },
          actorId: { type: Sequelize.INTEGER, allowNull: false },
          action: { type: Sequelize.STRING(80), allowNull: false },
          reason: { type: Sequelize.TEXT },
          supportCaseId: { type: Sequelize.STRING(150) },
          before: { type: Sequelize.JSONB },
          after: { type: Sequelize.JSONB },
          createdAt: { type: Sequelize.DATE, allowNull: false },
        },
        options,
      );
      await queryInterface.addIndex(
        "campaign_audits",
        ["campaignKind", "campaignId"],
        options,
      );
      // Existing active obligations stay manageable, but legacy campaigns do not silently publish.
      await queryInterface.sequelize.query(
        `UPDATE business_hacks AS c SET "campaignStatus" = 'Closed'
        WHERE EXISTS (SELECT 1 FROM applications a WHERE a.campaign_id = c.id)
        OR EXISTS (SELECT 1 FROM deals d WHERE d.campaign_id = c.id)`,
        options,
      );
    };
    if (outerTransaction) await migrate(outerTransaction);
    else await queryInterface.sequelize.transaction(migrate);
  },
  async down() {
    throw new Error(
      "This migration preserves lifecycle and audit records; use a reviewed forward migration to roll back.",
    );
  },
};
