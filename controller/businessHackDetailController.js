import { mutateStep } from "./campaignWorkflow.controller.js";
import BusinessHackDetail from "../models/BusinessHackDetail.js";
import BusinessHack from "../models/BusinessHacks.js";

// ✅ CREATE STEP-2
export const createBusinessHackDetail = mutateStep(2, "create");

// ✅ GET ALL
export const getAllBusinessHackDetails = async (req, res) => {
  try {
    const details = await BusinessHackDetail.findAll({
      where: {
        user_id: req.user.userId,
      },
      include: BusinessHack,
      order: [["id", "DESC"]],
    });

    res.status(200).json({
      success: true,
      data: details,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ✅ GET SINGLE
export const getBusinessHackDetailById = async (req, res) => {
  try {
    const detail = await BusinessHackDetail.findOne({
      where: {
        id: req.params.id,
        user_id: req.user.userId,
      },
      include: {
        model: BusinessHack,
        where: {
          user_id: req.user.userId, // 🔐 double security
        },
      },
    });

    if (!detail) {
      return res.status(404).json({
        success: false,
        message: "Detail not found",
      });
    }

    res.status(200).json({
      success: true,
      data: detail,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateBusinessHackDetail = mutateStep(2, "update");
export const deleteBusinessHackDetail = mutateStep(2, "delete");
