import Brand from "../models/Brand.js";
import multer from "multer";
import path from "path";
import fs from "fs";

// Ensure logo folder exists
const logoDir = "uploads/logo";
if (!fs.existsSync(logoDir)) {
  fs.mkdirSync(logoDir, { recursive: true });
}

// Multer Storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, logoDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

export const uploadLogo = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
}).single("logo");

// ================= CREATE BRAND =================
export const createBrand = async (req, res) => {
  try {
    const {
      brandName,
      website,
      instagramPage,
      category,
      city,
      gstNumber,
      description,
    } = req.body;

    const logoPath = req.file ? req.file.path : null;

    const brand = await Brand.create({
      brandName,
      logo: logoPath,
      website,
      instagramPage,
      category,
      city,
      gstNumber,
      description,
    });

    res.status(201).json({
      success: true,
      data: brand,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// ================= GET ALL BRANDS =================
export const getAllBrands = async (req, res) => {
  try {
    const brands = await Brand.findAll({
      order: [["id", "DESC"]],
    });

    res.status(200).json({
      success: true,
      data: brands,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// ================= GET SINGLE BRAND =================
export const getBrandById = async (req, res) => {
  try {
    const brand = await Brand.findByPk(req.params.id);

    if (!brand) {
      return res.status(404).json({
        success: false,
        message: "Brand not found",
      });
    }

    res.status(200).json({
      success: true,
      data: brand,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// ================= UPDATE BRAND =================
export const updateBrand = async (req, res) => {
  try {
    const brand = await Brand.findByPk(req.params.id);

    if (!brand) {
      return res.status(404).json({
        success: false,
        message: "Brand not found",
      });
    }

    const {
      brandName,
      website,
      instagramPage,
      category,
      city,
      gstNumber,
      description,
    } = req.body;

    // If new logo uploaded, delete old one
    if (req.file && brand.logo) {
      if (fs.existsSync(brand.logo)) {
        fs.unlinkSync(brand.logo);
      }
      brand.logo = req.file.path;
    }

    brand.brandName = brandName ?? brand.brandName;
    brand.website = website ?? brand.website;
    brand.instagramPage = instagramPage ?? brand.instagramPage;
    brand.category = category ?? brand.category;
    brand.city = city ?? brand.city;
    brand.gstNumber = gstNumber ?? brand.gstNumber;
    brand.description = description ?? brand.description;

    await brand.save();

    res.status(200).json({
      success: true,
      message: "Brand updated successfully",
      data: brand,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// ================= DELETE BRAND =================
export const deleteBrand = async (req, res) => {
  try {
    const brand = await Brand.findByPk(req.params.id);

    if (!brand) {
      return res.status(404).json({
        success: false,
        message: "Brand not found",
      });
    }

    // Delete logo file
    if (brand.logo && fs.existsSync(brand.logo)) {
      fs.unlinkSync(brand.logo);
    }

    await brand.destroy();

    res.status(200).json({
      success: true,
      message: "Brand deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
