import multer from "multer";
import path from "path";

// Storage location
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === "thumbnail") {
      cb(null, "uploads/thumbnails/");
    } else if (file.fieldname === "video") {
      cb(null, "uploads/videos/");
    }
  },

  filename: function (req, file, cb) {
    const uniqueName =
      Date.now() + "-" + Math.round(Math.random() * 1e9);

    cb(null, uniqueName + path.extname(file.originalname));
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  if (file.fieldname === "thumbnail") {
    if (!file.mimetype.startsWith("image")) {
      return cb(new Error("Only image allowed for thumbnail"), false);
    }
  }

  if (file.fieldname === "video") {
    if (!file.mimetype.startsWith("video")) {
      return cb(new Error("Only video allowed"), false);
    }
  }

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
});

export default upload;