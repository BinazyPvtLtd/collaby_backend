import { Op } from "sequelize";
import sequelize from "../config/database.js";
import Deal from "../models/Deal.js";
import BusinessHack from "../models/BusinessHacks.js";
import notificationService from "../services/notification.service.js";
import { actorFrom, requireCondition, positiveId, requireOwner } from "../services/campaignPolicy.js";
import { lockCampaign, audit, snapshot } from "../services/campaignWorkflow.service.js";
import { endpoint } from "./campaignWorkflow.controller.js";

const listDeals = (role) => endpoint(async (req, res) => {
  const actor = actorFrom(req);
  requireCondition(actor.type === role, 403, `${role} access required`);
  let where = { influencer_id: actor.id };
  if (role === "business") {
    const campaigns = await BusinessHack.findAll({ where: { user_id: actor.id }, attributes: ["id"] });
    where = { campaign_id: { [Op.in]: campaigns.map((row) => row.id) } };
  }
  const limit = Math.min(positiveId(req.query.limit || 20), 100);
  const page = positiveId(req.query.page || 1);
  const { rows, count } = await Deal.findAndCountAll({ where, limit, offset: (page - 1) * limit, order: [["id", "DESC"]] });
  res.json({ success: true, data: rows, count, pagination: { page, limit, total: count } });
});
export const getInfluencerDeals = listDeals("influencer");
export const getMyDealsByBusiness = listDeals("business");

const mutate = (action) => endpoint(async (req, res) => {
  const actor = actorFrom(req);
  const role = action === "submit" ? "influencer" : "business";
  requireCondition(actor.type === role, 403, `${role} access required`);
  const initial = await Deal.findByPk(positiveId(req.params.id));
  requireCondition(initial, 404, "Deal not found");
  const data = await sequelize.transaction(async (transaction) => {
    const campaign = await lockCampaign("multi", initial.campaign_id, transaction);
    if (role === "business") requireOwner(actor, campaign);
    const deal = await Deal.findByPk(initial.id, { transaction, lock: transaction.LOCK.UPDATE });
    if (role === "influencer") requireCondition(Number(deal.influencer_id) === Number(actor.id), 403, "Deal owner access required");
    requireCondition(!["Completed", "Cancelled"].includes(campaign.campaignStatus), 409, "Final campaign records cannot change");
    requireCondition(!deal.obligationsResolvedAt, 409, "Resolved deal records cannot change");
    const allowed = { submit: ["accepted", "rejected"], review: ["submitted"], approve: ["submitted", "under_review"], reject: ["submitted", "under_review"] };
    requireCondition(allowed[action].includes(deal.deal_status), 409, "Invalid deal status transition");
    const patch = { deal_status: { submit: "submitted", review: "under_review", approve: "approved", reject: "rejected" }[action] };
    if (action === "submit") {
      requireCondition(typeof req.body?.contentLink === "string" && req.body.contentLink.trim(), 400, "contentLink is required");
      Object.assign(patch, { content_link: req.body.contentLink.trim(), proof_files: req.body.proofFiles || [], submitted_at: new Date() });
    }
    if (action === "approve") patch.approved_at = new Date();
    const before = snapshot(deal);
    await deal.update(patch, { transaction });
    await audit("multi", campaign, actor, `deal-${action}`, {}, before, snapshot(deal), transaction);
    return deal;
  });
  try {
    await notificationService.sendNotification({ users: [{ userId: role === "business" ? data.influencer_id : data.business_id, userType: role === "business" ? "influencer" : "business" }],
      title: "Deal Updated", body: `Deal work is now ${data.deal_status}.`, type: "DEAL_UPDATED", clickAction: "DEAL_DETAILS", referenceId: data.id,
      data: { dealId: String(data.id), campaignId: String(data.campaign_id) } });
  } catch (error) { console.error("Deal notification failed:", error.name); }
  res.json({ success: true, message: "Deal updated", data });
});
export const submitWork = mutate("submit");
export const startReview = mutate("review");
export const approveWork = mutate("approve");
export const rejectWork = mutate("reject");
