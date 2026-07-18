import { Op } from "sequelize";

import {
  BusinessHack,
  BusinessHackDetail,
  BusinessHackStep3,
  BusinessHackStep4,
} from "../models/Associations.js";
import { formatImagePath } from "../HelperFunction/Helper.js";
export const getAllBusinessHackData = async (req, res) => {
  try {
    console.log("GET ALL BUSINESS HACK DATA CALLED", req.user);

    const role = req.user?.userType; // will be 'influencer' after middleware fix

    // ✅ Only influencer can access this data
    if (role !== "influencer") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only influencers can view this data.",
      });
    }
    // ✅ Fetch ALL hacks without any condition
    const hacks = await BusinessHack.findAll({
      order: [["id", "DESC"]],
      raw: true,
    });

    console.log("Total Hacks Found:", hacks.length);

    if (!hacks || hacks.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No data found",
        data: [],
      });
    }

    const hackIds = hacks.map((item) => item.id);
    console.log("Hack IDs:", hackIds);

    // ✅ Fetch all related data in parallel
    const [details, step3Data, step4Data] = await Promise.all([
      BusinessHackDetail.findAll({
        where: { businessHackId: { [Op.in]: hackIds } },
        raw: true,
      }),
      BusinessHackStep3.findAll({
        where: { businessHackId: { [Op.in]: hackIds } },
        raw: true,
      }),
      BusinessHackStep4.findAll({
        where: { businessHackId: { [Op.in]: hackIds } },
        raw: true,
      }),
    ]);

    console.log("Details:", details.length);
    console.log("Step3:", step3Data.length);
    console.log("Step4:", step4Data.length);

    // ✅ Build maps keyed by businessHackId
    const detailsMap = {};
    const step3Map = {};
    const step4Map = {};

    details.forEach((item) => (detailsMap[item.businessHackId] = item));
    step3Data.forEach((item) => (step3Map[item.businessHackId] = item));
    step4Data.forEach((item) => (step4Map[item.businessHackId] = item));

    // ✅ Merge all data
    const fullData = hacks.map((hack) => {
      const step4 = step4Map[hack.id];

      let parsedSampleMedia = [];
      if (step4?.sampleMedia) {
        try {
          const raw =
            typeof step4.sampleMedia === "string"
              ? JSON.parse(step4.sampleMedia)
              : step4.sampleMedia;
          parsedSampleMedia = Array.isArray(raw)
            ? raw.map((media) => formatImagePath(media))
            : [];
        } catch {
          parsedSampleMedia = [];
        }
      }

      return {
        business_hack: hack,
        business_hack_details: detailsMap[hack.id] || null,
        business_hack_step3: step3Map[hack.id] || null,
        business_hack_step4: step4
          ? {
              ...step4,
              campaignImage: formatImagePath(step4.campaignImage),
              sampleMedia: parsedSampleMedia,
            }
          : null,
      };
    });

    return res.status(200).json({
      success: true,
      message: "Data fetched successfully",
      total: fullData.length,
      data: fullData,
    });
  } catch (error) {
    console.error("ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ✅ NEW API CONTROLLER that fetch logged in business registered campaigns only
// ✅ GET ONLY BUSINESS USER CREATED CAMPAIGNS
export const getBusinessUserCampaigns = async (req, res) => {
  try {
    console.log("GET BUSINESS USER CAMPAIGNS API CALLED");

    // ✅ Correct token field
    const userId = req.user?.userId;
    const role = req.user?.userType;

    console.log("Logged In User:", req.user);

    // ✅ Only business users allowed
    if (role !== "business") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only business users can access this API.",
      });
    }

    // ✅ Validate token user ID
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User ID missing in token.",
      });
    }

    // ✅ Fetch campaigns created by logged-in business user
    const hacks = await BusinessHack.findAll({
      where: {
        user_id: userId,
      },
      order: [["createdAt", "DESC"]],
      raw: true,
    });

    console.log("Campaigns Found:", hacks.length);

    // ✅ No campaigns
    if (!hacks.length) {
      return res.status(200).json({
        success: true,
        message: "No campaigns found",
        total: 0,
        data: [],
      });
    }

    const hackIds = hacks.map((item) => item.id);

    // ✅ Fetch related tables
    const [details, step3Data, step4Data] = await Promise.all([
      BusinessHackDetail.findAll({
        where: {
          businessHackId: {
            [Op.in]: hackIds,
          },
        },
        raw: true,
      }),

      BusinessHackStep3.findAll({
        where: {
          businessHackId: {
            [Op.in]: hackIds,
          },
        },
        raw: true,
      }),

      BusinessHackStep4.findAll({
        where: {
          businessHackId: {
            [Op.in]: hackIds,
          },
        },
        raw: true,
      }),
    ]);

    // ✅ Maps
    const detailsMap = {};
    const step3Map = {};
    const step4Map = {};

    details.forEach((item) => {
      detailsMap[item.businessHackId] = item;
    });

    step3Data.forEach((item) => {
      step3Map[item.businessHackId] = item;
    });

    step4Data.forEach((item) => {
      step4Map[item.businessHackId] = item;
    });

    // ✅ Final merged response
    const fullData = hacks.map((hack) => {
      const step4 = step4Map[hack.id];

      let parsedSampleMedia = [];

      if (step4?.sampleMedia) {
        try {
          const media =
            typeof step4.sampleMedia === "string"
              ? JSON.parse(step4.sampleMedia)
              : step4.sampleMedia;

          parsedSampleMedia = Array.isArray(media)
            ? media.map((item) => formatImagePath(item))
            : [];
        } catch (err) {
          parsedSampleMedia = [];
        }
      }

      return {
        business_hack: hack,

        business_hack_details: detailsMap[hack.id] || null,

        business_hack_step3: step3Map[hack.id] || null,

        business_hack_step4: step4
          ? {
              ...step4,
              campaignImage: formatImagePath(step4.campaignImage),
              sampleMedia: parsedSampleMedia,
            }
          : null,
      };
    });

    return res.status(200).json({
      success: true,
      message: "Business campaigns fetched successfully",
      total: fullData.length,
      data: fullData,
    });
  } catch (error) {
    console.error("ERROR IN GET BUSINESS CAMPAIGNS:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//get all campigns creted by one business user
export const getBusinessCampaigns = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const role = req.user?.userType;

    // Only business user allowed
    if (role !== "business") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const campaigns = await BusinessHack.findAll({
      where: {
        user_id: userId,
      },

      include: [
        {
          model: BusinessHackDetail,
          as: "business_hack_details",
        },
        {
          model: BusinessHackStep3,
          as: "business_hack_step3",
        },
        {
          model: BusinessHackStep4,
          as: "business_hack_step4",
        },
      ],

      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      total: campaigns.length,
      data: campaigns,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
