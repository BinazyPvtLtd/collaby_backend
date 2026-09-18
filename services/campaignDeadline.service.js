import { Op } from "sequelize";
import sequelize from "../config/database.js";
import { campaignModels, lockCampaign, snapshot, audit } from "./campaignWorkflow.service.js";
import { notifyCampaignChange } from "./campaignNotifications.service.js";

export async function closeExpiredCampaigns() {
  for (const [kind, model] of Object.entries(campaignModels)) {
    const deadline = kind === "multi" ? "applicationDeadline" : "deadline";
    const candidates = await model.findAll({ where: { campaignStatus: "Live", [deadline]: { [Op.lte]: new Date() } }, attributes: ["id"], order: [["id", "ASC"]], limit: 100 });
    for (const candidate of candidates) {
      const closed = await sequelize.transaction(async (transaction) => {
        const campaign = await lockCampaign(kind, candidate.id, transaction);
        if (campaign.campaignStatus !== "Live" || !campaign[deadline] || new Date(campaign[deadline]) > new Date()) return null;
        const before = snapshot(campaign);
        await campaign.update({ campaignStatus: "Closed" }, { transaction });
        await audit(kind, campaign, { type: "system", id: 0 }, "deadline-closed", { reason: "Application deadline reached" }, before, snapshot(campaign), transaction);
        return campaign;
      });
      if (closed) await notifyCampaignChange(kind, closed, "The campaign application deadline has been reached.");
    }
  }
}

export function startCampaignDeadlineWorker() {
  let running = false;
  const run = async () => {
    if (running) return;
    running = true;
    try { await closeExpiredCampaigns(); }
    catch (error) { console.error("Campaign deadline processing failed:", error.name); }
    finally { running = false; }
  };
  const timer = setInterval(run, 60_000);
  timer.unref();
  void run();
  return () => clearInterval(timer);
}
