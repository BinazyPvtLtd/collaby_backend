import express from "express";
import { verifyAdminToken } from "../middleware/AdminAuthMiddleware.js";
import {
  adminLogin,
  adminLogout,
  getDashboardStats,
  listBusinesses,
  getBusinessById,
  deleteBusiness,
  listInfluencers,
  getInfluencerById,
  deleteInfluencer,
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

const router = express.Router();

// ================= AUTH (public) =================
router.post("/login", adminLogin);

// ================= AUTH (protected) =================
router.post("/logout", verifyAdminToken, adminLogout);

// ================= DASHBOARD =================
router.get("/dashboard", verifyAdminToken, getDashboardStats);

// ================= BUSINESSES =================
router.get("/businesses", verifyAdminToken, listBusinesses);
router.get("/businesses/:id", verifyAdminToken, getBusinessById);
router.delete("/businesses/:id", verifyAdminToken, deleteBusiness);

// ================= INFLUENCERS =================
router.get("/influencers", verifyAdminToken, listInfluencers);
router.get("/influencers/:id", verifyAdminToken, getInfluencerById);
router.delete("/influencers/:id", verifyAdminToken, deleteInfluencer);

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
