import BusinessHack from "../models/BusinessHacks.js";
import BusinessHackDetails from "../models/BusinessHackDetail.js";
import BusinessHackStep4 from "../models/BusinessHackStep4.js";
import { Op } from "sequelize";

export const getBusinessHackData = async (req, res) => {
  try {
    const userId = req.user?.userId;
    console.log("REQ.USER:", req.user);
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const BASE_URL = `${req.protocol}://${req.get("host")}`;

    // ✅ Step 1: Get all hacks
    const hacks = await BusinessHack.findAll({
      where: { user_id: userId },
      attributes: ["id", "campaignName", "campaignType"],
      raw: true,
    });

    if (!hacks.length) {
      return res.status(200).json({
        success: true,
        message: "No data found",
        data: [],
      });
    }

    const hackIds = hacks.map((h) => h.id);

    console.log("Hack IDs:", hackIds);

    // ✅ Step 2: Fetch related data
    const detailsData = await BusinessHackDetails.findAll({
      where: {
        businessHackId: {
          [Op.in]: hackIds,
        },
      },
      raw: true,
    });

    const step4Data = await BusinessHackStep4.findAll({
      where: {
        businessHackId: {
          [Op.in]: hackIds,
        },
      },
      raw: true,
    });

    console.log("Details:", detailsData);
    console.log("Step4:", step4Data);

    // ✅ Step 3: Map (IMPORTANT: support multiple rows)
    const detailsMap = {};
    detailsData.forEach((item) => {
      if (!detailsMap[item.businessHackId]) {
        detailsMap[item.businessHackId] = [];
      }
      detailsMap[item.businessHackId].push(item);
    });

    const step4Map = {};
    step4Data.forEach((item) => {
      if (!step4Map[item.businessHackId]) {
        step4Map[item.businessHackId] = [];
      }
      step4Map[item.businessHackId].push(item);
    });

    const toStr = (val) => String(val ?? 0);

    // ✅ Step 4: Merge
    const result = hacks.map((hack) => {
      const detailsArr = detailsMap[hack.id] || [];
      const step4Arr = step4Map[hack.id] || [];

      return {
        businessHackId: String(hack.id),
        campaignName: hack.campaignName,
        campaignType: hack.campaignType,

        // ✅ If multiple rows → return array
        details: detailsArr.map((d) => ({
          noOfReels: toStr(d.noOfReels),
          noOfPosts: toStr(d.noOfPosts),
          noOfStories: toStr(d.noOfStories),
          numberOfInfluencersRequired: toStr(d.numberOfInfluencersRequired),
          costPerInfluencer: toStr(d.costPerInfluencer),
        })),

        step4: step4Arr.map((s) => ({
          campaignImage: s.campaignImage
            ? `${BASE_URL}/${s.campaignImage}`
            : null,
        })),
      };
    });

    return res.status(200).json({
      success: true,
      message: "Business Hack data fetched successfully",
      data: result,
    });
  } catch (error) {
    console.error("ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
