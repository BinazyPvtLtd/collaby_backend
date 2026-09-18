import { Op } from "sequelize";
import sequelize from "../config/database.js";
import Application from "../models/Application.js";
import BusinessHack from "../models/BusinessHacks.js";
import Deal from "../models/Deal.js";
import InfluencerUser from "../models/InfluencerUser.js";
import ChatMessage from "../models/ChatMessage.js";
import ChatService from "../services/ChatService.js";
import notificationService from "../services/notification.service.js";
import { actorFrom, authorize, requireCondition, requirePermission, requireSupport, positiveId } from "../services/campaignPolicy.js";
import { audit, lockCampaign, snapshot } from "../services/campaignWorkflow.service.js";
import { endpoint } from "./campaignWorkflow.controller.js";

async function notify(application, status, deal) {
  try {
    return await notificationService.sendNotification({
      users: [{ userId: status === "pending" ? application.brand_id : application.influencer_id, userType: status === "pending" ? "business" : "influencer" }],
      title: status === "pending" ? "New Application" : `Application ${status}`,
      body: status === "pending" ? "An influencer applied to your campaign." : `Your application has been ${status}.`,
      type: { pending: "APPLICATION_RECEIVED", accepted: "APPLICATION_ACCEPTED", rejected: "APPLICATION_REJECTED" }[status],
      clickAction: deal ? "DEAL_DETAILS" : "APPLICATION_DETAILS", referenceId: deal?.id || application.id,
      data: { applicationId: String(application.id), campaignId: String(application.campaign_id), ...(deal ? { dealId: String(deal.id) } : {}) },
    });
  } catch (error) { console.error("Application notification failed:", error.name); return null; }
}

export const applyToCampaign = endpoint(async (req, res) => {
  const actor = actorFrom(req);
  requireCondition(actor.type === "influencer", 403, "Only influencers can apply");
  requireCondition(await InfluencerUser.findByPk(positiveId(actor.id)), 401, "Influencer account not found");
  const input = req.body || {};
  const application = await sequelize.transaction(async (transaction) => {
    const campaign = await lockCampaign("multi", input.campaignId, transaction);
    requireCondition(campaign.campaignStatus === "Live" && campaign.applicationDeadline && new Date(campaign.applicationDeadline) > new Date(), 409, "Campaign is not accepting applications");
    requireCondition(!await Application.findOne({ where: { campaign_id: campaign.id, influencer_id: actor.id }, transaction }), 409, "Already applied to this campaign");
    const row = await Application.create({ campaign_id: campaign.id, influencer_id: actor.id, user_id: actor.id,
      brand_id: campaign.user_id, pitch_message: input.pitchMessage, expected_rate: input.expectedRate, status: "pending" }, { transaction });
    await audit("multi", campaign, actor, "application-created", {}, null, snapshot(row), transaction);
    return row;
  });
  await notify(application, "pending");
  res.status(201).json({ success: true, message: "Application submitted", data: application });
});

