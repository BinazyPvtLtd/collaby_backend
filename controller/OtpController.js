import BusinessRegistration from '../models/Business.js'
import InfluencerUser from '../models/InfluencerUser.js'
import User from '../models/User.js'

import {
  generateAccessToken,
  generateRefreshToken
} from '../HelperFunction/Tokens.js'

import { setAuthCookies } from '../utility/setCookies.js'

import jwt from 'jsonwebtoken'

import admin from '../config/firebaseAdmin.js'
import { findUserByPhoneAndType } from '../HelperFunction/Helper.js'

console.log('User model:', User)

/* =========================================================
   COMMON: FIND USER BY PHONE
========================================================= */
const findUserByPhone = async phone => {
  // Check Business User
  let user = await BusinessRegistration.findOne({
    where: {
      mobileNumber: phone
    }
  })

  if (user) {
    return {
      exists: true,
      user,
      userType: 'business'
    }
  }

  // Check Influencer User
  user = await InfluencerUser.findOne({
    where: {
      mobileNumber: phone
    }
  })

  if (user) {
    return {
      exists: true,
      user,
      userType: 'influencer'
    }
  }

  return {
    exists: false,
    user: null,
    userType: null
  }
}

/* =========================================================
   STEP 1
   CHECK MOBILE NUMBER EXISTS + FIREBASE OTP SEND
========================================================= */
export const sendOtp = async (req, res) => {
  try {
    const { phone, type, userType } = req.body

    if (!phone) {
      return res.status(200).json({
        success: false,
        message: 'Phone number is required'
      })
    }

    const phoneRegex = /^[6-9]\d{9}$/

    if (!phoneRegex.test(phone)) {
      return res.status(200).json({
        success: false,
        message:
          'Invalid Indian phone number (must be 10 digits starting with 6-9)'
      })
    }

    if (!type || !['signup', 'login'].includes(type)) {
      return res.status(200).json({
        success: false,
        message: "Type must be either 'signup' or 'login'"
      })
    }

    // userType required only for login
    if (
      type === 'login' &&
      (!userType || !['business', 'influencer'].includes(userType))
    ) {
      return res.status(200).json({
        success: false,
        message: 'userType must be either business or influencer'
      })
    }

    // ==========================
    // SIGNUP
    // ==========================
    if (type === 'signup') {
      // Check both tables to prevent duplicate registration
      const { exists } = await findUserByPhone(phone)

      if (exists) {
        return res.status(200).json({
          success: false,
          message: 'User already has an account. Please login.'
        })
      }

      // Send OTP

      return res.status(200).json({
        success: true,
        message: 'OTP sent successfully.'
      })
    }

    // ==========================
    // LOGIN
    // ==========================
    const result = await findUserByPhoneAndType(phone, userType)

    if (!result.exists) {
      return res.status(200).json({
        success: false,
        message: `No ${userType} account found with this mobile number.`
      })
    }

    // Send OTP

    return res.status(200).json({
      success: true,
      message: 'OTP sent successfully.',
      userType: result.userType
    })
  } catch (error) {
    console.log('SEND OTP ERROR:', error)

    return res.status(200).json({
      success: false,
      message: error.message || 'Failed to process request'
    })
  }
}
/* =========================================================
   STEP 2
   VERIFY FIREBASE TOKEN + LOGIN
========================================================= */
export const verifyOtp = async (req, res) => {
  try {
    const { phone, firebaseToken } = req.body

    // ===============================
    // Validate Request
    // ===============================
    if (!phone || !firebaseToken) {
      return res.status(200).json({
        success: false,
        message: 'Phone and firebaseToken are required'
      })
    }

    // ===============================
    // Verify Firebase Token
    // ===============================
    const decodedToken = await admin.auth().verifyIdToken(firebaseToken)

    if (!decodedToken.phone_number) {
      return res.status(200).json({
        success: false,
        message: 'Invalid Firebase token'
      })
    }

    // ===============================
    // Match Phone Number
    // ===============================
    const firebasePhone = decodedToken.phone_number.replace('+91', '').trim()

    if (firebasePhone !== phone.trim()) {
      return res.status(200).json({
        success: false,
        message: 'Phone number mismatch'
      })
    }

    // ===============================
    // Find User
    // ===============================
    const { user, userType } = await findUserByPhone(phone)

    if (!user) {
      return res.status(200).json({
        success: false,
        message: 'User not found'
      })
    }

    // ===============================
    // Create/Get Auth User
    // ===============================
    let dbUser = await User.findOne({
      where: { phone }
    })

    if (!dbUser) {
      dbUser = await User.create({
        name: user.fullName || user.businessName || 'User',
        email: user.email || `${phone}@temp.com`,
        phone,
        role: userType === 'business' ? 'brand' : 'influencer',
        status: 'approved'
      })

      console.log('✅ User created:', dbUser.id)
    }

// ===============================
    // Generate JWT Payload
    // ===============================
    // 🔐 IMPORTANT: Use the SAME userId as the registration flow so that
    // protected APIs (which query by req.user.userId) can find the data
    // created during registration. Business → business.id, Influencer → influencer.id
    const payload = {
      userId: userType === 'business' ? user.id : user.id,
      phone,
      userType
    }

    const accessToken = generateAccessToken(payload)
    const refreshToken = generateRefreshToken(payload)

    // ===============================
    // Save Tokens
    // ===============================
    await dbUser.update({
      access_token: accessToken,
      refresh_token: refreshToken
    })

    // ===============================
    // Set Cookies
    // ===============================
    setAuthCookies(res, accessToken, refreshToken)

    // ===============================
    // Success Response
    // ===============================
    return res.status(200).json({
      success: true,
      message: 'OTP verified successfully',

      user: {
        id: dbUser.id,
        phone,
        type: userType,
        accessToken,
        refreshToken
      }
    })
  } catch (error) {
    console.error(error)
    console.error(error.sql)
    console.error(error.parent)

    return res.status(200).json({
      success: false,
      message: error.message
    })
  }
}
/* =========================================================
   LOGOUT
========================================================= */
export const logout = async (req, res) => {
  try {
    const { userId, phone } = req.user

    // ✅ Find User by userId (User table id) — fall back to phone
//    because the token now carries business.id / influencer.id
    let user = await User.findByPk(userId)

    if (!user && phone) {
      user = await User.findOne({ where: { phone } })
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    // ✅ Remove Tokens
    await user.update({
      access_token: null,
      refresh_token: null
    })

    // ✅ Clear Cookies
    res.clearCookie('accessToken')
    res.clearCookie('refreshToken')

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    })
  } catch (error) {
    console.log('LOGOUT ERROR:', error)

    return res.status(500).json({
      success: false,
      message: error.message || 'Logout failed'
    })
  }
}

