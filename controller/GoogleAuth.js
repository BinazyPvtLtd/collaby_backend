import axios from "axios";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const googleLogin = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Google token is required" });
    }

    // 1️⃣ Verify token with Google
    const googleResponse = await axios.get(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${token}`
    );

    const { email, name, email_verified } = googleResponse.data;

    if (!email_verified) {
      return res.status(400).json({
        message: "Google email not verified",
      });
    }

    // 2️⃣ Check if user exists
    let user = await User.findOne({ where: { email } });

    // 3️⃣ If not exists, create user
    if (!user) {
      user = await User.create({
        name: name || null,
        email,
        role: "influencer", // default role
        status: "approved", // auto-approved for Google
      });
    }

    // 4️⃣ Generate JWT
    const jwtToken = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // 5️⃣ Send response
    res.json({
      message: "Google login successful",
      token: jwtToken,
      user,
    });
  } catch (error) {
    res.status(400).json({
      message: "Invalid Google token",
      error: error.response?.data || error.message,
    });
  }
};