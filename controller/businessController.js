import { convertToString } from '../HelperFunction/Helper.js'
import Influencer from '../models/InfluencerUser.js'
import BusinessRegistration from '../models/Business.js'
import { v4 as uuidv4 } from 'uuid'
import { ValidationError } from 'sequelize'
import jwt from 'jsonwebtoken'

export const createBusiness = async (req, res) => {
  try {
    const { mobileNumber } = req.body

    // Check if mobile already exists in Business table
    const existingBusiness = await BusinessRegistration.findOne({
      where: { mobileNumber }
    })

    if (existingBusiness) {
      return res.status(200).json({
        success: false,
        message: 'Mobile number is already registered as a business.'
      })
    }

    // Check if mobile already exists in Influencer table
    const existingInfluencer = await Influencer.findOne({
      where: { mobileNumber }
    })

    if (existingInfluencer) {
      return res.status(200).json({
        success: false,
        message: 'Mobile number is already registered as an influencer.'
      })
    }

    const payload = {
      ...req.body,
      gstNumber: req.body.gstNumber || null
    }

    const business = await BusinessRegistration.create(payload)

    // Generate Tokens
    const accessToken = jwt.sign(
      {
        id: business.id,
        userType: 'business'
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '1d'
      }
    )

    const refreshToken = jwt.sign(
      {
        id: business.id,
        userType: 'business'
      },
      process.env.JWT_REFRESH_SECRET,
      {
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d'
      }
    )

    console.log('Business created successfully:', business.toJSON())

    const businessData = business.toJSON()

    delete businessData.refreshToken
    delete businessData.deletedAt
    delete businessData.business_user_id

    return res.status(200).json({
      success: true,
      message: 'Business registered successfully',
      data: {
        ...convertToString(businessData),
        accessToken,
        refreshToken
      }
    })
  } catch (error) {
    // Validation Error
    if (error instanceof ValidationError) {
      const errors = {}

      error.errors.forEach(err => {
        errors[err.path] = err.message
      })

      return res.status(200).json({
        success: false,
        message: 'Validation failed',
        errors
      })
    }

    // Duplicate Error
    if (error.name === 'SequelizeUniqueConstraintError') {
      const errors = {}

      error.errors.forEach(err => {
        errors[err.path] = `${err.path} already exists`
      })

      return res.status(200).json({
        success: false,
        message: 'Duplicate data error',
        errors
      })
    }

    console.error(error)

    return res.status(500).json({
      success: false,
      message: 'Something went wrong'
    })
  }
}

// ✅ GET ALL Businesses (Only Logged-in User)
export const getAllBusinesses = async (req, res) => {
  try {
    console.log('Logged-in User UUID:', req.user.uuid) // Debugging line

    const businesses = await BusinessRegistration.findAll({
      // where: { business_user_id: req.user.userId },
      where: { business_user_id: req.user.uuid }
    })

    return res.status(200).json({
      success: true,
      message: 'Business User data fetched successfully!',
      data: convertToString(businesses.map(b => b.toJSON()))
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

// ✅ GET Single Business (by UUID)
export const getBusinessByUUID = async (req, res) => {
  try {
    const { uuid } = req.params

    const business = await BusinessRegistration.findOne({
      where: {
        uuid,
        // business_user_id: req.user.userId,
        business_user_id: req.user.uuid
      }
    })

    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'Business not found'
      })
    }

    return res.status(200).json({
      success: true,
      data: convertToString(business.toJSON())
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

// ✅ UPDATE Business (by UUID)
export const updateBusiness = async (req, res) => {
  try {
    const { uuid } = req.params

    const business = await BusinessRegistration.findOne({
      where: {
        uuid,
        // business_user_id: req.user.userId,
        business_user_id: req.user.uuid
      }
    })

    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'Business not found'
      })
    }

    await business.update(req.body)

    return res.status(200).json({
      success: true,
      message: 'Business updated successfully',
      data: convertToString(business.toJSON())
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    })
  }
}

// ✅ DELETE Business (by UUID)
export const deleteBusinessByPhone = async (req, res) => {
  try {
    const { phone } = req.params

    // ✅ Validate
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      })
    }

    // ✅ Find business
    const business = await BusinessRegistration.findOne({
      where: {
        mobileNumber: phone
      }
    })

    // ✅ Not found
    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'Business not found'
      })
    }

    // ✅ Delete
    await business.destroy()

    return res.status(200).json({
      success: true,
      message: 'Business deleted successfully'
    })
  } catch (error) {
    console.log('DELETE BUSINESS ERROR --->', error)

    return res.status(500).json({
      success: false,
      error: error.message
    })
  }
}
