import BusinessHackStep4 from "../models/BusinessHackStep4.js";
import BusinessHack from "../models/BusinessHacks.js";
import multer from "multer";
import fs from "fs";

const BASE_URL = "http://13.201.88.246:5000";

// 🔧 Format single file path
const formatFileUrl = (filePath) => {
  if (!filePath) return null;

  // already full URL → don't modify
  if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
    return filePath;
  }

  // convert \ → /
  const cleanPath = filePath.replace(/\\/g, "/");

  // remove leading slash if exists (avoid double //)
  const finalPath = cleanPath.startsWith("/") ? cleanPath.slice(1) : cleanPath;

  return `${BASE_URL}/${finalPath}`;
};

// 🔧 Format full response
const formatResponse = (data) => {
  if (!data) return data;

  const obj = data.toJSON ? data.toJSON() : data;

  return {
    ...obj,
    campaignImage: formatFileUrl(obj.campaignImage),
    sampleMedia: Array.isArray(obj.sampleMedia)
      ? obj.sampleMedia.map(formatFileUrl)
      : [],
  };
};

// helper (safe delete)
const safeDelete = (filePath) => {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    console.log("Delete error:", err.message);
  }
};

// ✅ CREATE
export const createBusinessHackStep4 = async (req, res) => {
  try {
    const businessHackId = parseInt(req.body.businessHackId);

    if (!businessHackId) {
      return res.status(400).json({
        success: false,
        message: "businessHackId is required",
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

    // 🚫 Prevent duplicate Step-4
    const existing = await BusinessHackStep4.findOne({
      where: { businessHackId },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Step-4 already exists for this campaign",
      });
    }

    const campaignImage = req.files?.campaignImage
      ? req.files.campaignImage[0].path
      : null;

    const sampleMedia = req.files?.sampleMedia
      ? req.files.sampleMedia.map((file) => file.path)
      : [];

    const step4 = await BusinessHackStep4.create({
      user_id: req.user.userId, // ✅ IMPORTANT
      businessHackId,
      campaignImage,
      sampleMedia,
    });
    const formatted = formatResponse(step4);

    res.status(201).json({
      success: true,
      message: "Step-4 Media uploaded successfully",
      data: formatted,
    });
  } catch (error) {
    console.error("🔥 ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ✅ GET ALL
export const getAllBusinessHackStep4 = async (req, res) => {
  try {
    const data = await BusinessHackStep4.findAll({
      where: {
        user_id: req.user.userId,
      },
      include: {
        model: BusinessHack,
        where: {
          user_id: req.user.userId,
        },
      },
    });
    const formatted = data.map(formatResponse);

    res.status(200).json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// ✅ UPDATE
export const updateBusinessHackStep4 = async (req, res) => {
  try {
    const step4 = await BusinessHackStep4.findOne({
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

    if (!step4) {
      return res.status(404).json({
        success: false,
        message: "Step-4 not found or unauthorized",
      });
    }

    // 🔄 Replace campaign image
    if (req.files?.campaignImage) {
      safeDelete(step4.campaignImage);
      step4.campaignImage = req.files.campaignImage[0].path;
    }

    // 🔄 Replace sample media
    if (req.files?.sampleMedia) {
      if (step4.sampleMedia) {
        step4.sampleMedia.forEach(safeDelete);
      }
      step4.sampleMedia = req.files.sampleMedia.map((f) => f.path);
    }

    await step4.save();
    const formatted = formatResponse(step4);

    res.status(200).json({
      success: true,
      message: "Updated successfully",
      data: formatted,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// ✅ DELETE
export const deleteBusinessHackStep4 = async (req, res) => {
  try {
    const step4 = await BusinessHackStep4.findOne({
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

    if (!step4) {
      return res.status(404).json({
        success: false,
        message: "Step-4 not found or unauthorized",
      });
    }

    // 🗑 Delete files safely
    safeDelete(step4.campaignImage);

    if (step4.sampleMedia) {
      step4.sampleMedia.forEach(safeDelete);
    }

    await step4.destroy();

    res.status(200).json({
      success: true,
      message: "Step-4 deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
