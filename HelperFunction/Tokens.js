import jwt from "jsonwebtoken";

export const generateAccessToken = (payload) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is missing in environment variables");
  }

  return jwt.sign(payload, process.env.JWT_SECRET);
};

export const generateRefreshToken = (payload) => {
  if (!process.env.JWT_REFRESH_SECRET) {
    throw new Error("JWT_REFRESH_SECRET is missing in environment variables");
  }

  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET);
};