import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

// No campaign foreign key: the audit must survive exceptional cleanup.
export default sequelize.define(
  "CampaignAudit",
  {
    campaignKind: { type: DataTypes.STRING(16), allowNull: false },
    campaignId: { type: DataTypes.INTEGER, allowNull: false },
    actorType: { type: DataTypes.STRING(16), allowNull: false },
    actorId: { type: DataTypes.INTEGER, allowNull: false },
    action: { type: DataTypes.STRING(80), allowNull: false },
    reason: { type: DataTypes.TEXT, allowNull: true },
    supportCaseId: { type: DataTypes.STRING(150), allowNull: true },
    before: { type: DataTypes.JSONB, allowNull: true },
    after: { type: DataTypes.JSONB, allowNull: true },
  },
  {
    tableName: "campaign_audits",
    updatedAt: false,
    indexes: [{ fields: ["campaignKind", "campaignId"] }],
  },
);
