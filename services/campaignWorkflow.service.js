import { Op } from "sequelize";
import sequelize from "../config/database.js";
import Campaign from "../models/Campaign.js";
import BusinessHack from "../models/BusinessHacks.js";
import Detail from "../models/BusinessHackDetail.js";
import Targeting from "../models/BusinessHackDetail2.js";
import Media from "../models/BusinessHackStep4.js";
import Application from "../models/Application.js";
import Deal from "../models/Deal.js";
import ChatRoom from "../models/ChatRoom.js";
import CampaignAudit from "../models/CampaignAudit.js";
import {
  authorize,
  requireCondition,
  requirePermission,
  requireReason,
  requireSupport,
  positiveId,
  planTransition,
  assertObligations,
} from "./campaignPolicy.js";

export const campaignModels = { basic: Campaign, multi: BusinessHack };
export const stepModels = { 2: Detail, 3: Targeting, 4: Media };
export const basicFields = [
  "title",
  "campaignType",
  "budgetPerInfluencer",
  "totalInfluencersNeeded",
  "deliverables",
  "captionRequirements",
  "hashtags",
  "productDetails",
  "shippingDetails",
  "reimbursementPolicy",
  "deadline",
  "targetNiche",
  "targetCity",
  "minimumFollowers",
];
export const multiFields = [
  "campaignName",
  "state",
  "city",
  "campaignType",
  "applicationDeadline",
];
export const stepFields = {
  2: [
    "noOfReels",
    "noOfPosts",
    "noOfStories",
    "numberOfInfluencersRequired",
    "minimumFollowersRequired",
    "costPerInfluencer",
    "tax",
    "freeProduct",
  ],
  3: [
    "influencerCategory",
    "gender",
    "minAge",
    "maxAge",
    "campaignDescription",
    "dos",
    "donts",
    "isDosRequired",
    "isDontsRequired",
  ],
  4: ["campaignImage", "sampleMedia"],
};
export const snapshot = (row) => (row?.toJSON ? row.toJSON() : row);
export function pickFields(body, fields) {
  requireCondition(
    body && typeof body === "object" && !Array.isArray(body),
    400,
    "Request body must be an object",
  );
  return Object.fromEntries(
    fields
      .filter((key) => Object.hasOwn(body, key))
      .map((key) => [key, body[key]]),
  );
}
export function assertDraft(campaign) {
  requireCondition(
    campaign.campaignStatus === "Draft",
    409,
    "Only draft campaigns can be edited",
  );
}
export async function lockCampaign(kind, id, transaction) {
  const campaign = await campaignModels[kind].findByPk(positiveId(id), {
    transaction,
    lock: transaction.LOCK.UPDATE,
  });
  requireCondition(campaign, 404, "Campaign not found");
  return campaign;
}
export async function audit(
  kind,
  campaign,
  actor,
  action,
  input,
  before,
  after,
  transaction,
) {
  await CampaignAudit.create(
    {
      campaignKind: kind,
      campaignId: campaign.id,
      actorType: actor.type,
      actorId: actor.id,
      action,
      reason: input?.reason || null,
      supportCaseId: input?.supportCaseId || null,
      before,
      after,
    },
    { transaction },
  );
}
export async function related(kind, id, transaction) {
  // Applications and deals reference BusinessHacks, never the separate Campaign table.
  if (kind === "basic") return { applications: [], deals: [] };
  const applications = await Application.findAll({
    where: { campaign_id: id },
    transaction,
  });
  const deals = await Deal.findAll({ where: { campaign_id: id }, transaction });
  return { applications, deals };
}
export async function validatePublication(kind, campaign, transaction) {
  const deadline =
    kind === "multi" ? campaign.applicationDeadline : campaign.deadline;
  requireCondition(
    deadline &&
      Number.isFinite(new Date(deadline).getTime()) &&
      new Date(deadline) > new Date(),
    422,
    "A future application deadline is required",
  );
  await campaign.validate({ transaction });
  if (kind === "basic") return;
  const rows = [];
  for (const model of Object.values(stepModels)) {
    const row = await model.findOne({
      where: { businessHackId: campaign.id },
      transaction,
    });
    requireCondition(
      row,
      422,
      "Complete all four campaign steps before publication",
    );
    requireCondition(
      Number(row.user_id) === Number(campaign.user_id),
      409,
      "Campaign step ownership must be repaired before publication",
    );
    await row.validate({ transaction });
    rows.push(row);
  }
  const [detail, targeting] = rows;
  requireCondition(
    Number(detail.noOfReels) +
      Number(detail.noOfPosts) +
      Number(detail.noOfStories) >
      0,
    422,
    "At least one deliverable is required",
  );
  requireCondition(
    campaign.campaignType === "Barter" || Number(detail.costPerInfluencer) > 0,
    422,
    "Paid and reimbursement campaigns require a positive budget",
  );
  requireCondition(
    Array.isArray(targeting.influencerCategory) &&
      targeting.influencerCategory.length > 0,
    422,
    "At least one influencer category is required",
  );
  requireCondition(
    targeting.minAge < targeting.maxAge,
    422,
    "Minimum age must be less than maximum age",
  );
}

