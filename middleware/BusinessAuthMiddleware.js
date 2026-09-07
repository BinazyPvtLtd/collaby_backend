import jwt from "jsonwebtoken";
import Business from "../models/Business.js";

export const verifyBusinessAccess = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ success: false, message: "No token provided" });
  }

  let decoded;
  try {
    decoded = jwt.verify(header.slice(7), process.env.JWT_SECRET);
  } catch {
    return res
      .status(401)
      .json({ success: false, message: "Invalid or expired token" });
  }

  try {
    if (decoded.userType === "business" && decoded.userId) {
      const business = await Business.findByPk(decoded.userId, {
        attributes: ["id"],
      });
      if (!business) {
        return res
          .status(401)
          .json({ success: false, message: "Business account not found" });
      }
      req.businessAccess = { role: "business", id: business.id };
    } else {
      return res
        .status(403)
        .json({ success: false, message: "Business access required" });
    }
  } catch (error) {
    console.error("Business authentication failed:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Unable to authenticate account" });
  }
  return next();
};

