import Application from "../models/Application.js";
import BusinessRegistration from "../models/Business.js";
import InfluencerUser from "../models/InfluencerUser.js";
import validator from "validator";
import User from "../models/User.js";
import BusinessHack from "../models/BusinessHacks.js";
const { isUUID } = validator;
/**
 * @desc    Influencer applies to a campaign
 * @route   POST /api/applications
 * @access  Influencer (Protected)
 */

export const applyToCampaign = async (req, res) => {
  try {
    const { campaignId, pitchMessage, expectedRate, brandId } = req.body;
    const user = req.user;

    // ✅ Auth check
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // ✅ Role check
    if (user.userType !== "influencer") {
      return res.status(403).json({
        success: false,
        message: "Only influencers can apply",
      });
    }

    const influencerId = String(user.userId);
    const campaignIdStr = String(campaignId); // convert to string
    // ✅ Validate UUID
    if (!validator.isUUID(influencerId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid influencer ID",
      });
    }
    const campaignIdNum = Number(campaignId);

    if (!campaignId || isNaN(campaignIdNum)) {
      return res.status(400).json({
        success: false,
        message: "Invalid campaign ID",
      });
    }
    // 🔍 Check duplicate
    const existing = await Application.findOne({
      where: {
        campaign_id: campaignIdNum,
        influencer_id: influencerId,
      },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Already applied to this campaign",
      });
    }

    // Create
    const application = await Application.create({
      user_id: user.userId, // ✅ FIXED
      campaign_id: campaignIdNum,
      influencer_id: influencerId,
      brand_id: brandId,
      pitch_message: pitchMessage,
      expected_rate: expectedRate,
    });

    return res.status(201).json({
      success: true,
      message: "Application submitted successfully",
      data: application,
    });
  } catch (error) {
    console.error("ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Get all applications of logged-in influencer
 * @route   GET /api/applications/my
 * @access  Influencer (Protected)
 */
export const getMyApplications = async (req, res) => {
  try {
    const user = req.user;

    // Auth check
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Role check
    if (user.userType !== "influencer") {
      return res.status(403).json({
        success: false,
        message: "Only influencers can view their applications",
      });
    }

    const influencerId = String(user.userId);

    // UUID validation
    if (!validator.isUUID(influencerId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid influencer ID",
      });
    }

    const applications = await Application.findAll({
      where: { influencer_id: influencerId },
      order: [["createdAt", "DESC"]],
    });

    return res.json({
      success: true,
      count: applications.length,
      data: applications,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
/**
 * @desc    Get all applications for a specific campaign
 * @route   GET /api/applications/campaign/:campaignId
 * @access  Brand (Protected)
 */
export const getApplicationsByCampaign = async (req, res) => {
  try {
    // Correct param name
    const { campaignId } = req.params;

    // Validation
    if (!campaignId) {
      return res.status(400).json({
        success: false,
        message: "campaignId is required",
      });
    }

    // If DB column is INTEGER
    if (isNaN(campaignId)) {
      return res.status(400).json({
        success: false,
        message: "campaignId must be a number",
      });
    }

    const applications = await Application.findAll({
      where: { campaign_id: Number(campaignId) },
    });

    return res.json({
      success: true,
      data: applications,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
import Deal from "../models/Deal.js";
import sequelize from "../config/database.js";

/**
 * @desc    Brand accepts an application and creates a deal
 * @route   POST /api/applications/:id/accept
 * @access  Brand (Protected)
 */

export const acceptApplication = async (req, res) => {
  let transaction = null;

  try {
    // Create transaction safely
    transaction = await sequelize.transaction();

    const { id } = req.params;
    const user = req.user;

    // Auth check
    if (!user) {
      if (transaction && !transaction.finished) {
        await transaction.rollback();
      }

      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Role check
    if (user.userType !== "business") {
      if (transaction && !transaction.finished) {
        await transaction.rollback();
      }

      return res.status(403).json({
        success: false,
        message: "Only brands can accept applications",
      });
    }

    const businessId = user.userId;

    // Validate ID
    const applicationId = Number(id);

    if (!id || isNaN(applicationId)) {
      if (transaction && !transaction.finished) {
        await transaction.rollback();
      }

      return res.status(400).json({
        success: false,
        message: "Invalid application ID",
      });
    }

    // Find application
    const application = await Application.findByPk(applicationId, {
      transaction,
    });

    if (!application) {
      if (transaction && !transaction.finished) {
        await transaction.rollback();
      }

      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    // Prevent re-accept
    if (application.status !== "pending") {
      if (transaction && !transaction.finished) {
        await transaction.rollback();
      }

      return res.status(400).json({
        success: false,
        message: `Application already ${application.status}`,
      });
    }

    // 🔍 Find campaign
    const campaign = await BusinessHack.findByPk(application.campaign_id, {
      transaction,
    });

    console.log("CAMPAIGN FOUND:", campaign);

    if (!campaign) {
      if (transaction && !transaction.finished) {
        await transaction.rollback();
      }

      return res.status(404).json({
        success: false,
        message: "Campaign not found",
      });
    }

    // ❌ Prevent duplicate deal
    const existingDeal = await Deal.findOne({
      where: {
        application_id: application.id,
      },
      transaction,
    });

    if (existingDeal) {
      if (transaction && !transaction.finished) {
        await transaction.rollback();
      }

      return res.status(400).json({
        success: false,
        message: "Deal already exists for this application",
      });
    }

    console.log("Application", application);

    // ✅ Update status
    application.status = "accepted";

    await application.save({ transaction });

    // 🤝 Create Deal
    const deal = await Deal.create(
      {
        user_id: application.user_id, // influencer becomes the user in the deal
        campaign_id: application.campaign_id,
        application_id: application.id,
        influencer_id: application.influencer_id,
        brand_id: application.brand_id,
        business_id: businessId,
        agreed_price: application.expected_rate || 0,
        deal_status: "accepted",
      },
      { transaction },
    );

    // ✅ Commit transaction
    await transaction.commit();

    return res.status(200).json({
      success: true,
      message: "Application accepted and deal created",
      data: deal,
    });
  } catch (error) {
    console.error("ACCEPT APPLICATION ERROR:", error);

    try {
      if (transaction && !transaction.finished) {
        await transaction.rollback();
      }
    } catch (rollbackError) {
      console.error("ROLLBACK ERROR:", rollbackError);
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Brand rejects an application
 * @route   POST /api/applications/:id/reject
 * @access  Brand (Protected)
 */
export const rejectApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    // ✅ Auth
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // ✅ Role check
    if (user.userType !== "business") {
      return res.status(403).json({
        success: false,
        message: "Only brands can reject applications",
      });
    }

    const applicationId = Number(id);

    // ✅ Validate ID
    if (!id || isNaN(applicationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid application ID",
      });
    }

    const application = await Application.findByPk(applicationId);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    // ❌ Prevent re-action
    if (application.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Application already ${application.status}`,
      });
    }

    application.status = "rejected";
    await application.save();

    return res.json({
      success: true,
      message: "Application rejected successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
/**
 * @desc    Influencer withdraws their application
 * @route   POST /api/applications/:id/withdraw
 * @access  Influencer (Protected)
 */
export const withdrawApplication = async (req, res) => {
  try {
    const { id } = req.params;

    // Logged-in influencer ID
    const influencerId = req.user.userId;

    // Find application that belongs to this influencer
    const application = await Application.findOne({
      where: {
        id,
        influencer_id: influencerId,
      },
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    // 🔁 Update status to withdrawn
    application.status = "withdrawn";
    await application.save();

    res.json({
      success: true,
      message: "Application withdrawn successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// //get all influencer applicants for a campaign (brand user)
// export const getCampaignApplicants = async (req, res) => {
//   try {
//     const { campaignId } = req.params;

//     const applications = await Application.findAll({
//       where: {
//         campaign_id: campaignId,
//       },

//       include: [
//         {
//           model: User,
//           as: "influencer", // association alias
//           attributes: ["id", "name", "email", "profilePhoto", "followers"],
//         },
//       ],

//       order: [["createdAt", "DESC"]],
//     });

//     return res.status(200).json({
//       success: true,
//       totalApplicants: applications.length,
//       data: applications,
//     });
//   } catch (error) {
//     console.log(error);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch applicants",
//       error: error.message,
//     });
//   }
// };

//api to get all influencers applied to a campaign (brand user)

export const getCampaignApplicants = async (req, res) => {
  try {
    const { campaignId } = req.params;

    if (!campaignId) {
      return res.status(400).json({
        success: false,
        message: "Campaign ID is required",
      });
    }

    const applicants = await Application.findAll({
      where: {
        campaign_id: campaignId,
      },

      include: [
        {
          model: User,
          as: "influencer",
          attributes: ["id", "name", "email"],
        },
      ],

      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      total: applicants.length,
      data: applicants,
    });
  } catch (error) {
    console.error("Get Campaign Applicants Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