export async function transition(kind, id, actor, input) {
  return sequelize.transaction(async (transaction) => {
    const campaign = await lockCampaign(kind, id, transaction);
    const before = snapshot(campaign);
    const patch = planTransition(
      campaign,
      actor,
      input,
      process.env.CAMPAIGN_MODERATION_ENABLED === "true",
    );
    if (Object.hasOwn(input, "applicationDeadline")) {
      requireCondition(
        campaign.campaignStatus === "Closed" && patch.campaignStatus === "Live",
        400,
        "Deadline changes are allowed here only when reopening",
      );
      campaign.set(
        kind === "multi" ? "applicationDeadline" : "deadline",
        input.applicationDeadline,
      );
      patch[kind === "multi" ? "applicationDeadline" : "deadline"] = input.applicationDeadline;
    }
    if (["Live", "Pending Review"].includes(patch.campaignStatus)) {
      await validatePublication(kind, campaign, transaction);
    }
    if (["Completed", "Cancelled"].includes(patch.campaignStatus)) {
      const { applications, deals } = await related(
        kind,
        campaign.id,
        transaction,
      );
      assertObligations(patch.campaignStatus, applications, deals);
      if (kind === "multi" && patch.campaignStatus === "Cancelled") {
        await Application.update(
          { status: "rejected" },
          {
            where: { campaign_id: campaign.id, status: "pending" },
            transaction,
          },
        );
      }
    }
    await campaign.update(patch, { transaction });
    await audit(
      kind,
      campaign,
      actor,
      "status",
      input,
      before,
      snapshot(campaign),
      transaction,
    );
    return campaign;
  });
}

export async function editDraft(kind, id, actor, input) {
  return sequelize.transaction(async (transaction) => {
    const campaign = await lockCampaign(kind, id, transaction);
    authorize(actor, campaign, "campaign:support-edit");
    if (actor.type === "admin") requireSupport(input);
    assertDraft(campaign);
    requireCondition(
      !["campaignStatus", "user_id", "suspendedFrom", "id"].some((field) =>
        Object.hasOwn(input, field),
      ),
      400,
      "Owner, ID and status cannot be changed through editing",
    );
    const data = pickFields(
      input,
      kind === "basic" ? basicFields : multiFields,
    );
    requireCondition(
      Object.keys(data).length > 0,
      400,
      "No editable campaign fields provided",
    );
    const before = snapshot(campaign);
    await campaign.update(data, { transaction });
    await audit(
      kind,
      campaign,
      actor,
      "edit-draft",
      input,
      before,
      snapshot(campaign),
      transaction,
    );
    return campaign;
  });
}

export async function deleteCampaign(kind, id, actor, input) {
  requirePermission(actor, "campaign:delete:any");
  requireSupport(input);
  requireCondition(
    input.confirmPermanentDelete === true,
    400,
    "Exceptional cleanup requires confirmPermanentDelete: true",
  );
  return sequelize.transaction(async (transaction) => {
    const campaign = await lockCampaign(kind, id, transaction);
    requireCondition(
      ["Draft", "Cancelled"].includes(campaign.campaignStatus),
      409,
      "Only draft or cancelled campaigns qualify for exceptional cleanup",
    );
    const { applications, deals } = await related(
      kind,
      campaign.id,
      transaction,
    );
    requireCondition(
      !applications.length && !deals.length,
      409,
      "Campaigns with applications or deals must be preserved",
    );
    if (kind === "multi") {
      requireCondition(
        (await ChatRoom.count({
          where: { campaignId: campaign.id },
          transaction,
        })) === 0,
        409,
        "Campaigns with chat history must be preserved",
      );
      for (const model of Object.values(stepModels))
        await model.destroy({
          where: { businessHackId: campaign.id },
          transaction,
        });
    }
    await audit(
      kind,
      campaign,
      actor,
      "permanent-delete",
      input,
      snapshot(campaign),
      null,
      transaction,
    );
    await campaign.destroy({ transaction });
  });
}

export function visibility(actor, kind) {
  if (actor.type === "admin") {
    requirePermission(actor, "campaign:read:any");
    return {};
  }
  if (actor.type === "business") return { user_id: positiveId(actor.id) };
  requireCondition(actor.type === "influencer", 403, "Campaign access denied");
  return {
    campaignStatus: "Live",
    [kind === "multi" ? "applicationDeadline" : "deadline"]: {
      [Op.gt]: new Date(),
    },
  };
}

export async function resolveDealObligations(id, actor, input) {
  requirePermission(actor, "deal:resolve:any");
  requireSupport(input);
  requireCondition(
    input.obligationsResolved === true,
    400,
    "Confirm obligationsResolved: true after verifying work, payment and disputes",
  );
  const initial = await Deal.findByPk(positiveId(id));
  requireCondition(initial, 404, "Deal not found");
  return sequelize.transaction(async (transaction) => {
    const campaign = await lockCampaign(
      "multi",
      initial.campaign_id,
      transaction,
    );
    requireCondition(
      !["Completed", "Cancelled"].includes(campaign.campaignStatus),
      409,
      "Final campaign records cannot be changed",
    );
    const deal = await Deal.findByPk(initial.id, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    const before = snapshot(deal);
    await deal.update(
      {
        obligationsResolvedAt: new Date(),
        resolutionReference: input.supportCaseId.trim(),
      },
      { transaction },
    );
    await audit(
      "multi",
      campaign,
      actor,
      "resolve-deal-obligations",
      input,
      before,
      snapshot(deal),
      transaction,
    );
    return deal;
  });
}
