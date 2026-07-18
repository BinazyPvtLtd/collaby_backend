import multer from "multer";
import fs from "fs";
import path from "path";
import crypto from "crypto";

// Folders
const campaignDir = "uploads/campaign-images";
const sampleDir = "uploads/sample-media";

// Ensure folders exist
[campaignDir, sampleDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "campaignImage") {
      cb(null, campaignDir);
    } else if (file.fieldname === "sampleMedia") {
      cb(null, sampleDir);
    } else {
      cb(new Error("Invalid field"), false);
    }
  },

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const safeName = crypto.randomBytes(16).toString("hex") + ext;
    cb(null, safeName);
  },
});

// File filter (SECURITY 🔒)
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "video/mp4"];

  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error("Invalid file type"), false);
  }

  cb(null, true);
};

const uploadStep4 = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
}).fields([
  { name: "campaignImage", maxCount: 1 },
  { name: "sampleMedia", maxCount: 10 },
]);

export default uploadStep4;