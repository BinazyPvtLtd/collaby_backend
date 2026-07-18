import BusinessProfile from "../models/BusinessProfile.js";


// CREATE BUSINESS
export const createBusiness = async (req, res) => {
  try {

    const business = await BusinessProfile.create(req.body);

    res.status(201).json({
      success: true,
      message: "Business profile created",
      data: business,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      error: error.message,
    });

  }
};


// GET ALL BUSINESSES
export const getAllBusinesses = async (req, res) => {
  try {

    const businesses = await BusinessProfile.findAll();

    res.status(200).json({
      success: true,
      data: businesses,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      error: error.message,
    });

  }
};


// GET BUSINESS BY ID
export const getBusinessById = async (req, res) => {
  try {

    const business = await BusinessProfile.findByPk(req.params.id);

    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business not found",
      });
    }

    res.status(200).json({
      success: true,
      data: business,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      error: error.message,
    });

  }
};


// UPDATE BUSINESS
export const updateBusiness = async (req, res) => {
  try {

    const business = await BusinessProfile.findByPk(req.params.id);

    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business not found",
      });
    }

    await business.update(req.body);

    res.status(200).json({
      success: true,
      message: "Business updated successfully",
      data: business,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      error: error.message,
    });

  }
};


// DELETE BUSINESS
export const deleteBusiness = async (req, res) => {
  try {

    const business = await BusinessProfile.findByPk(req.params.id);

    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business not found",
      });
    }

    await business.destroy();

    res.status(200).json({
      success: true,
      message: "Business deleted successfully",
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      error: error.message,
    });

  }
};