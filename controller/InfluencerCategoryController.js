import InfluencerCategory from "../models/InfluencerCategory.js";

// ✅ CREATE Category
export const createCategory = async (req, res) => {
  try {
    const { influencer_id, categories } = req.body || {};

    if (!influencer_id) {
      return res.status(200).json({
        status: false,
        message: "Influencer id is required",
      });
    }

    if (!categories || !Array.isArray(categories) || categories.length === 0) {
      return res.status(200).json({
        status: false,
        message: "Categories array is required",
      });
    }

    const categoryData = categories.map((name) => ({
      influencer_id,
      user_id: null, // ✅ explicitly passing null
      categoryName: name,
    }));

    const createdCategories = await InfluencerCategory.bulkCreate(categoryData);

    return res.status(200).json({
      status: true,
      message: "Categories created successfully",
      data: createdCategories,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

// ✅ GET All Categories
export const getAllCategories = async (req, res) => {
  try {
    const categories = await InfluencerCategory.findAll({
      attributes: ["id", "categoryName"],
      order: [["id", "ASC"]],
    });

    const formattedCategories = categories.map((item) => ({
      ...item.dataValues,
      id: String(item.dataValues.id), // convert id to string
    }));

    return res.status(200).json({
      response: {
        status: true,
        message: "Categories data fetched successfully!",
        influCategory: formattedCategories,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

// ✅ GET Category by ID
export const getCategoryById = async (req, res) => {
  try {
    const category = await InfluencerCategory.findByPk(req.params.id);

    if (!category) {
      return res.status(404).json({
        status: false,
        message: "Category not found",
      });
    }

    res.status(200).json({
      status: true,
      data: category,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      error: error.message,
    });
  }
};

// ✅ UPDATE Category
export const updateCategory = async (req, res) => {
  try {
    const { categories } = req.body;

    if (!categories || !Array.isArray(categories)) {
      return res.status(200).json({
        status: false,
        message: "Categories array is required",
      });
    }

    const updatedCategories = [];

    for (const item of categories) {
      const category = await InfluencerCategory.findByPk(item.id);

      if (category) {
        await category.update({
          categoryName: item.categoryName,
        });

        updatedCategories.push(category);
      }
    }

    return res.status(200).json({
      status: true,
      message: "Categories updated successfully",
      data: updatedCategories,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};
// ✅ DELETE Category
export const deleteCategory = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids)) {
      return res.status(200).json({
        status: false,
        message: "Ids array is required",
      });
    }

    await InfluencerCategory.destroy({
      where: {
        id: ids,
      },
    });

    return res.status(200).json({
      status: true,
      message: "Categories deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};
