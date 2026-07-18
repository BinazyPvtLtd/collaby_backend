import Profile from "../models/Profile.js";
import fs from "fs";

// ✅ CREATE Profile
export const createProfile = async (req, res) => {
  try {
    const {
      name,
      businessName,
      businessCategories,
      headQuarters,
      foundedIn,
      website,
      bio,
      businessDetails,
      gstin,
      panNumber,
      businessAddress,
      postalCode,
    } = req.body;

    const profileImage = req.file ? req.file.path : null;

    const profile = await Profile.create({
      name,
      user_id: req.user.userId,
      businessName,
      businessCategories,
      headQuarters,
      foundedIn,
      website,
      bio,
      businessDetails,
      gstin,
      panNumber,
      businessAddress,
      postalCode,
      profileImage,
    });

    res.status(201).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// ✅ GET All Profiles
export const getAllProfiles = async (req, res) => {
  try {
    const profiles = await Profile.findAll({
      where: { user_id: req.user.userId },
    });

    res.json({
      success: true,
      data: profiles,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ✅ GET My Profile (/me)
export const getMyProfile = async (req, res) => {
  try {
    const profile = await Profile.findOne({
      where: { user_id: req.user.userId },
    });

    if (!profile) {
      return res.status(200).json({
        success: true,
        message: "Profile not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ✅ UPDATE Profile
export const updateProfile = async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ FIX: Prevent "me" or invalid values
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID",
      });
    }

    const profile = await Profile.findByPk(id);

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    // ✅ SECURITY CHECK
    if (profile.user_id !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // ✅ Safe delete old image
    if (req.file && profile.profileImage) {
      if (fs.existsSync(profile.profileImage)) {
        fs.unlinkSync(profile.profileImage);
      }
    }

    const updatedData = { ...req.body };

    // ❌ Prevent user_id override
    delete updatedData.user_id;

    if (req.file) {
      updatedData.profileImage = req.file.path;
    }

    await profile.update(updatedData);

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: profile,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ✅ DELETE Profile
export const deleteProfile = async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ FIX: Prevent invalid ID
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID",
      });
    }

    const profile = await Profile.findByPk(id);

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    // ✅ Optional: Add security check (recommended)
    if (profile.user_id !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // ✅ Safe delete image
    if (profile.profileImage && fs.existsSync(profile.profileImage)) {
      fs.unlinkSync(profile.profileImage);
    }

    await profile.destroy();

    res.json({
      success: true,
      message: "Profile deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};