import Product from "../models/Product.js";
import fs from "fs";
const BASE_URL = "http://localhost:5000/";

// ================= CREATE =================
export const createProduct = async (req, res) => {
  try {
    console.log("BODY:", req.body);
    console.log("FILE:", req.file);
    console.log("USER:", req.user);

    const { productName, productDescription, productQuantity } = req.body;

    const image = req.file
      ? req.file.path.replace(/\\/g, "/") // ✅ normalize path
      : null;

    const product = await Product.create({
      user_id: req.user.userId,
      productName,
      productDescription,
      productQuantity,
      productImage: image,
    });

    const data = product.toJSON();

    if (data.productImage) {
      data.productImage = BASE_URL + data.productImage;
    }

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data,
    });
  } catch (error) {
    console.log("FULL ERROR:", error);

    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({
        success: false,
        message: error.errors.map((e) => e.message), // ✅ REAL ERROR HERE
      });
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// ================= READ ALL =================
export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.findAll({
      where: { user_id: req.user.userId },
    });

    const formattedProducts = products.map((product) => {
      const data = product.toJSON();
      if (data.productImage) {
        data.productImage = BASE_URL + data.productImage.replace(/\\/g, "/");
      }
      return data;
    });

    res.status(200).json({
      success: true,
      data: formattedProducts,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================= READ ONE =================
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findOne({
      where: {
        id: req.params.id,
        user_id: req.user.userId, // ✅ FIX
      },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Not found",
      });
    }

    const data = product.toJSON();

    if (data.productImage) {
      data.productImage = BASE_URL + data.productImage;
    }

    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// ================= UPDATE =================
export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findOne({
      where: {
        id: req.params.id,
        user_id: req.user.userId, // ✅ ownership check
      },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found or unauthorized",
      });
    }

    // Delete old image if new uploaded
    if (req.file && product.productImage) {
      if (fs.existsSync(product.productImage)) {
        fs.unlinkSync(product.productImage);
      }
    }

    await product.update({
      productName: req.body.productName ?? product.productName,
      productDescription:
        req.body.productDescription ?? product.productDescription,
      productQuantity: req.body.productQuantity ?? product.productQuantity,
      productImage: req.file ? req.file.path : product.productImage,
    });

    const data = product.toJSON();

    if (data.productImage) {
      data.productImage = BASE_URL + data.productImage.replace(/\\/g, "/");
    }

    res.status(200).json({
      success: true,
      message: "Updated successfully",
      data,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================= DELETE =================
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findOne({
      where: {
        id: req.params.id,
        user_id: req.user.userId, // ✅ ownership check
      },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found or unauthorized",
      });
    }

    // delete image safely
    if (product.productImage) {
      if (fs.existsSync(product.productImage)) {
        fs.unlinkSync(product.productImage);
      }
    }

    await product.destroy();

    res.status(200).json({
      success: true,
      message: "Deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
