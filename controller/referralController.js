import Referral from "../models/Referral.js";
import { NotificationTypes } from "../constants/notificationTypes.js";
import { ClickActions } from "../constants/clickActions.js";
import notificationService from "../services/notification.service.js";

/* =========================
   CREATE Referral
========================= */
export const createReferral = async (req, res) => {
  try {
    console.log(req.user);

    const { referral_name, referred_by } = req.body;

    const user_id = req.user?.userId;

    console.log("USER ID:", user_id);

    const referral = await Referral.create({
      user_id,
      referral_name,
      referred_by,
    });

    // Notify the referrer that they earned a referral bonus.
    if (user_id && req.user?.userType) {
      await notificationService
        .sendNotification({
          users: [{ userId: user_id, userType: req.user.userType }],
          title: "Referral Bonus",
          body: `You earned a referral bonus for referring ${referred_by || "a new user"}!`,
          type: NotificationTypes.REFERRAL_BONUS,
          clickAction: ClickActions.REFERRAL,
          referenceId: referral.id,
          createdBy: req.user.userId || null,
          data: {
            referralId: String(referral.id),
            referralName: referral_name || "",
          },
        })
        .catch((e) => {
          console.error("REFERRAL NOTIFICATION ERROR:", e.message);
        });
    }

    res.status(201).json({
      status: true,
      data: referral,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      status: false,
      message: error.message,
      errors: error.errors,
    });
  }
};

/* =========================
   GET All Referrals
========================= */
export const getAllReferrals = async (req, res) => {
  try {
    // ✅ Only logged-in user's referrals
    const user_id = req.user?.userId;

    const referrals = await Referral.findAll({
      where: { user_id },
      order: [["created_at", "DESC"]],
    });

    res.json({
      status: true,
      data: referrals,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

/* =========================
   GET Referral by ID
========================= */
export const getReferralById = async (req, res) => {
  try {
    const { id } = req.params;

    const user_id = req.user?.userId;

    // ✅ User-specific fetch
    const referral = await Referral.findOne({
      where: {
        id,
        user_id,
      },
    });

    if (!referral) {
      return res.status(404).json({
        status: false,
        message: "Referral not found",
      });
    }

    res.json({
      status: true,
      data: referral,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

/* =========================
   UPDATE Referral
========================= */
export const updateReferral = async (req, res) => {
  try {
    const { id } = req.params;

    const user_id = req.user?.userId;

    // ✅ User-specific update
    const referral = await Referral.findOne({
      where: {
        id,
        user_id,
      },
    });

    if (!referral) {
      return res.status(404).json({
        status: false,
        message: "Referral not found",
      });
    }

    // ❌ Prevent changing user_id manually
    delete req.body.user_id;

    await referral.update(req.body);

    res.json({
      status: true,
      message: "Referral updated successfully",
      data: referral,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

/* =========================
   DELETE Referral
========================= */
export const deleteReferral = async (req, res) => {
  try {
    const { id } = req.params;

    const user_id = req.user?.userId;

    // ✅ User-specific delete
    const referral = await Referral.findOne({
      where: {
        id,
        user_id,
      },
    });

    if (!referral) {
      return res.status(404).json({
        status: false,
        message: "Referral not found",
      });
    }

    await referral.destroy();

    res.json({
      status: true,
      message: "Referral deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};
