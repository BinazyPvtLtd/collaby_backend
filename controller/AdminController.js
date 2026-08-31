import { Op } from "sequelize";
import sequelize from "../config/database.js";
import Admin from "../models/Admin.js";
import BusinessRegistration from "../models/Business.js";
import InfluencerUser from "../models/InfluencerUser.js";
import Campaign from "../models/Campaign.js";
import Deal from "../models/Deal.js";
import Application from "../models/Application.js";
import Brand from "../models/Brand.js";
import Product from "../models/Product.js";
import Banner from "../models/Banner.js";
import Referral from "../models/Referral.js";
import ContentCategory from "../models/contentcategory.js";

import {
  generateAccessToken,
  generateRefreshToken,
} from "../HelperFunction/Tokens.js";

const sanitizeAdminPayload = (admin) => {
  const { password, access_token, refresh_token, ...safe } = admin.toJSON();
  return safe;
};

// ===================================================
// AUTH
// ===================================================

export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const admin = await Admin.findOne({
      where: { email: email.trim().toLowerCase() },
    });

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    if (admin.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "Admin account is inactive",
      });
    }

    const isMatch = await admin.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const payload = {
      adminId: admin.id,
      role: admin.role,
      email: admin.email,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    await admin.update({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    return res.status(200).json({
      success: true,
      message: "Admin login successful",
      accessToken,
      refreshToken,
      admin: sanitizeAdminPayload(admin),
    });
  } catch (error) {
    console.error("ADMIN LOGIN ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Admin login failed",
    });
  }
};

export const adminLogout = async (req, res) => {
  try {
    await Admin.update(
      { access_token: null, refresh_token: null },
      { where: { id: req.admin.id } },
    );

    return res.status(200).json({
      success: true,
      message: "Admin logged out successfully",
    });
  } catch (error) {
    console.error("ADMIN LOGOUT ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Admin logout failed",
    });
  }
};

// ===================================================
// DASHBOARD STATS
// ===================================================

