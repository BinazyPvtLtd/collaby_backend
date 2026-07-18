import multer from "multer";
import path from "path";
import fs from "fs";

const imagePath = "uploads/BusinessHacksMedia/thumbnails";
const videoPath = "uploads/BusinessHacksMedia/videos";

if (!fs.existsSync(imagePath)) fs.mkdirSync(imagePath, { recursive: true });
if (!fs.existsSync(videoPath)) fs.mkdirSync(videoPath, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {

    if (file.fieldname === "thumbnail") {
      cb(null, imagePath);
    } else if (file.fieldname === "video") {
      cb(null, videoPath);
    }

  },

  filename: (req, file, cb) => {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {

  if (file.fieldname === "thumbnail") {

    const allowedImages = /jpeg|jpg|png|webp/;

    const ext = allowedImages.test(
      path.extname(file.originalname).toLowerCase()
    );

    if (!ext) return cb(new Error("Only image files allowed"));

  }

  if (file.fieldname === "video") {

    const allowedVideos = /mp4|mov|avi|mkv/;

    const ext = allowedVideos.test(
      path.extname(file.originalname).toLowerCase()
    );

    if (!ext) return cb(new Error("Only video files allowed"));

  }

  cb(null, true);
};

export const uploadBusinessHack = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB
  fileFilter,
});