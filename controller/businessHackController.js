import { listCampaigns, getCampaign, updateDraft, removeCampaign } from "./campaignWorkflow.controller.js";
import BusinessHack from "../models/BusinessHacks.js";
import { convertIdToStringBusiness } from "../HelperFunction/Helper.js";
import { NotificationTypes } from "../constants/notificationTypes.js";
import { ClickActions } from "../constants/clickActions.js";
import notificationService from "../services/notification.service.js";

// ✅ CREATE
export const createBusinessHack = async (req, res) => {
  try {
    // ✅ Prevent destructure crash
    const { campaignName, state, city, campaignType, applicationDeadline } = req.body || {};

    // ✅ Validation
    if (!campaignName || !state || !city || !campaignType) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const businessHack = await BusinessHack.create({
      user_id: req.user.userId, // ✅ IMPORTANT: Associate with the authenticated user
      campaignName,
      state,
      city,
      campaignType,
      applicationDeadline,
      campaignStatus: "Draft",
    });

    // Notify influencers (all active) about the new campaign.
    // await notificationService.broadcast({
    //   userType: "influencer",
    //   title: "New Campaign",
    //   body: `A new campaign "${campaignName}" is now live!`,
    //   type: NotificationTypes.NEW_CAMPAIGN,
    //   clickAction: ClickActions.CAMPAIGN_DETAILS,
    //   referenceId: businessHack.id,
    //   createdBy: req.user.userId || null,
    //   data: {
    //     campaignId: String(businessHack.id)
    //   }
    // });

    res.status(201).json({
      success: true,
      message: "Business Hack created successfully",
      data: businessHack,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAllBusinessHacks = listCampaigns("multi");
export const getBusinessHackById = getCampaign("multi");
export const updateBusinessHack = updateDraft("multi");
export const deleteBusinessHack = removeCampaign("multi");