export const getDashboardStats = async (req, res) => {
  try {
    const [
      totalBusinesses,
      totalInfluencers,
      totalCampaigns,
      totalDeals,
      totalApplications,
      totalBanners,
      totalProducts,
      totalReferrals,
      completedDeals,
      approvedDeals,
      pendingApplications,
      liveCampaigns,
    ] = await Promise.all([
      BusinessRegistration.count(),
      InfluencerUser.count(),
      Campaign.count(),
      Deal.count(),
      Application.count(),
      Banner.count(),
      Product.count(),
      Referral.count(),
      Deal.count({ where: { deal_status: "completed" } }),
      Deal.count({ where: { deal_status: "approved" } }),
      Application.count({ where: { status: "pending" } }),
      Campaign.count({ where: { campaignStatus: "Live" } }),
    ]);

    const revenueRow = await Deal.findOne({
      attributes: [
        [sequelize.fn("SUM", sequelize.col("agreed_price")), "total"],
      ],
      where: { deal_status: "completed" },
      raw: true,
    });

    return res.status(200).json({
      success: true,
      data: {
        totalBusinesses,
        totalInfluencers,
        totalCampaigns,
        totalDeals,
        totalApplications,
        totalBanners,
        totalProducts,
        totalReferrals,
        completedDeals,
        approvedDeals,
        pendingApplications,
        liveCampaigns,
        totalRevenue: Number(revenueRow?.total || 0),
      },
    });
  } catch (error) {
    console.error("DASHBOARD STATS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ===================================================
// BUSINESSES (BusinessRegistration)
// ===================================================

export const listBusinesses = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const { search, businessType, city } = req.query;

    const where = {};

    if (businessType) where.businessType = businessType;
    if (city) where.city = city;
    if (search) {
      where[Op.or] = [
        { businessName: { [Op.iLike]: `%${search}%` } },
        { mobileNumber: { [Op.iLike]: `%${search}%` } },
        { gstNumber: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { rows, count } = await BusinessRegistration.findAndCountAll({
      where,
      order: [["id", "DESC"]],
      limit,
      offset,
    });

    return res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error("LIST BUSINESSES ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getBusinessById = async (req, res) => {
  try {
    const business = await BusinessRegistration.findByPk(req.params.id);

    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: business,
    });
  } catch (error) {
    console.error("GET BUSINESS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteBusiness = async (req, res) => {
  try {
    const business = await BusinessRegistration.findByPk(req.params.id);

    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business not found",
      });
    }

    await business.destroy();

    return res.status(200).json({
      success: true,
      message: "Business deleted successfully",
    });
  } catch (error) {
    console.error("DELETE BUSINESS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ===================================================
// INFLUENCERS (InfluencerUser)
// ===================================================

export const listInfluencers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const { search, city, gender } = req.query;

    const where = {};

    if (city) where.city = city;
    if (gender) where.gender = gender;
    if (search) {
      where[Op.or] = [
        { fullName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { mobileNumber: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { rows, count } = await InfluencerUser.findAndCountAll({
      where,
      order: [["id", "DESC"]],
      limit,
      offset,
    });

    return res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error("LIST INFLUENCERS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getInfluencerById = async (req, res) => {
  try {
    const influencer = await InfluencerUser.findByPk(req.params.id);

    if (!influencer) {
      return res.status(404).json({
        success: false,
        message: "Influencer not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: influencer,
    });
  } catch (error) {
    console.error("GET INFLUENCER ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteInfluencer = async (req, res) => {
  try {
    const influencer = await InfluencerUser.findByPk(req.params.id);

    if (!influencer) {
      return res.status(404).json({
        success: false,
        message: "Influencer not found",
      });
    }

    await influencer.destroy();

    return res.status(200).json({
      success: true,
      message: "Influencer deleted successfully",
    });
  } catch (error) {
    console.error("DELETE INFLUENCER ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ===================================================
// CAMPAIGNS
// ===================================================

export const listCampaigns = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const { search, campaignType, campaignStatus } = req.query;

    const where = {};

    if (campaignType) where.campaignType = campaignType;
    if (campaignStatus) where.campaignStatus = campaignStatus;
    if (search) {
      where.title = { [Op.iLike]: `%${search}%` };
    }

    const { rows, count } = await Campaign.findAndCountAll({
      where,
      order: [["id", "DESC"]],
      limit,
      offset,
    });

    return res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error("LIST CAMPAIGNS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getCampaignById = async (req, res) => {
  try {
    const campaign = await Campaign.findByPk(req.params.id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: campaign,
    });
  } catch (error) {
    console.error("GET CAMPAIGN ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateCampaignStatus = async (req, res) => {
  try {
    const { campaignStatus } = req.body;

    if (!["Draft", "Live", "Closed", "Completed"].includes(campaignStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid campaignStatus",
      });
    }

    const campaign = await Campaign.findByPk(req.params.id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found",
      });
    }

    await campaign.update({ campaignStatus });

    return res.status(200).json({
      success: true,
      message: "Campaign status updated",
      data: campaign,
    });
  } catch (error) {
    console.error("UPDATE CAMPAIGN STATUS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findByPk(req.params.id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found",
      });
    }

    await campaign.destroy();

    return res.status(200).json({
      success: true,
      message: "Campaign deleted successfully",
    });
  } catch (error) {
    console.error("DELETE CAMPAIGN ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ===================================================
// APPLICATIONS
// ===================================================

export const listApplications = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const { status } = req.query;

    const where = {};
    if (status) where.status = status;

    const { rows, count } = await Application.findAndCountAll({
      where,
      order: [["id", "DESC"]],
      limit,
      offset,
    });

    return res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error("LIST APPLICATIONS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["pending", "accepted", "rejected", "withdrawn"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const application = await Application.findByPk(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    await application.update({ status });

    return res.status(200).json({
      success: true,
      message: "Application status updated",
      data: application,
    });
  } catch (error) {
    console.error("UPDATE APPLICATION STATUS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ===================================================
// DEALS
// ===================================================

export const listDeals = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const { deal_status } = req.query;

    const where = {};
    if (deal_status) where.deal_status = deal_status;

    const { rows, count } = await Deal.findAndCountAll({
      where,
      order: [["id", "DESC"]],
      limit,
      offset,
    });

    return res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error("LIST DEALS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getDealById = async (req, res) => {
  try {
    const deal = await Deal.findByPk(req.params.id);

    if (!deal) {
      return res.status(404).json({
        success: false,
        message: "Deal not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: deal,
    });
  } catch (error) {
    console.error("GET DEAL ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ===================================================
// BANNERS
// ===================================================

export const listBanners = async (req, res) => {
  try {
    const banners = await Banner.findAll({ order: [["id", "DESC"]] });

    return res.status(200).json({
      success: true,
      data: banners,
    });
  } catch (error) {
    console.error("LIST BANNERS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteBanner = async (req, res) => {
  try {
    const banner = await Banner.findByPk(req.params.id);

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Banner not found",
      });
    }

    await banner.destroy();

    return res.status(200).json({
      success: true,
      message: "Banner deleted successfully",
    });
  } catch (error) {
    console.error("DELETE BANNER ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ===================================================
// PRODUCTS
// ===================================================

export const listProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const { search } = req.query;

    const where = {};
    if (search) {
      where.productName = { [Op.iLike]: `%${search}%` };
    }

    const { rows, count } = await Product.findAndCountAll({
      where,
      order: [["id", "DESC"]],
      limit,
      offset,
    });

    return res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error("LIST PRODUCTS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    await product.destroy();

    return res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("DELETE PRODUCT ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ===================================================
// REFERRALS
// ===================================================

export const listReferrals = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const { rows, count } = await Referral.findAndCountAll({
      order: [["id", "DESC"]],
      limit,
      offset,
    });

    return res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error("LIST REFERRALS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ===================================================
// CONTENT CATEGORIES (Admin only)
// ===================================================

export const listCategories = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    const { search, status } = req.query;

    const where = {};
    if (status !== undefined) where.status = status === 'true';
    if (search) {
      where.category_name = { [Op.iLike]: `%${search}%` };
    }

    const { rows, count } = await ContentCategory.findAndCountAll({
      where,
      order: [["category_name", "ASC"]],
      limit,
      offset,
    });

    return res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error("LIST CATEGORIES ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const createCategory = async (req, res) => {
  try {
    const { category_name } = req.body;

    if (!category_name || !category_name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Category name is required",
      });
    }

    const exists = await ContentCategory.findOne({
      where: { category_name: category_name.trim() },
    });

    if (exists) {
      return res.status(409).json({
        success: false,
        message: "Category already exists",
      });
    }

    const category = await ContentCategory.create({
      category_name: category_name.trim(),
      status: true,
    });

    return res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: category,
    });
  } catch (error) {
    console.error("CREATE CATEGORY ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { category_name, status } = req.body;
    const category = await ContentCategory.findByPk(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    if (category_name !== undefined) {
      const trimmed = category_name.trim();
      if (!trimmed) {
        return res.status(400).json({
          success: false,
          message: "Category name cannot be empty",
        });
      }

      const exists = await ContentCategory.findOne({
        where: {
          category_name: trimmed,
          id: { [Op.ne]: category.id },
        },
      });

      if (exists) {
        return res.status(409).json({
          success: false,
          message: "Category name already exists",
        });
      }

      category.category_name = trimmed;
    }

    if (status !== undefined) {
      category.status = status === true || status === "true";
    }

    await category.save();

    return res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: category,
    });
  } catch (error) {
    console.error("UPDATE CATEGORY ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const category = await ContentCategory.findByPk(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    await category.destroy();

    return res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("DELETE CATEGORY ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
