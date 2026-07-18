import influencersUser from "../models/InfluencerUser.js";
import BusinessRegistration from "../models/Business.js";

// ✅ CREATE Influencer
export const createInfluencer = async (req, res) => {
  try {
    const { fullName, mobileNumber, email, dob, city, gender } = req.body;

    if (!mobileNumber) {
      return res.status(200).json({
        response: {
          status: false,
          message: "Mobile number is required",
        },
      });
    }

    const business = await BusinessRegistration.findOne({
      where: { mobileNumber },
    });

    if (business) {
      return res.status(200).json({
        response: {
          status: false,
          message: "Number is already registered with business",
          businessId: business.id,
        },
      });
    }

    const influencerExists = await influencersUser.findOne({
      where: { mobileNumber },
    });

    if (influencerExists) {
      return res.status(200).json({
        response: {
          status: false,
          message: "Number is already registered with influencer user",
          influencerId: influencerExists.id,
        },
      });
    }

    // ✅ FIX STARTS HERE

    if (!gender) {
      return res.status(200).json({
        response: {
          status: false,
          message: "Gender is required",
        },
      });
    }

    // Normalize gender (male → Male)
    const formattedGender =
      gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase();

    // Validate gender
    const validGenders = ["Male", "Female", "Other"];

    if (!validGenders.includes(formattedGender)) {
      return res.status(200).json({
        response: {
          status: false,
          message: "Invalid gender value",
        },
      });
    }

    // ✅ FIX ENDS HERE

    const influencer = await influencersUser.create({
      fullName,
      mobileNumber,
      email,
      dob: dob ? new Date(dob) : null,
      city,
      gender: formattedGender, // 🔥 IMPORTANT CHANGE
    });

    return res.status(201).json({
      response: {
        status: true,
        message: "Influencer created successfully",
        ...influencer.toJSON(),
      },
    });
  } catch (error) {
    console.log("ERROR >>>", error);

    return res.status(500).json({
      response: {
        status: false,
        message: error.errors
          ? error.errors.map((e) => e.message)
          : error.message,
      },
    });
  }
};

// ✅ GET All Influencers
export const getAllInfluencers = async (req, res) => {
  try {
    const influencers = await influencersUser.findAll(); // 🔥 FIXED

    res.status(200).json({
      success: true,
      data: influencers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// ✅ GET Influencer by ID
export const getInfluencerById = async (req, res) => {
  try {
    const influencer = await influencersUser.findByPk(req.params.id);

    if (!influencer) {
      return res.status(404).json({
        success: false,
        message: "Influencer not found",
      });
    }
    res.status(200).json({
      success: true,
      data: influencer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// ✅ UPDATE Influencer
export const updateInfluencer = async (req, res) => {
  try {
    const influencer = await influencersUser.findByPk(req.params.id);

    if (!influencer) {
      return res.status(404).json({
        success: false,
        message: "Influencer not found",
      });
    }

    await influencer.update(req.body);

    res.status(200).json({
      success: true,
      data: influencer,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

// ✅ DELETE Influencer
export const deleteInfluencerByPhone = async (req, res) => {
  try {
    const { phone } = req.params;

    // ✅ Validate
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
    }

    // ✅ Find influencer
    const influencer = await influencersUser.findOne({
      where: {
        mobileNumber: phone,
      },
    });

    // ✅ Not found
    if (!influencer) {
      return res.status(404).json({
        success: false,
        message: "Influencer not found",
      });
    }

    // ✅ Delete
    await influencer.destroy();

    return res.status(200).json({
      success: true,
      message: "Influencer deleted successfully",
    });
  } catch (error) {
    console.log("DELETE INFLUENCER ERROR --->", error);

    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
