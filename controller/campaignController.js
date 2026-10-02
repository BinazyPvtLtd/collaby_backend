// controllers/campaignController.js

import Campaign from "../models/Campaign.js";

export const createCampaign = async (req, res) => {
  try {
    const fields = [
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
      "campaignStatus",
    ];
    const data = Object.fromEntries(
      fields
        .filter((field) => Object.hasOwn(req.body || {}, field))
        .map((field) => [field, req.body[field]]),
    );
    const campaign = await Campaign.create({
      ...data,
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

export const getAllCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.findAll({
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      data: campaigns,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export const getCampaignById = async (req, res) => {
  try {
    const { id } = req.params;

    const campaign = await Campaign.findByPk(id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: campaign,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export const updateCampaign = async (req, res) => {
  try {
    const { id } = req.params;

    const campaign = await Campaign.findByPk(id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found",
      });
    }

    await campaign.update(req.body);

    return res.status(200).json({
      success: true,
      message: "Campaign updated successfully",
      data: campaign,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export const deleteCampaign = async (req, res) => {
  try {
    const { id } = req.params;

    const campaign = await Campaign.findByPk(id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found",
      });
    }

    await campaign.destroy();

    return res.status(200).json({
      success: true,
      message: "Campaign deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
