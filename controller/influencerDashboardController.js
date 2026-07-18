import Banner from "../models/Banner.js";
import InfluencerUser from "../models/InfluencerUser.js";
import BusinessRegistration from "../models/Business.js";
import Referral from "../models/Referral.js";
import BusinessHack from "../models/BusinessHacks.js";
import BusinessHackDetails from "../models/BusinessHackDetail.js";
import BusinessHackStep3 from "../models/BusinessHackDetail2.js";
import BusinessHackStep4 from "../models/BusinessHackStep4.js";
import BusinessHackVideo from "../models/BusinessHacksVideo.js";
import InfluencerDashboard from "../models/InfluencerDashboard.js";
import InHacks from "../models/InHacks.js";

import {
  convertIdToString,
  formatImagePath,
} from "../HelperFunction/Helper.js";

export const getInfluencerDashboard = async (req, res) => {
  try {
    const { device_type, token } = req.body || {};

    const baseUrl = req.protocol + "://" + req.get("host");

    /* ================= SAVE TOKEN ================= */

    if (token) {
      await InfluencerDashboard.findOrCreate({
        where: { token },
        defaults: {
          device_type: device_type || null,
          token,
        },
      });
    }

    /* ================= FETCH DATA ================= */

    const [
      banners,
      referrals,
      hacks,
      businessVideos,
      inhacksVideos,
      influencerCount,
      businessCount,
    ] = await Promise.all([
      Banner.findAll({
        attributes: ["id", "image"],
        order: [["id", "DESC"]],
        raw: true,
      }),

      Referral.findAll({
        limit: 10,
        order: [["id", "DESC"]],
        raw: true,
      }),

      BusinessHack.findAll({
        order: [["id", "DESC"]],
        raw: true,
      }),

      BusinessHackVideo.findAll({
        limit: 6,
        order: [["id", "DESC"]],
        raw: true,
      }),

      InHacks.findAll({
        limit: 6,
        order: [["id", "DESC"]],
        raw: true,
      }),

      InfluencerUser.count(),

      BusinessRegistration.count(),
    ]);

    /* ================= FETCH CAMPAIGN RELATED TABLES ================= */

    const hackIds = hacks.map((h) => h.id);

    const [details, step3Data, step4Data] = await Promise.all([
      BusinessHackDetails.findAll({
        where: {
          businessHackId: hackIds,
        },
        raw: true,
      }),

      BusinessHackStep3.findAll({
        where: {
          businessHackId: hackIds,
        },
        raw: true,
      }),

      BusinessHackStep4.findAll({
        where: {
          businessHackId: hackIds,
        },
        raw: true,
      }),
    ]);

    /* ================= CREATE MAPS ================= */

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

    /* ================= FINAL CAMPAIGN OBJECT ================= */

    const campaigns = hacks.map((hack) => ({
      business_hack: convertIdToString(hack),

      business_hack_details: detailsMap[hack.id]
        ? convertIdToString(detailsMap[hack.id])
        : null,

      business_hack_step3: step3Map[hack.id]
        ? convertIdToString(step3Map[hack.id])
        : null,

      business_hack_step4: step4Map[hack.id]
        ? {
            ...convertIdToString(step4Map[hack.id]),

            campaignImage: step4Map[hack.id].campaignImage
              ? formatImagePath(step4Map[hack.id].campaignImage)
              : null,

            sampleMedia: Array.isArray(
              step4Map[hack.id].sampleMedia
            )
              ? step4Map[hack.id].sampleMedia.map(formatImagePath)
              : [],
          }
        : null,
    }));

    /* ================= FORMAT OTHER DATA ================= */

    const bannerList = convertIdToString(banners).map((banner) => ({
      ...banner,
      image: `${baseUrl}/${banner.image}`,
    }));

    const topReferrals = convertIdToString(referrals);

    const videoList = convertIdToString(businessVideos).map((video) => ({
      ...video,
      thumbnail: video.thumbnail
        ? `${baseUrl}/${video.thumbnail}`
        : null,

      video_url: video.video_url
        ? `${baseUrl}/${video.video_url}`
        : null,
    }));

    const inhacksList = convertIdToString(inhacksVideos).map((video) => ({
      ...video,

      thumbnail: video.thumbnail
        ? `${baseUrl}/${video.thumbnail}`
        : null,

      video_url: video.video_url
        ? `${baseUrl}/${video.video_url}`
        : null,

      views:
        video.views !== null
          ? String(video.views)
          : "0",

      likes:
        video.likes !== null
          ? String(video.likes)
          : "0",
    }));

    /* ================= TOTAL CAMPAIGNS ================= */

    const totalCampaign = campaigns.length;

    /* ================= RESPONSE ================= */

    return res.status(200).json({
      response: {
        success: true,
        message: "Influencer dashboard fetched successfully",

        banners: bannerList,

        active_users: influencerCount.toString(),

        total_campaign: totalCampaign.toString(),

        top_referrals: topReferrals,

        campaigns: campaigns,

        business_hacks_videos: videoList,

        inhacks_videos: inhacksList,
      },
    });
  } catch (error) {
    console.error("Dashboard Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
      error: error,
    });
  }
};