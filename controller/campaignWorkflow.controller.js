import { unlink } from "node:fs/promises";
import path from "node:path";
import sequelize from "../config/database.js";
import CampaignAudit from "../models/CampaignAudit.js";
import { notifyCampaignChange } from "../services/campaignNotifications.service.js";
import { normalizeGender } from "../HelperFunction/Helper.js";
import {
  actorFrom,
  authorize,
  positiveId,
  requireCondition,
  requirePermission,
  requireSupport,
} from "../services/campaignPolicy.js";
import {
  campaignModels,
  stepModels,
  stepFields,
  pickFields,
  snapshot,
  lockCampaign,
  assertDraft,
  audit,
  transition,
  editDraft,
  deleteCampaign,
  visibility,
  resolveDealObligations,
} from "../services/campaignWorkflow.service.js";

export function failure(res, error) {
  const validation = [
    "SequelizeValidationError",
    "SequelizeUniqueConstraintError",
  ].includes(error.name);
  const status = error.status || (validation ? 422 : 500);
  if (status === 500) console.error("Campaign operation failed:", error.name);
  return res
    .status(status)
    .json({
      success: false,
      message:
        status === 500 ? "Unable to process campaign request" : error.message,
    });
}
export const endpoint = (handler) => async (req, res) => {
  try {
    await handler(req, res);
  } catch (error) {
    const root = path.resolve("uploads/campaigns") + path.sep;
    for (const file of Object.values(req.files || {}).flat()) {
      const filePath = path.resolve(file.path);
      if (filePath.startsWith(root)) await unlink(filePath).catch(() => {});
    }
    failure(res, error);
  }
};
export const requireAdminPermission = (permission) => (req, res, next) => {
  try {
    requirePermission(actorFrom(req), permission);
    next();
  } catch (error) {
    failure(res, error);
  }
};
export const changeStatus = (kind) =>
  endpoint(async (req, res) => {
    const data = await transition(
      kind,
      req.params.id,
      actorFrom(req),
      req.body || {},
    );
    await notifyCampaignChange(kind, data, `Campaign status changed to ${data.campaignStatus}.`);
    res.json({ success: true, message: "Campaign status updated", data });
  });
export const updateDraft = (kind) =>
  endpoint(async (req, res) => {
    const data = await editDraft(
      kind,
      req.params.id,
      actorFrom(req),
      req.body || {},
    );
    if (req.admin) await notifyCampaignChange(kind, data, "An administrator updated your draft following a support request.");
    res.json({ success: true, message: "Draft updated", data, ...(kind === "multi" ? { response: { success: true, ...snapshot(data), id: String(data.id) } } : {}) });
  });
export const removeCampaign = (kind) =>
  endpoint(async (req, res) => {
    await deleteCampaign(kind, req.params.id, actorFrom(req), req.body || {});
    res.json({
      success: true,
      message: "Campaign permanently deleted; audit retained",
    });
  });
export const listCampaigns = (kind) =>
  endpoint(async (req, res) => {
    const page = positiveId(req.query.page || 1);
    const limit = Math.min(positiveId(req.query.limit || 20), 100);
    const where = visibility(actorFrom(req), kind);
    const { rows, count } = await campaignModels[kind].findAndCountAll({
      where,
      order: [["id", "DESC"]],
      limit,
      offset: (page - 1) * limit,
    });
    res.json({
      success: true,
      data: rows,
      pagination: { page, limit, total: count },
    });
  });
export const getCampaign = (kind) =>
  endpoint(async (req, res) => {
    const data = await campaignModels[kind].findOne({
      where: {
        id: positiveId(req.params.id),
        ...visibility(actorFrom(req), kind),
      },
    });
    requireCondition(data, 404, "Campaign not found");
    const steps = {};
    if (kind === "multi") {
      for (const [step, model] of Object.entries(stepModels))
        steps[step] = await model.findOne({
          where: { businessHackId: data.id },
        });
    }
    res.json({ success: true, data, ...(kind === "multi" ? { steps, response: { success: true, ...snapshot(data), id: String(data.id) } } : {}) });
  });
export const getAudit = (kind) =>
  endpoint(async (req, res) => {
    requirePermission(actorFrom(req), "campaign:read:any");
    const data = await CampaignAudit.findAll({
      where: { campaignKind: kind, campaignId: positiveId(req.params.id) },
      order: [["id", "DESC"]],
      limit: 100,
    });
    res.json({ success: true, data });
  });
