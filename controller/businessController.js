import { convertToString } from '../HelperFunction/Helper.js'
import Influencer from '../models/InfluencerUser.js'
import BusinessRegistration from '../models/Business.js'
import identityService from '../services/identity.service.js'
import { ValidationError } from 'sequelize'
import {
  generateAccessToken,
  generateRefreshToken
} from '../HelperFunction/Tokens.js'

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

// Resolve the universal identity for the newly created business.
    const identity = await identityService.resolve({
      userId: business.id,
      userType: 'business'
    })

    const tokenPayload = {
      identityId: identity.id,
      userId: business.id,
      userType: 'business'
    }

    const accessToken = generateAccessToken(tokenPayload)

    const refreshToken = generateRefreshToken(tokenPayload)

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
    console.error('CREATE BUSINESS ERROR:', error)

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

const publicBusinessAttributes = { exclude: ['refreshToken'] }
const editableBusinessFields = ['businessName', 'mobileNumber', 'city', 'businessType', 'gstNumber']
const positiveInteger = value => /^\d+$/.test(String(value)) && Number.isSafeInteger(Number(value)) && Number(value) > 0
const canAccessBusiness = (req, id) => req.businessAccess.role === 'admin' || Number(req.businessAccess.id) === id

// Admins list all businesses; business accounts see their own record.
export const getAllBusinesses = async (req, res) => {
  try {
    const { page = '1', limit = '20' } = req.query
    if (!positiveInteger(page) || !positiveInteger(limit) || Number(limit) > 100 ||
        !Number.isSafeInteger((Number(page) - 1) * Number(limit))) {
      return res.status(400).json({ success: false, message: 'Invalid pagination: page must be positive and limit must be between 1 and 100' })
    }
    const { rows: businesses, count } = await BusinessRegistration.findAndCountAll({
      where: req.businessAccess.role === 'admin' ? {} : { id: req.businessAccess.id },
      attributes: publicBusinessAttributes,
      order: [['id', 'DESC']],
      limit: Number(limit),
      offset: (Number(page) - 1) * Number(limit)
    })

    return res.status(200).json({
      success: true,
      message: 'Business User data fetched successfully!',
      data: convertToString(businesses.map(b => b.toJSON())),
      pagination: { page: Number(page), limit: Number(limit), total: count, totalPages: Math.ceil(count / Number(limit)) }
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

// ✅ GET Single Business (by INTEGER id)
export const getBusinessById = async (req, res) => {
  try {
    const id = Number(req.params.id)

    if (!positiveInteger(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid business id'
      })
    }

    if (!canAccessBusiness(req, id)) {
      return res.status(403).json({ success: false, message: 'Access denied' })
    }
    const business = await BusinessRegistration.findOne({
      where: { id },
      attributes: publicBusinessAttributes
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

// ✅ UPDATE Business (by INTEGER id)
export const updateBusiness = async (req, res) => {
  try {
    const id = Number(req.params.id)

    if (!positiveInteger(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid business id'
      })
    }

    if (!canAccessBusiness(req, id)) {
      return res.status(403).json({ success: false, message: 'Access denied' })
    }
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body) ||
        !Object.keys(req.body).length || Object.keys(req.body).some(key => !editableBusinessFields.includes(key))) {
      return res.status(400).json({ success: false, message: `Provide only editable fields: ${editableBusinessFields.join(', ')}` })
    }
    const business = await BusinessRegistration.findOne({
      where: { id },
      attributes: publicBusinessAttributes
    })

    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'Business not found'
      })
    }

    await business.update(req.body, { fields: editableBusinessFields })

    return res.status(200).json({
      success: true,
      message: 'Business updated successfully',
      data: convertToString(business.toJSON())
    })
  } catch (error) {
    if (error instanceof ValidationError) {
      return res.status(error.name === 'SequelizeUniqueConstraintError' ? 409 : 400).json({
        success: false,
        message: 'Business validation failed',
        errors: error.errors.map(({ path, message }) => ({ field: path, message }))
      })
    }
    return res.status(500).json({
      success: false,
      message: 'Unable to update business'
    })
  }
}

// ✅ DELETE Business (by phone)
export const deleteBusinessByPhone = async (req, res) => {
  try {
    const { phone } = req.params

    // ✅ Validate
    if (!/^[6-9]\d{9}$/.test(phone || '')) {
      return res.status(400).json({
        success: false,
        message: 'A valid 10-digit Indian mobile number is required'
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
