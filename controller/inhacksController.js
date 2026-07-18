import { convertIdToStringHacks } from "../HelperFunction/Helper.js";
import InHacks from "../models/InHacks.js";

// const baseUrl = "http://192.168.1.104:5000/";
const baseUrl = "http://13.201.88.246/";

// CREATE VIDEO
export const createInhack = async (req, res) => {
  try {
    const { title, description, uploader, duration, likes, views } = req.body;

    const thumbnail = req.files?.thumbnail
      ? req.files.thumbnail[0].filename
      : null;

    const video_url = req.files?.video ? req.files.video[0].filename : null;

    const data = await InHacks.create({
      user_id: req.user.userId, // ✅ FIXED
      title,
      description,
      thumbnail,
      video_url,
      uploader,
      duration,
      likes: likes || 0,
      views: views || 0,
    });

    const formatted = convertIdToStringHacks(data);

    formatted.thumbnail = thumbnail
      ? `${baseUrl}uploads/thumbnails/${thumbnail}`
      : null;

    formatted.video_url = video_url
      ? `${baseUrl}uploads/videos/${video_url}`
      : null;

    res.json({
      status: true,
      message: "Video uploaded successfully",
      data: formatted,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

// GET ALL VIDEOS
export const getAllInhacks = async (req, res) => {
  try {
    const data = await InHacks.findAll({
      order: [["created_at", "DESC"]],
    });

    const list = convertIdToStringHacks(data);

    const formatted = list.map((video) => ({
      ...video,
      thumbnail: video.thumbnail
        ? baseUrl + "uploads/thumbnails/" + video.thumbnail
        : null,
      video_url: video.video_url
        ? baseUrl + "uploads/videos/" + video.video_url
        : null,
    }));

    res.json({
      response: {
        status: true,
        message: "InHacks List data fetched successfully!",
        inhacksList: formatted,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

// GET SINGLE VIDEO
export const getSingleInhack = async (req, res) => {
  try {
    const data = await InHacks.findByPk(req.params.id);

    if (!data) {
      return res.json({
        status: false,
        message: "Video not found",
      });
    }

    const formatted = convertIdToStringHacks(data);

    formatted.thumbnail = formatted.thumbnail
      ? baseUrl + "uploads/thumbnails/" + formatted.thumbnail
      : null;

    formatted.video_url = formatted.video_url
      ? baseUrl + "uploads/videos/" + formatted.video_url
      : null;

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

// UPDATE VIDEO
export const updateInhack = async (req, res) => {
  try {
    const data = await InHacks.findByPk(req.params.id);

    if (!data) {
      return res.json({
        status: false,
        message: "Video not found",
      });
    }

    const { title, description, uploader, duration, likes, views } = req.body;

    const thumbnail = req.files?.thumbnail
      ? req.files.thumbnail[0].filename
      : data.thumbnail;

    const video_url = req.files?.video
      ? req.files.video[0].filename
      : data.video_url;

    await data.update({
      title,
      description,
      thumbnail,
      video_url,
      uploader,
      duration,
      likes: likes ?? data.likes,
      views: views ?? data.views,
    });

    const formatted = convertIdToStringHacks(data);

    formatted.thumbnail = thumbnail
      ? baseUrl + "uploads/thumbnails/" + thumbnail
      : null;

    formatted.video_url = video_url
      ? baseUrl + "uploads/videos/" + video_url
      : null;

    res.json({
      status: true,
      message: "Video updated successfully",
      data: formatted,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

// DELETE VIDEO
export const deleteInhack = async (req, res) => {
  try {
    const data = await InHacks.findByPk(req.params.id);

    if (!data) {
      return res.json({
        status: false,
        message: "Video not found",
      });
    }

    await data.destroy();

    res.json({
      status: true,
      message: "Video deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

//In real apps views and likes are incremented, not manually set.
export const increaseView = async (req, res) => {
  try {
    const data = await InHacks.findByPk(req.params.id);

    if (!data) {
      return res.json({
        status: false,
        message: "Video not found",
      });
    }

    data.views += 1;
    await data.save();

    res.json({
      status: true,
      message: "View increased",
      views: data.views,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

export const increaseLike = async (req, res) => {
  try {
    const data = await InHacks.findByPk(req.params.id);

    if (!data) {
      return res.json({
        status: false,
        message: "Video not found",
      });
    }

    data.likes += 1;
    await data.save();

    res.json({
      status: true,
      message: "Like added",
      likes: data.likes,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};