export const resolveObligations = endpoint(async (req, res) => {
  res.json({
    success: true,
    data: await resolveDealObligations(
      req.params.id,
      actorFrom(req),
      req.body || {},
    ),
  });
});

// All step mutations lock their parent, just like publishing, preventing an edit/publish race.
export const mutateStep = (stepNumber, operation) =>
  endpoint(async (req, res) => {
    const step = stepNumber || Number(req.params.step);
    const model = stepModels[step];
    requireCondition(model, 400, "Step must be 2, 3 or 4");
    const input = req.body || {};
    const actor = actorFrom(req);
    requireCondition(
      operation === "create" || (!Object.hasOwn(input, "user_id") &&
        !Object.hasOwn(input, "campaignStatus")),
      400,
      "Owner and status cannot be changed through step editing",
    );
    let campaignId = req.params.campaignId || input.businessHackId;
    let rowId;
    let parentCampaign;
    if (operation !== "create" && !req.params.campaignId) {
      rowId = positiveId(req.params.id);
      const existing = await model.findByPk(rowId);
      requireCondition(existing, 404, "Campaign step not found");
      campaignId = existing.businessHackId;
    }
    const data = await sequelize.transaction(async (transaction) => {
      const campaign = await lockCampaign("multi", campaignId, transaction);
      parentCampaign = campaign;
      authorize(actor, campaign, "campaign:support-edit");
      if (actor.type === "admin") requireSupport(input);
      assertDraft(campaign);
      const existing = await model.findOne({
        where: rowId ? { id: rowId } : { businessHackId: campaign.id },
        transaction,
      });
      if (operation === "create")
        requireCondition(!existing, 409, "Campaign step already exists");
      else requireCondition(existing, 404, "Campaign step not found");
      const before = snapshot(existing);
      if (operation === "delete") {
        await existing.destroy({ transaction });
        await audit(
          "multi",
          campaign,
          actor,
          `delete-step-${step}`,
          input,
          before,
          null,
          transaction,
        );
        return null;
      }
      const patch = pickFields(input, stepFields[step]);
      if (step === 3) {
        if (patch.gender !== undefined)
          patch.gender = normalizeGender(patch.gender);
        for (const key of ["dos", "donts"])
          if (typeof patch[key] === "string")
            patch[key] = patch[key].split(",").map((item) => item.trim());
        const merged = { ...before, ...patch };
        requireCondition(
          Number(merged.minAge) < Number(merged.maxAge),
          422,
          "Minimum age must be less than maximum age",
        );
        for (const [flag, key] of [
          ["isDosRequired", "dos"],
          ["isDontsRequired", "donts"],
        ]) {
          requireCondition(
            !merged[flag] ||
              (Array.isArray(merged[key]) && merged[key].length > 0),
            422,
            `${key} are required`,
          );
        }
      }
      if (step === 4) {
        requireCondition(
          !Object.hasOwn(input, "campaignImage") &&
            !Object.hasOwn(input, "sampleMedia"),
          400,
          "Media must be uploaded as files",
        );
        if (req.files?.campaignImage)
          patch.campaignImage = req.files.campaignImage[0].path;
        if (req.files?.sampleMedia)
          patch.sampleMedia = req.files.sampleMedia.map((file) => file.path);
      }
      const row = existing
        ? await existing.update(patch, { transaction })
        : await model.create(
            {
              ...patch,
              businessHackId: campaign.id,
              user_id: campaign.user_id,
            },
            { transaction },
          );
      await audit(
        "multi",
        campaign,
        actor,
        `${operation}-step-${step}`,
        input,
        before,
        snapshot(row),
        transaction,
      );
      return row;
    });
    if (req.admin) await notifyCampaignChange("multi", parentCampaign, "An administrator updated your draft following a support request.");
    let responseData = data;
    if (step === 4 && data) {
      const mediaUrl = (value) => {
        if (!value || /^https?:\/\//i.test(value)) return value || null;
        const base = (process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get("host")}`).replace(/\/$/, "");
        return `${base}/${value.replace(/\\/g, "/").replace(/^\/+/, "")}`;
      };
      responseData = { ...snapshot(data), campaignImage: mediaUrl(data.campaignImage), sampleMedia: (data.sampleMedia || []).map(mediaUrl) };
    }
    res.status(operation === "create" ? 201 : 200).json({ success: true, data: responseData });
  });
