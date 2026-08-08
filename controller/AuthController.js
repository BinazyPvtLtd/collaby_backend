import BusinessRegistration from '../models/Business.js'
import InfluencerUser from '../models/InfluencerUser.js'
import User from '../models/User.js'
import identityService from '../services/identity.service.js'

import {
  generateAccessToken,
  generateRefreshToken
} from '../HelperFunction/Tokens.js'

import admin from '../config/firebaseAdmin.js'

// =======================================================
// FIND USER
// =======================================================

const findUserByPhone = async phone => {
  let user = await BusinessRegistration.findOne({
    where: { mobileNumber: phone }
  })

  if (user) {
    return {
      user,
      userType: 'business'
    }
  }

  user = await InfluencerUser.findOne({
    where: { mobileNumber: phone }
  })

  if (user) {
    return {
      user,
      userType: 'influencer'
    }
  }

  return {
    user: null,
    userType: null
  }
}

// =======================================================
// STEP 1
// CHECK MOBILE EXISTS
// =======================================================

export const checkMobileExists = async (req, res) => {
  try {
    const { phone } = req.body

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      })
    }

    const { user, userType } = await findUserByPhone(phone)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Mobile number not registered'
      })
    }

    return res.status(200).json({
      success: true,
      message: 'User found',
      userType
    })
  } catch (error) {
    console.log(error)

    return res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

// =======================================================
// STEP 2
// FIREBASE VERIFY + LOGIN
// =======================================================

export const firebaseLogin = async (req, res) => {
  try {
    const { phone, firebaseToken } = req.body

    if (!phone || !firebaseToken) {
      return res.status(400).json({
        success: false,
        message: 'Phone and firebaseToken required'
      })
    }

    // ===================================================
    // VERIFY FIREBASE TOKEN
    // ===================================================

    const decodedToken = await admin.auth().verifyIdToken(firebaseToken)

    if (!decodedToken.phone_number) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Firebase token'
      })
    }

    // ===================================================
    // FORMAT MOBILE
    // ===================================================

    let firebasePhone = decodedToken.phone_number

    // remove country code
    firebasePhone = firebasePhone.replace('+91', '')

    if (firebasePhone !== phone) {
      return res.status(401).json({
        success: false,
        message: 'Phone number mismatch'
      })
    }

    // ===================================================
    // FIND USER
    // ===================================================

    const { user, userType } = await findUserByPhone(phone)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    // ===================================================
    // CREATE / FIND AUTH USER
    // ===================================================

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
    } else {
      dbUser = existingUser
    }

// ===================================================
    // RESOLVE UNIVERSAL IDENTITY
    // ===================================================
    // The notification system (and downstream controllers) rely on the actual
    // business reference (INTEGER id) or influencer reference (INTEGER id). We now:
    //   - set `userId` to the REAL business/influencer INTEGER id (backward compat)
    //   - set `identityId` to the universal UserIdentity.id (notification system)
    const identity = await identityService.resolve({
      userId: userType === 'business' ? user.id : user.id,
      userType
    })

    // ===================================================
    // TOKEN PAYLOAD
    // ===================================================

    const payload = {
      identityId: identity.id,
      userId: userType === 'business' ? user.id : user.id,
      phone,
      userType
    }

    // ===================================================
    // GENERATE TOKENS
    // ===================================================

    const accessToken = generateAccessToken(payload)

    const refreshToken = generateRefreshToken(payload)

    // ===================================================
    // SAVE TOKENS
    // ===================================================

    await dbUser.update({
      access_token: accessToken,
      refresh_token: refreshToken
    })

    // ===================================================
    // RESPONSE
    // ===================================================

    return res.status(200).json({
      success: true,
      message: 'Login successful',

      accessToken,
      refreshToken,

user: {
        id: dbUser.id,
        phone,
        type: userType
      }
    })
  } catch (error) {
    console.log('FIREBASE LOGIN ERROR:', error)

    return res.status(500).json({
      success: false,
      message: error.message || 'Firebase login failed'
    })
  }
}
