import BusinessHack from "../models/BusinessHacks.js";
import { convertIdToStringBusiness } from "../HelperFunction/Helper.js";

// ✅ CREATE
export const createBusinessHack = async (req, res) => {
  try {
    // ✅ Prevent destructure crash
    const { campaignName, state, city, campaignType } = req.body || {};

    // ✅ Validation
    if (!campaignName || !state || !city || !campaignType) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const businessHack = await BusinessHack.create({
      user_id: req.user.userId,
      campaignName,
      state,
      city,
      campaignType,
    });

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

// ✅ GET ALL
export const getAllBusinessHacks = async (req, res) => {
  try {
    const campaigns = await BusinessHack.findAll({
      order: [["id", "DESC"]],
    });

    const formatted = convertIdToStringBusiness(campaigns);

    res.status(200).json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ✅ GET SINGLE
export const getBusinessHackById = async (req, res) => {
  try {
    const campaign = await BusinessHack.findByPk(req.params.id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found",
      });
    }

    const formatted = convertIdToStringBusiness(campaign);

    res.status(200).json({
      response: {
        success: true,
        ...formatted,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ✅ UPDATE
export const updateBusinessHack = async (req, res) => {
  try {
    const campaign = await BusinessHack.findByPk(req.params.id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found",
      });
    }

    const { campaignName, state, city, campaignType } = req.body;

    campaign.campaignName = campaignName ?? campaign.campaignName;
    campaign.state = state ?? campaign.state;
    campaign.city = city ?? campaign.city;
    campaign.campaignType = campaignType ?? campaign.campaignType;

    await campaign.save();

    const formatted = convertIdToStringBusiness(campaign);

    res.status(200).json({
      response: {
        success: true,
        message: "Campaign updated successfully",
        ...formatted,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ✅ DELETE
export const deleteBusinessHack = async (req, res) => {
  try {
    const campaign = await BusinessHack.findByPk(req.params.id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found",
      });
    }

    await campaign.destroy();

    res.status(200).json({
      response: {
        success: true,
        message: "Campaign deleted successfully",
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
