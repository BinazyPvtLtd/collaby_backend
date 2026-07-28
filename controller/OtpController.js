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
    const { phone, type } = req.body

    // Validate phone number
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

    // Find user
    const { exists, userType } = await findUserByPhone(phone)

    // ===========================
    // SIGNUP FLOW
    // ===========================
    if (type === 'signup') {
      if (exists) {
        return res.status(200).json({
          success: false,
          message: 'User already has an account. Please login.'
        })
      }

      // Send OTP here

      return res.status(200).json({
        success: true,
        message: 'OTP sent successfully.'
      })
    }

    // ===========================
    // LOGIN FLOW
    // ===========================
    if (type === 'login') {
      if (!exists) {
        return res.status(200).json({
          success: false,
          message: 'User does not exist. Please create an account first.'
        })
      }

      // Send OTP here

      return res.status(200).json({
        success: true,
        message: 'OTP sent successfully.',
        userType
      })
    }
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

    // ✅ Validate
    if (!phone || !firebaseToken) {
      return res.status(400).json({
        success: false,
        message: 'Phone and firebaseToken are required'
      })
    }

    // ====================================================
    // ✅ VERIFY FIREBASE TOKEN
    // ====================================================

    const decodedToken = await admin.auth().verifyIdToken(firebaseToken)

    if (!decodedToken.phone_number) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Firebase token'
      })
    }

    // ====================================================
    // ✅ FORMAT PHONE
    // ====================================================

    let firebasePhone = decodedToken.phone_number

    // remove country code
    firebasePhone = firebasePhone.replace('+91', '')

    if (firebasePhone !== phone) {
      return res.status(401).json({
        success: false,
        message: 'Phone number mismatch'
      })
    }

    // ====================================================
    // ✅ FIND USER
    // ====================================================

    const { user, userType } = await findUserByPhone(phone)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    // ====================================================
    // ✅ CREATE / FIND AUTH USER
    // ====================================================

    let existingUser = await User.findOne({
      where: { phone }
    })

    let dbUser

    if (!existingUser) {
      dbUser = await User.create({
        name: user.fullName || user.businessName || 'User',

        email: user.email || `${phone}@temp.com`,

        phone,

        role: userType === 'business' ? 'brand' : 'influencer',

        status: 'approved'
      })

      console.log('✅ User created:', dbUser.id)
    } else {
      dbUser = existingUser
    }

    // ====================================================
    // ✅ TOKEN PAYLOAD
    // ====================================================

    const payload = {
      userId: dbUser.id,
      uuid: dbUser.uuid,
      phone,
      userType
    }

    // ====================================================
    // ✅ GENERATE TOKENS
    // ====================================================

    const accessToken = generateAccessToken(payload)

    const refreshToken = generateRefreshToken(payload)

    // ====================================================
    // ✅ SAVE TOKENS IN DB
    // ====================================================

    await dbUser.update({
      access_token: accessToken,
      refresh_token: refreshToken
    })

    // ====================================================
    // ✅ SET AUTH COOKIES
    // ====================================================

    setAuthCookies(res, accessToken, refreshToken)

    // ====================================================
    // ✅ RESPONSE
    // ====================================================

    return res.status(200).json({
      success: true,
      message: 'Login successful',

      accessToken,
      refreshToken,

      user: {
        id: dbUser.id,
        uuid: dbUser.uuid,
        phone,
        type: userType
      }
    })
  } catch (error) {
    console.log('VERIFY OTP ERROR:', error)

    return res.status(500).json({
      success: false,
      message: error.message || 'Firebase OTP verification failed'
    })
  }
}

/* =========================================================
   LOGOUT
========================================================= */
export const logout = async (req, res) => {
  try {
    const { userId } = req.user

    // ✅ Find User
    const user = await User.findByPk(userId)

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

    // ✅ Find User (userId is UUID string)
    const user = await User.findByPk(decoded.userId)

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

    const newAccessToken = generateAccessToken({
      userId: user.id,
      uuid: user.uuid,
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
