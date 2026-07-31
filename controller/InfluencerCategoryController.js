import InfluencerCategory from '../models/InfluencerCategory.js'
import ContentCategory from '../models/ContentCategory.js'

// ✅ CREATE Category
export const createCategory = async (req, res) => {
  try {
    const { categoryName } = req.body

    if (!categoryName) {
      return res.status(200).json({
        status: false,
        message: 'Category name is required'
      })
    }

    const exists = await ContentCategory.findOne({
      where: { category_name: categoryName.trim() }
    })

    if (exists) {
      return res.status(200).json({
        status: false,
        message: 'Category already exists'
      })
    }

    const category = await ContentCategory.create({
      category_name: categoryName.trim(),
      status: true
    })

    return res.status(200).json({
      status: true,
      message: 'Category created successfully',
      data: category
    })
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: error.message
    })
  }
}

//create a new function to save influencer categories
export const saveInfluencerCategories = async (req, res) => {
  try {
    const { influencer_id, categoryIds } = req.body

    if (!influencer_id) {
      return res.status(200).json({
        status: false,
        message: 'Influencer id is required'
      })
    }

    if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
      return res.status(200).json({
        status: false,
        message: 'Category ids are required'
      })
    }

    // Delete old mapping
    await InfluencerCategory.destroy({
      where: { influencer_id }
    })

    // Insert new mapping
    const payload = categoryIds.map(category_id => ({
      influencer_id,
      category_id
    }))

    await InfluencerCategory.bulkCreate(payload)

    return res.status(200).json({
      status: true,
      message: 'Categories saved successfully'
    })
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: error.message
    })
  }
}

//get all master categories
export const getAllCategories = async (req, res) => {
  try {
    const categories = await ContentCategory.findAll({
      attributes: ['id', 'category_name'],
      where: {
        status: true
      },
      order: [['category_name', 'ASC']]
    })

    return res.status(200).json({
      status: true,
      message: 'Categories fetched successfully',
      data: categories
    })
  } catch (err) {
    return res.status(500).json({
      status: false,
      message: err.message
    })
  }
}

//get selected categories of an influencer
export const getInfluencerCategories = async (req, res) => {
  try {
    const { influencer_id } = req.params;

    const data = await InfluencerCategory.findAll({
      where: {
        influencer_id,
      },
      include: [
        {
          model: ContentCategory,
          as: "category",
          attributes: ["id", "category_name"],
        },
      ],
    });

    return res.status(200).json({
      status: true,
      data,
    });
  } catch (err) {
    return res.status(500).json({
      status: false,
      message: err.message,
    });
  }
};

// ✅ GET All Categories for a specific influencer
// export const getInfluencerCategories = async (req, res) => {
//   try {
//     const { influencer_id } = req.params

//     const categories = await InfluencerCategory.findAll({
//       where: { influencer_id },
//       include: [
//         {
//           model: ContentCategory,
//           as: 'category',
//           attributes: ['id', 'category_name']
//         }
//       ]
//     })

//     return res.status(200).json({
//       status: true,
//       data: categories
//     })
//   } catch (error) {
//     return res.status(500).json({
//       status: false,
//       message: error.message
//     })
//   }
// }

// ✅ GET Category by ID
// export const getCategoryById = async (req, res) => {
//   try {
//     const category = await InfluencerCategory.findByPk(req.params.id)

//     if (!category) {
//       return res.status(404).json({
//         status: false,
//         message: 'Category not found'
//       })
//     }

//     res.status(200).json({
//       status: true,
//       data: category
//     })
//   } catch (error) {
//     res.status(500).json({
//       status: false,
//       error: error.message
//     })
//   }
// }

// ✅ UPDATE Category
// export const updateCategory = async (req, res) => {
//   try {
//     const { categories } = req.body

//     if (!categories || !Array.isArray(categories)) {
//       return res.status(200).json({
//         status: false,
//         message: 'Categories array is required'
//       })
//     }

//     const updatedCategories = []

//     for (const item of categories) {
//       const category = await InfluencerCategory.findByPk(item.id)

//       if (category) {
//         await category.update({
//           categoryName: item.categoryName
//         })

//         updatedCategories.push(category)
//       }
//     }

//     return res.status(200).json({
//       status: true,
//       message: 'Categories updated successfully',
//       data: updatedCategories
//     })
//   } catch (error) {
//     return res.status(500).json({
//       status: false,
//       message: error.message
//     })
//   }
// }

// ✅ DELETE Category
// export const deleteCategory = async (req, res) => {
//   try {
//     const { ids } = req.body

//     if (!ids || !Array.isArray(ids)) {
//       return res.status(200).json({
//         status: false,
//         message: 'Ids array is required'
//       })
//     }

//     await InfluencerCategory.destroy({
//       where: {
//         id: ids
//       }
//     })

//     return res.status(200).json({
//       status: true,
//       message: 'Categories deleted successfully'
//     })
//   } catch (error) {
//     return res.status(500).json({
//       status: false,
//       message: error.message
//     })
//   }
// }
