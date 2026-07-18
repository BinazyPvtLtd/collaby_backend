import Influencer from "../models/influencer.js";
import sequelize from "../config/database.js";
import slugify from "slugify";
import {
  convertToString,
  formatGender,
  parseArray,
} from "../HelperFunction/Helper.js";
import path from "path";
import fs from "fs";
import { validate as isUUID } from "uuid";

export const createInfluencer = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const userId = req.user.userId;

    const exists = await Influencer.findOne({
      where: { userId }, // ✅ use model field
    });

    if (exists) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Influencer already exists for this user",
      });
    }

    const {
      fullName,
      instagramUsername,
      followersCount,
      engagementRate,
      niche,
      city,
      bio,
      email,
      dob,
      rateCard,
      portfolioLinks,
      languages,
      gender,
      contentCategories,
    } = req.body;

    // ✅ slug fix
    const slug = slugify(`${fullName}-${instagramUsername}`, {
      lower: true,
      strict: true,
    });

    const influencer = await Influencer.create(
      {
        fullName,
        slug, // ✅ REQUIRED FIX
        instagramUsername,
        followersCount: Number(followersCount),
        engagementRate: engagementRate ? Number(engagementRate) : null,
        niche: parseArray(niche),
        city,
        bio,
        email,
        dob,
        rateCard,
        portfolioLinks: parseArray(portfolioLinks),
        languages: parseArray(languages),
        gender: formatGender(gender),
        contentCategories: parseArray(contentCategories),

        userId: userId, // ✅ IMPORTANT FIX
      },
      { transaction },
    );

    await transaction.commit();

    return res.status(201).json({
      success: true,
      data: influencer,
    });
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json({ error: error.message });
  }
};

// UPDATE
export const updateInfluencer = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;

    if (!isUUID(id)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Invalid influencer ID (UUID required)",
      });
    }

    const influencer = await Influencer.findByPk(id);

    // ✅ FIRST check existence
    if (!influencer) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Influencer not found",
      });
    }

    // ❌ 403 CHECK REMOVED HERE

    const {
      fullName,
      instagramUsername,
      followersCount,
      engagementRate,
      niche,
      city,
      bio,
      rateCard,
      portfolioLinks,
      languages,
      gender,
      dob,
      email,
      contentCategories,
    } = req.body;

    const parseArray = (field) => {
      if (!field) return [];
      if (Array.isArray(field)) return field;

      if (typeof field === "string" && !field.startsWith("[")) {
        return field.split(",").map((item) => item.trim());
      }

      try {
        return JSON.parse(field);
      } catch {
        return [];
      }
    };

    const parsedFollowers =
      followersCount !== undefined
        ? Number(followersCount)
        : influencer.followersCount;

    const parsedEngagement =
      engagementRate !== undefined
        ? Number(engagementRate)
        : influencer.engagementRate;

    if (
      instagramUsername &&
      instagramUsername !== influencer.instagramUsername
    ) {
      const existingUser = await Influencer.findOne({
        where: { instagramUsername },
      });

      if (existingUser) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: "Instagram username already exists",
        });
      }
    }

    if (email && email !== influencer.email) {
      const existingEmail = await Influencer.findOne({
        where: { email },
      });

      if (existingEmail) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: "Email already exists",
        });
      }
    }

    let profilePhoto = influencer.profilePhoto;

    if (req.file) {
      if (profilePhoto) {
        const oldImageName = profilePhoto.split("/uploads/")[1];
        const oldImagePath = path.join("uploads", oldImageName);

        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }

      profilePhoto = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
    }

    const updatedSlug =
      fullName || instagramUsername
        ? slugify(
            `${fullName || influencer.fullName}-${
              instagramUsername || influencer.instagramUsername
            }`,
            { lower: true, strict: true },
          )
        : influencer.slug;

    let formattedGender = influencer.gender;

    if (gender) {
      const temp =
        gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase();

      const validGenders = ["Male", "Female", "Other"];

      if (!validGenders.includes(temp)) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: "Invalid gender value",
        });
      }

      formattedGender = temp;
    }

    await influencer.update(
      {
        fullName: fullName || influencer.fullName,
        slug: updatedSlug,
        profilePhoto,
        instagramUsername: instagramUsername || influencer.instagramUsername,
        followersCount: parsedFollowers,
        engagementRate: parsedEngagement,
        niche: niche ? parseArray(niche) : influencer.niche,
        city: city || influencer.city,
        bio: bio || influencer.bio,
        rateCard: rateCard || influencer.rateCard,
        portfolioLinks: portfolioLinks
          ? parseArray(portfolioLinks)
          : influencer.portfolioLinks,
        languages: languages ? parseArray(languages) : influencer.languages,
        gender: formattedGender,
        contentCategories: contentCategories
          ? parseArray(contentCategories)
          : influencer.contentCategories,
        email: email || influencer.email,
        dob: dob || influencer.dob,
      },
      { transaction },
    );

    await transaction.commit();

    return res.status(200).json({
      success: true,
      message: "Influencer updated successfully",
      data: convertToString(influencer.toJSON()),
    });
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET BY ID
export const getMyInfluencer = async (req, res) => {
  try {
    const userId = req.user.userId;

    const influencer = await Influencer.findOne({
      where: { user_id: userId }, // ✅ CORRECT
    });

    if (!influencer) {
      return res.status(200).json({
        success: false,
        message: "Influencer not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: influencer,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

//get influencer by user_id
export const getInfluencerByUserId = async (req, res) => {
  try {
    const userId = req.user.userId; // ✅ FIXED (was wrong before)

    const influencer = await Influencer.findOne({
      where: { user_id: userId }, // ✅ FIXED
    });

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
    return res.status(500).json({ error: error.message });
  }
};

// GET ALL
export const getAllInfluencers = async (req, res) => {
  try {
    const influencers = await Influencer.findAll({
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      total: influencers.length,
      data: influencers,
    });
  } catch (error) {
    console.error("GET ALL ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// DELETE
export const deleteInfluencer = async (req, res) => {
  try {
    const influencer = await Influencer.findByPk(req.params.id);

    if (!influencer) {
      return res.status(404).json({ message: "Influencer not found" });
    }

    // ✅ ownership check
    if (influencer.user_id !== req.user.userId) {
      return res.status(403).json({
        message: "Unauthorized",
      });
    }

    await influencer.destroy();

    return res.status(200).json({
      message: "Influencer deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