export async function decideApplication(id, actor, status, input = {}) {
  requireCondition(["accepted", "rejected"].includes(status), 400, "Support decisions must be accepted or rejected");
  if (actor.type === "admin") { requirePermission(actor, "application:support"); requireSupport(input); }
  const initial = await Application.findByPk(positiveId(id));
  requireCondition(initial, 404, "Application not found");
  return sequelize.transaction(async (transaction) => {
    const campaign = await lockCampaign("multi", initial.campaign_id, transaction);
    authorize(actor, campaign, "application:support");
    requireCondition(["Live", "Closed"].includes(campaign.campaignStatus), 409, "Applications can be decided only for live or closed campaigns");
    const application = await Application.findByPk(initial.id, { transaction, lock: transaction.LOCK.UPDATE });
    requireCondition(application.status === "pending", 409, `Application already ${application.status}`);
    const before = snapshot(application);
    let deal = null;
    if (status === "accepted") {
      requireCondition(!await Deal.findOne({ where: { application_id: application.id }, transaction }), 409, "Deal already exists");
      const { room } = await ChatService.createRoom({ campaignId: campaign.id, brandId: campaign.user_id, creatorId: application.influencer_id, transaction });
      await ChatMessage.create({ roomId: room.id, senderId: null, senderType: "system", messageType: "system", content: "Your application has been accepted." }, { transaction });
      deal = await Deal.create({ user_id: application.influencer_id, campaign_id: campaign.id, application_id: application.id,
        influencer_id: application.influencer_id, brand_id: campaign.user_id, business_id: campaign.user_id,
        agreed_price: application.expected_rate || 0, deal_status: "accepted" }, { transaction });
    }
    await application.update({ status, brand_id: campaign.user_id }, { transaction });
    await audit("multi", campaign, actor, `application-${status}`, input, before, snapshot(application), transaction);
    return { application, deal };
  });
}
const decision = (status) => endpoint(async (req, res) => {
  const result = await decideApplication(req.params.id, actorFrom(req), status || req.body?.status, req.body || {});
  const notification = await notify(result.application, result.application.status, result.deal);
  res.json({ success: true, message: `Application ${result.application.status}`, data: { ...result, notification: { sent: Boolean(notification) } } });
});
export const acceptApplication = decision("accepted");
export const rejectApplication = decision("rejected");
export const supportApplicationDecision = decision();

export const withdrawApplication = endpoint(async (req, res) => {
  const actor = actorFrom(req);
  requireCondition(actor.type === "influencer", 403, "Only influencers can withdraw their applications");
  const initial = await Application.findByPk(positiveId(req.params.id));
  requireCondition(initial && Number(initial.influencer_id) === Number(actor.id), 404, "Application not found");
  const data = await sequelize.transaction(async (transaction) => {
    const campaign = await lockCampaign("multi", initial.campaign_id, transaction);
    const application = await Application.findByPk(initial.id, { transaction, lock: transaction.LOCK.UPDATE });
    requireCondition(application.status === "pending", 409, "Only pending applications can be withdrawn");
    const before = snapshot(application);
    await application.update({ status: "withdrawn" }, { transaction });
    await audit("multi", campaign, actor, "application-withdrawn", {}, before, snapshot(application), transaction);
    return application;
  });
  res.json({ success: true, message: "Application withdrawn", data });
});

async function applicationScope(actor) {
  if (actor.type === "admin") { requirePermission(actor, "application:read:any"); return {}; }
  if (actor.type === "influencer") return { influencer_id: positiveId(actor.id) };
  requireCondition(actor.type === "business", 403, "Application access denied");
  const campaigns = await BusinessHack.findAll({ where: { user_id: positiveId(actor.id) }, attributes: ["id"] });
  return { campaign_id: { [Op.in]: campaigns.map((row) => row.id) } };
}
const list = (mode) => endpoint(async (req, res) => {
  const actor = actorFrom(req);
  let where = await applicationScope(actor);
  if (mode === "campaign") {
    const campaign = await BusinessHack.findByPk(positiveId(req.params.campaignId));
    requireCondition(campaign, 404, "Campaign not found");
    authorize(actor, campaign, "application:read:any");
    where = { campaign_id: campaign.id };
  }
  if (mode === "influencer") {
    const influencerId = positiveId(req.params.influencerId);
    if (actor.type === "influencer") requireCondition(influencerId === Number(actor.id), 403, "Cannot view another influencer's applications");
    where = { ...where, influencer_id: influencerId };
  }
  if (mode === "my") requireCondition(actor.type === "influencer", 403, "Influencer access required");
  const limit = Math.min(positiveId(req.query.limit || 20), 100);
  const page = positiveId(req.query.page || 1);
  const { rows, count } = await Application.findAndCountAll({ where, limit, offset: (page - 1) * limit, order: [["id", "DESC"]] });
  res.json({ success: true, data: rows, total: count, pagination: { page, limit, total: count } });
});
export const getMyApplications = list("my");
export const getApplicationsByCampaign = list("campaign");
export const getCampaignApplicants = list("campaign");
export const getApplicationsByInfluencer = list("influencer");
export const listAllApplications = list("all");
