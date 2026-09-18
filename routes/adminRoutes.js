import express from "express";
import { verifyAdminToken } from "../middleware/AdminAuthMiddleware.js";
import { listCampaigns as workflowList, getCampaign as workflowGet, changeStatus, updateDraft, removeCampaign, getAudit, mutateStep, resolveObligations, requireAdminPermission } from "../controller/campaignWorkflow.controller.js";
import { listAllApplications, supportApplicationDecision } from "../controller/applicationWorkflow.controller.js";
import uploadStep4 from "../middleware/uploadStep4.js";
import {
  adminLogin,
  adminLogout,
  getDashboardStats,
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
router.get("/dashboard", verifyAdminToken, requireAdminPermission("campaign:read:any"), requireAdminPermission("application:read:any"), requireAdminPermission("deal:read:any"), getDashboardStats);

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
router.get("/campaigns", verifyAdminToken, workflowList("basic"));
router.get("/campaigns/:id", verifyAdminToken, workflowGet("basic"));
router.put("/campaigns/:id", verifyAdminToken, updateDraft("basic"));
router.patch("/campaigns/:id/status", verifyAdminToken, changeStatus("basic"));
router.delete("/campaigns/:id", verifyAdminToken, removeCampaign("basic"));
router.get("/campaigns/:id/audit", verifyAdminToken, getAudit("basic"));

// Separate namespaces keep IDs from the two campaign tables unambiguous.
router.get("/business-campaigns", verifyAdminToken, workflowList("multi"));
router.get("/business-campaigns/:id", verifyAdminToken, workflowGet("multi"));
router.put("/business-campaigns/:id", verifyAdminToken, updateDraft("multi"));
router.patch("/business-campaigns/:id/status", verifyAdminToken, changeStatus("multi"));
router.delete("/business-campaigns/:id", verifyAdminToken, removeCampaign("multi"));
router.get("/business-campaigns/:id/audit", verifyAdminToken, getAudit("multi"));
router.put("/business-campaigns/:campaignId/steps/:step", verifyAdminToken, requireAdminPermission("campaign:support-edit"), uploadStep4, mutateStep(null, "update"));

// ================= APPLICATIONS =================
router.get("/applications", verifyAdminToken, listAllApplications);
router.patch(
  "/applications/:id/status",
  verifyAdminToken,
  supportApplicationDecision,
);

// ================= DEALS =================
router.get("/deals", verifyAdminToken, requireAdminPermission("deal:read:any"), listDeals);
router.get("/deals/:id", verifyAdminToken, requireAdminPermission("deal:read:any"), getDealById);
router.post("/deals/:id/resolve-obligations", verifyAdminToken, resolveObligations);

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