/* =========================================================
   REFRESH ACCESS TOKEN
========================================================= */
export const refreshAccessToken = async (req, res) => {
  try {
    const token =
      req.body.refreshToken ||
      req.headers['x-refresh-token'] ||
      req.headers['authorization']?.split(' ')[1]

    // ✅ Validate Token
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token is required'
      })
    }

    let decoded

    // ✅ Verify Refresh Token
    try {
      decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET)
    } catch (err) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or expired refresh token'
      })
    }

// ✅ Find User — token now carries business.id / influencer.id,
    //    so fall back to finding by phone when userId is not the User table id
    let user = await User.findByPk(decoded.userId)

    if (!user && decoded.phone) {
      user = await User.findOne({ where: { phone: decoded.phone } })
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    // ✅ Token Match Check
    if (user.refresh_token !== token) {
      return res.status(403).json({
        success: false,
        message: 'Refresh token mismatch'
      })
    }

    // ====================================================
    // ✅ GENERATE NEW ACCESS TOKEN
    // ====================================================
// Preserve the original userId (business.id / influencer.id)
    // protected APIs keep working after refresh.

    const newAccessToken = generateAccessToken({
      userId: decoded.userId,
      phone: decoded.phone,
      userType: decoded.userType
    })

    // ====================================================
    // ✅ UPDATE ACCESS TOKEN
    // ====================================================

    await user.update({
      access_token: newAccessToken
    })

    // ====================================================
    // ✅ UPDATE ACCESS TOKEN COOKIE
    // ====================================================

    res.cookie('accessToken', newAccessToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000
    })

    // ====================================================
    // ✅ RESPONSE
    // ====================================================

    return res.status(200).json({
      success: true,
      message: 'Access token refreshed successfully',

      accessToken: newAccessToken
    })
  } catch (error) {
    console.log('REFRESH TOKEN ERROR:', error)

    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to refresh token'
    })
  }
}
