import BusinessHacks from "../models/BusinessHacksVideo.js";
import fs from "fs";
import path from "path";

// const BASE_URL = "http://localhost:5000/";
const BASE_URL = "http://13.201.88.246/";

const imagePath = "uploads/BusinessHacksMedia/thumbnails";
const videoPath = "uploads/BusinessHacksMedia/videos";

// Convert file name to full URL
const convertMediaUrl = (data) => {
  if (!data) return data;

  const item = data.toJSON ? data.toJSON() : data;

  return {
    ...item,
    thumbnail: item.thumbnail
      ? BASE_URL + imagePath + "/" + item.thumbnail
      : null,
    video: item.video ? BASE_URL + videoPath + "/" + item.video : null,
  };
};

// ===============================
// CREATE Business Hack
// ===============================
export const createBusinessHack = async (req, res) => {
  try {
    const { title, description, uploader, duration } = req.body;

    if (!title) {
      return res.status(400).json({
        status: false,
        message: "Title is required",
      });
    }

    const thumbnail = req.files?.thumbnail
      ? req.files.thumbnail[0].filename
      : null;

    const video = req.files?.video ? req.files.video[0].filename : null;

    if (!video) {
      return res.status(400).json({
        status: false,
        message: "Video file is required",
      });
    }

    const hack = await BusinessHacks.create({
      title,
      description,
      thumbnail,
      video,
      uploader,
      duration,
    });

    res.status(201).json({
      status: true,
      message: "Business Hack created successfully",
      data: convertMediaUrl(hack),
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

// ===============================
// GET All Business Hacks
// ===============================
export const getAllBusinessHacks = async (req, res) => {
  try {
    const hacks = await BusinessHacks.findAll({
      order: [["created_at", "DESC"]],
    });

    const formatted = hacks.map((hack) => convertMediaUrl(hack));

    res.json({
      status: true,
      data: formatted,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};
// ===============================
// GET Single Business Hack
// ===============================
export const getBusinessHackById = async (req, res) => {
  try {
    const { id } = req.params;

    const hack = await BusinessHacks.findByPk(id);

    if (!hack) {
      return res.status(404).json({
        status: false,
        message: "Business Hack not found",
      });
    }

    res.json({
      status: true,
      data: convertMediaUrl(hack),
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

// ===============================
// UPDATE Business Hack
// ===============================
export const updateBusinessHack = async (req, res) => {
  try {
    const { id } = req.params;

    const hack = await BusinessHacks.findByPk(id);

    if (!hack) {
      return res.status(404).json({
        status: false,
        message: "Business Hack not found",
      });
    }

    let thumbnail = hack.thumbnail;
    let video = hack.video;

    // Update thumbnail
    if (req.files?.thumbnail) {
      if (hack.thumbnail) {
        const oldThumb = path.join("uploads/thumbnails", hack.thumbnail);

        if (fs.existsSync(oldThumb)) {
          fs.unlinkSync(oldThumb);
        }
      }

      thumbnail = req.files.thumbnail[0].filename;
    }

    // Update video
    if (req.files?.video) {
      if (hack.video) {
        const oldVideo = path.join("uploads/videos", hack.video);

        if (fs.existsSync(oldVideo)) {
          fs.unlinkSync(oldVideo);
        }
      }

      video = req.files.video[0].filename;
    }

    await hack.update({
      ...req.body,
      thumbnail,
      video,
    });

    res.json({
      status: true,
      message: "Business Hack updated successfully",
      data: hack,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

// ===============================
// DELETE Business Hack
// ===============================
export const deleteBusinessHack = async (req, res) => {
  try {
    const { id } = req.params;

    const hack = await BusinessHacks.findByPk(id);

    if (!hack) {
      return res.status(404).json({
        status: false,
        message: "Business Hack not found",
      });
    }

    // Delete thumbnail
    if (hack.thumbnail) {
      const thumbPath = path.join("uploads/BusinessHacksMedia/thumbnails", hack.thumbnail);

      if (fs.existsSync(thumbPath)) {
        fs.unlinkSync(thumbPath);
      }
    }

    // Delete video
    if (hack.video) {
      const videoPath = path.join("uploads/BusinessHacksMedia/videos", hack.video);

      if (fs.existsSync(videoPath)) {
        fs.unlinkSync(videoPath);
      }
    }

    await hack.destroy();

    res.json({
      status: true,
      message: "Business Hack deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};
