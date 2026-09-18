import Application from "../models/Application.js";
import notificationService from "./notification.service.js";

export async function notifyCampaignChange(kind, campaign, message) {
  // Committed lifecycle changes must not fail when push delivery is unavailable.
  try {
    const users = [{ userId: campaign.user_id, userType: "business" }];
    if (kind === "multi") {
      const applications = await Application.findAll({ where: { campaign_id: campaign.id }, attributes: ["influencer_id"] });
      for (const id of new Set(applications.map((row) => row.influencer_id))) users.push({ userId: id, userType: "influencer" });
    }
    await notificationService.sendNotification({ users, title: "Campaign Updated", body: message,
      type: campaign.campaignStatus === "Closed" ? "CAMPAIGN_CLOSED" : "CAMPAIGN_UPDATED", clickAction: "CAMPAIGN_DETAILS", referenceId: campaign.id,
      data: { campaignId: String(campaign.id), campaignKind: kind, campaignStatus: campaign.campaignStatus } });
  } catch (error) { console.error("Campaign notification failed:", error.name); }
}
