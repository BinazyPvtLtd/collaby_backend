import { mutateStep } from "./campaignWorkflow.controller.js";
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

export const createBusinessHackStep3 = mutateStep(3, "create");

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
        attributes: ["id", "campaignName"],
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
        attributes: ["id", "campaignName"],
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

export const updateBusinessHackStep3 = mutateStep(3, "update");
export const deleteBusinessHackStep3 = mutateStep(3, "delete");
