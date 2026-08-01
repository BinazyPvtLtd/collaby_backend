import BusinessHackDetail from "../models/BusinessHackDetail.js";
import BusinessHack from "../models/BusinessHacks.js";

// ✅ CREATE STEP-2
export const createBusinessHackDetail = async (req, res) => {
  try {
    const {
      businessHackId,
      noOfReels,
      noOfPosts,
      noOfStories,
      numberOfInfluencersRequired,
      minimumFollowersRequired,
      costPerInfluencer,
      tax,
      freeProduct,
    } = req.body;

    // 🔐 Step-1 ownership check
    const campaign = await BusinessHack.findOne({
      where: {
        id: businessHackId,
        user_id: req.user.userId,
      },
    });
    console.log("Campaign found for Step-2 creation:", !!campaign);
    if (!campaign) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized or Business Hack not found",
      });
    }

    // 🚫 Prevent duplicate Step-2
    const existing = await BusinessHackDetail.findOne({
      where: { businessHackId },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Step-2 already exists for this campaign",
      });
    }

    const detail = await BusinessHackDetail.create({
      user_id: req.user.userId,
      businessHackId,
      noOfReels,
      noOfPosts,
      noOfStories,
      numberOfInfluencersRequired,
      minimumFollowersRequired,
      costPerInfluencer,
      tax,
      freeProduct,
    });

    res.status(201).json({
      success: true,
      message: "Business Hack Step-2 created successfully",
      data: detail,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
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

// ✅ UPDATE
export const updateBusinessHackDetail = async (req, res) => {
  try {
    const detail = await BusinessHackDetail.findOne({
      where: {
        id: req.params.id,
        user_id: req.user.userId,
      },
      include: {
        model: BusinessHack,
        where: {
          user_id: req.user.userId, // 🔐 parent ownership check
        },
      },
    });

    if (!detail) {
      return res.status(404).json({
        success: false,
        message: "Detail not found or unauthorized",
      });
    }

    const {
      noOfReels,
      noOfPosts,
      noOfStories,
      numberOfInfluencersRequired,
      minimumFollowersRequired,
      costPerInfluencer,
      tax,
      freeProduct,
    } = req.body;

    // ✅ Safe updated values
    const updatedInfluencers =
      numberOfInfluencersRequired ?? detail.numberOfInfluencersRequired;

    const updatedCPI = costPerInfluencer ?? detail.costPerInfluencer;

    const updatedTax = tax ?? detail.tax;

    // ✅ Recalculate budget (never trust frontend)
    const baseAmount = updatedCPI * updatedInfluencers;
    const taxAmount = (baseAmount * updatedTax) / 100;
    const totalBudget = baseAmount + taxAmount;

    // ✅ Assign values
    Object.assign(detail, {
      noOfReels: noOfReels ?? detail.noOfReels,
      noOfPosts: noOfPosts ?? detail.noOfPosts,
      noOfStories: noOfStories ?? detail.noOfStories,
      numberOfInfluencersRequired: updatedInfluencers,
      minimumFollowersRequired:
        minimumFollowersRequired ?? detail.minimumFollowersRequired,
      costPerInfluencer: updatedCPI,
      tax: updatedTax,
      totalBudget,
      freeProduct: freeProduct ?? detail.freeProduct,
    });

    await detail.save();

    res.status(200).json({
      success: true,
      message: "Business Hack Step-2 updated successfully",
      data: detail,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// ✅ DELETE
export const deleteBusinessHackDetail = async (req, res) => {
  try {
    const detail = await BusinessHackDetail.findOne({
      where: {
        id: req.params.id,
        user_id: req.user.userId,
      },
      include: {
        model: BusinessHack,
        where: {
          user_id: req.user.userId, // 🔐 parent ownership check
        },
      },
    });

    if (!detail) {
      return res.status(404).json({
        success: false,
        message: "Detail not found or unauthorized",
      });
    }

    await detail.destroy();

    res.status(200).json({
      success: true,
      message: "Business Hack Step-2 deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
