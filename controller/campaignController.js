import { listCampaigns, getCampaign, updateDraft, removeCampaign } from "./campaignWorkflow.controller.js";
// controllers/campaignController.js

import Campaign from "../models/Campaign.js";

export const createCampaign = async (req, res) => {
  try {
    const fields = [
      "title", "campaignType", "budgetPerInfluencer", "totalInfluencersNeeded",
      "deliverables", "captionRequirements", "hashtags", "productDetails",
      "shippingDetails", "reimbursementPolicy", "deadline", "targetNiche",
      "targetCity", "minimumFollowers",
    ];
    const data = Object.fromEntries(
      fields.filter((field) => Object.hasOwn(req.body || {}, field))
        .map((field) => [field, req.body[field]]),
    );
    const campaign = await Campaign.create({
      ...data,
      campaignStatus: "Draft",
      user_id: req.businessAccess.id,
    });

    return res.status(201).json({
      success: true,
      message: "Campaign created successfully",
      data: campaign,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export const getAllCampaigns = listCampaigns("basic");
export const getCampaignById = getCampaign("basic");
export const updateCampaign = updateDraft("basic");
export const deleteCampaign = removeCampaign("basic");
