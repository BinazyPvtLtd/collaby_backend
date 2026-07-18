import BusinessType from "../models/BusinessTypes.js";
import { convertToString } from "../HelperFunction/Helper.js";

// ✅ Get All Business Types
export const getAllBusinessTypes = async (req, res) => {
  try {
    const businessTypes = await BusinessType.findAll({
      attributes: [
        ["id", "id"],
        ["name", "name"],
      ],
      order: [["id", "ASC"]],
    });

    const data = businessTypes.map((item) => item.toJSON());

    res.status(200).json({
      success: true,
      count: String(businessTypes.length),
      data: convertToString(data),
    });
  } catch (error) {
    res.status(500).json({
      success: "false",
      message: "Error fetching business types",
      error: String(error.message),
    });
  }
};
