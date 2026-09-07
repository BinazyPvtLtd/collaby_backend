import { verifyToken } from "./AuthMiddleware.js";
import InfluencerUser from "../models/InfluencerUser.js";

// Require an existing influencer account for owner routes.
export const verifyInfluencerAccountAccess = (req, res, next) => {
  verifyToken(req, res, async () => {
    if (req.user.userType !== "influencer" || !Number.isInteger(req.user.userId) || req.user.userId <= 0) {
      return res.status(403).json({ success: false, message: "Influencer account access required" });
    }
    try {
      const account = await InfluencerUser.findByPk(req.user.userId, { attributes: ["id", "mobileNumber"] });
      if (!account) return res.status(401).json({ success: false, message: "Account no longer available" });
      req.influencerAccount = account;
      return next();
    } catch (error) {
      return res.status(500).json({ success: false, message: "Unable to verify account" });
    }
  });
};
