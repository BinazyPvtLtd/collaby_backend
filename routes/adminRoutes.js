import express from "express";
import { verifyAdminToken } from "../middleware/AdminAuthMiddleware.js";
import {
  adminLogin,
  adminLogout,
  getDashboardStats,
  listCampaigns,
  getCampaignById,
  updateCampaignStatus,
  deleteCampaign,
  listApplications,
  updateApplicationStatus,
  listDeals,
  getDealById,
  listBanners,
  deleteBanner,
  listProducts,
  deleteProduct,
  listReferrals,
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controller/AdminController.js";
import {
  getAllInfluencers,
  getInfluencerById,
  updateInfluencer,
  deleteInfluencerByPhone,
} from "../controller/InfluencerUserController.js";

import {
  getAllBusinesses,
  getBusinessById,
  updateBusiness,
  deleteBusinessByPhone,
} from "../controller/businessController.js";

const router = express.Router();

// Shared business controllers use this verified access context.
const businessAdminAccess = (req, res, next) => {
  if (req.admin?.role !== "admin") {
    return res
      .status(403)
      .json({ success: false, message: "Admin access denied" });
  }
  req.businessAccess = { role: "admin", id: req.admin.id };
  next();
};

// ================= AUTH (public) =================
router.post("/login", adminLogin);

// ================= AUTH (protected) =================
router.post("/logout", verifyAdminToken, adminLogout);

// ================= DASHBOARD =================
router.get("/dashboard", verifyAdminToken, getDashboardStats);

// ================= BUSINESSES =================
router.get(
  "/businesses",
  verifyAdminToken,
  businessAdminAccess,
  getAllBusinesses,
);
router.get(
  "/businesses/:id",
  verifyAdminToken,
  businessAdminAccess,
  getBusinessById,
);
router.put(
  "/businesses/:id",
  verifyAdminToken,
  businessAdminAccess,
  updateBusiness,
);
router.delete(
  "/businesses/:phone",
  verifyAdminToken,
  businessAdminAccess,
  deleteBusinessByPhone,
);

// ================= INFLUENCERS =================
router.get("/influencers", verifyAdminToken, getAllInfluencers);
router.get("/influencers/:id", verifyAdminToken, getInfluencerById);
router.put("/influencers/:id", verifyAdminToken, updateInfluencer);
router.delete("/influencers/:phone", verifyAdminToken, deleteInfluencerByPhone);

// ================= CAMPAIGNS =================
router.get("/campaigns", verifyAdminToken, listCampaigns);
router.get("/campaigns/:id", verifyAdminToken, getCampaignById);
router.patch("/campaigns/:id/status", verifyAdminToken, updateCampaignStatus);
router.delete("/campaigns/:id", verifyAdminToken, deleteCampaign);

// ================= APPLICATIONS =================
router.get("/applications", verifyAdminToken, listApplications);
router.patch(
  "/applications/:id/status",
  verifyAdminToken,
  updateApplicationStatus,
);

// ================= DEALS =================
router.get("/deals", verifyAdminToken, listDeals);
router.get("/deals/:id", verifyAdminToken, getDealById);

// ================= BANNERS =================
router.get("/banners", verifyAdminToken, listBanners);
router.delete("/banners/:id", verifyAdminToken, deleteBanner);

// ================= PRODUCTS =================
router.get("/products", verifyAdminToken, listProducts);
router.delete("/products/:id", verifyAdminToken, deleteProduct);

// ================= REFERRALS =================
router.get("/referrals", verifyAdminToken, listReferrals);

// ================= CATEGORIES =================
router.get("/categories", verifyAdminToken, listCategories);
router.post("/categories", verifyAdminToken, createCategory);
router.put("/categories/:id", verifyAdminToken, updateCategory);
router.delete("/categories/:id", verifyAdminToken, deleteCategory);

export default router;
