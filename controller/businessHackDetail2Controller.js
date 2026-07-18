import { normalizeGender } from "../HelperFunction/Helper.js";
import BusinessHackStep3 from "../models/BusinessHackDetail2.js";
import BusinessHack from "../models/BusinessHacks.js";

// helper to convert string → array
const normalizeArray = (value) => {
  if (!value) return null;
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    return value.split(",").map((v) => v.trim());
  }
  return null;
};

// ✅ CREATE
export const createBusinessHackStep3 = async (req, res) => {
  try {
    let {
      businessHackId,
      influencerCategory,
      gender,
      minAge,
      maxAge,
      campaignDescription,
      dos,
      donts,
      isDosRequired,
      isDontsRequired,
    } = req.body;

    dos = normalizeArray(dos);
    donts = normalizeArray(donts);
    gender = normalizeGender(gender);

    if (!gender || gender.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one gender must be selected",
      });
    }

    if (minAge >= maxAge) {
      return res.status(400).json({
        success: false,
        message: "Minimum age must be less than maximum age",
      });
    }

    if (isDosRequired && (!dos || dos.length === 0)) {
      return res.status(400).json({
        success: false,
        message: "Dos list is required",
      });
    }

    if (isDontsRequired && (!donts || donts.length === 0)) {
      return res.status(400).json({
        success: false,
        message: "Donts list is required",
      });
    }

    // 🔐 Step-1 ownership check
    const campaign = await BusinessHack.findOne({
      where: {
        id: businessHackId,
        user_id: req.user.userId,
      },
    });

    if (!campaign) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized or Business Hack not found",
      });
    }

    // 🚫 Prevent duplicate Step-3
    const existing = await BusinessHackStep3.findOne({
      where: { businessHackId },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Step-3 already exists for this campaign",
      });
    }

    const step3 = await BusinessHackStep3.create({
      user_id: req.user.userId, // ✅ IMPORTANT
      businessHackId,
      influencerCategory,
      gender,
      minAge,
      maxAge,
      campaignDescription,
      dos,
      donts,
      isDosRequired,
      isDontsRequired,
    });

    res.status(201).json({
      success: true,
      message: "Business Hack Step-3 created successfully",
      data: step3,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// ✅ GET ALL
export const getAllBusinessHackStep3 = async (req, res) => {
  try {
    const data = await BusinessHackStep3.findAll({
      where: {
        user_id: req.user.userId,
      },
      include: {
        model: BusinessHack,
        where: {
          user_id: req.user.userId,
        },
        attributes: ["id", "businessName"],
      },
      order: [["id", "DESC"]],
    });

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// ✅ GET SINGLE
export const getBusinessHackStep3ById = async (req, res) => {
  try {
    const data = await BusinessHackStep3.findOne({
      where: {
        id: req.params.id,
        user_id: req.user.userId,
      },
      include: {
        model: BusinessHack,
        where: {
          user_id: req.user.userId,
        },
        attributes: ["id", "businessName"],
      },
    });

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Step-3 not found",
      });
    }

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// ✅ UPDATE
export const updateBusinessHackStep3 = async (req, res) => {
  try {
    const step3 = await BusinessHackStep3.findOne({
      where: {
        id: req.params.id,
        user_id: req.user.userId,
      },
      include: {
        model: BusinessHack,
        where: {
          user_id: req.user.userId,
        },
      },
    });

    if (!step3) {
      return res.status(404).json({
        success: false,
        message: "Step-3 not found or unauthorized",
      });
    }

    let {
      influencerCategory,
      gender,
      minAge,
      maxAge,
      campaignDescription,
      dos,
      donts,
      isDosRequired,
      isDontsRequired,
    } = req.body;

    dos = normalizeArray(dos) ?? step3.dos;
    donts = normalizeArray(donts) ?? step3.donts;

    let updatedGender = step3.gender;
    if (gender !== undefined) {
      updatedGender = normalizeGender(gender);

      if (!updatedGender || updatedGender.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid gender",
        });
      }
    }

    const updatedMinAge = minAge ?? step3.minAge;
    const updatedMaxAge = maxAge ?? step3.maxAge;

    if (updatedMinAge >= updatedMaxAge) {
      return res.status(400).json({
        success: false,
        message: "Minimum age must be less than maximum age",
      });
    }

    Object.assign(step3, {
      influencerCategory: influencerCategory ?? step3.influencerCategory,
      gender: updatedGender,
      minAge: updatedMinAge,
      maxAge: updatedMaxAge,
      campaignDescription: campaignDescription ?? step3.campaignDescription,
      dos,
      donts,
      isDosRequired: isDosRequired ?? step3.isDosRequired,
      isDontsRequired: isDontsRequired ?? step3.isDontsRequired,
    });

    await step3.save();

    res.status(200).json({
      success: true,
      message: "Business Hack Step-3 updated successfully",
      data: step3,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// ✅ DELETE
export const deleteBusinessHackStep3 = async (req, res) => {
  try {
    const step3 = await BusinessHackStep3.findByPk(req.params.id);

    if (!step3) {
      return res.status(404).json({
        success: false,
        message: "Step-3 not found",
      });
    }

    await step3.destroy();

    res.status(200).json({
      success: true,
      message: "Business Hack Step-3 deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
