import axios from 'axios'
import crypto from 'crypto'

import InstagramAccount from '../models/InstagramAccount.js'

/*
|--------------------------------------------------------------------------
| Helper: Create signed state
|--------------------------------------------------------------------------
*/

const createState = user => {
  const payload = JSON.stringify({
    userId: user.userId,
    userType: user.userType,
    timestamp: Date.now(),
    nonce: crypto.randomBytes(16).toString('hex')
  })

  const data = Buffer.from(payload).toString('base64url')

  const signature = crypto
    .createHmac('sha256', process.env.JWT_SECRET)
    .update(data)
    .digest('hex')

  return `${data}.${signature}`
}

/*
|--------------------------------------------------------------------------
| Helper: Verify state
|--------------------------------------------------------------------------
*/

const verifyState = state => {
  if (!state) {
    throw new Error('Missing OAuth state')
  }

  const [data, signature] = state.split('.')

  if (!data || !signature) {
    throw new Error('Invalid OAuth state')
  }

  const expectedSignature = crypto
    .createHmac('sha256', process.env.JWT_SECRET)
    .update(data)
    .digest('hex')

  const valid = crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )

  if (!valid) {
    throw new Error('Invalid OAuth state signature')
  }

  const payload = JSON.parse(Buffer.from(data, 'base64url').toString())

  /*
  |----------------------------------------
  | State expires after 10 minutes
  |----------------------------------------
  */

  const now = Date.now()
  const tenMinutes = 10 * 60 * 1000

  if (now - payload.timestamp > tenMinutes) {
    throw new Error('OAuth state expired')
  }

  return payload
}

/*
|--------------------------------------------------------------------------
| 1. CONNECT INSTAGRAM
|--------------------------------------------------------------------------
*/

export const connectInstagram = async (req, res) => {
  try {
    const user = req.user

    console.log('📸 Instagram connect request:', {
      userId: user.userId,
      userType: user.userType
    })

    if (!user?.userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized user'
      })
    }

    const state = createState(user)

    const scopes = ['instagram_business_basic']

    const params = new URLSearchParams({
      client_id: process.env.INSTAGRAM_APP_ID,
      redirect_uri: process.env.INSTAGRAM_REDIRECT_URI,
      response_type: 'code',
      scope: scopes.join(','),
      state
    })

    const instagramAuthUrl = `https://www.instagram.com/oauth/authorize?${params.toString()}`

    console.log('📸 Redirecting to Instagram OAuth')

    return res.status(200).json({
      success: true,
      message: 'Instagram authorization URL generated',
      data: {
        authUrl: instagramAuthUrl
      }
    })
  } catch (error) {
    console.error('❌ Instagram connect error:', error.message)

    return res.status(500).json({
      success: false,
      message: 'Failed to start Instagram connection'
    })
  }
}

/*
|--------------------------------------------------------------------------
| 2. INSTAGRAM CALLBACK
|--------------------------------------------------------------------------
*/

export const instagramCallback = async (req, res) => {
  try {
    const { code, state, error, error_description } = req.query

    /*
    |----------------------------------------
    | User denied permission
    |----------------------------------------
    */

    if (error) {
      console.error(
        '❌ Instagram authorization error:',
        error,
        error_description
      )

      return res.redirect(
        `${
          process.env.FRONTEND_URL
        }/instagram/error?message=${encodeURIComponent(
          error_description || 'Instagram authorization failed'
        )}`
      )
    }

    if (!code) {
      return res.redirect(
        `${process.env.FRONTEND_URL}/instagram/error?message=Authorization code missing`
      )
    }

    /*
    |----------------------------------------
    | Verify state
    |----------------------------------------
    */

    const stateData = verifyState(state)

    const { userId, userType } = stateData

    console.log('📸 Instagram callback user:', {
      userId,
      userType
    })

    /*
    |--------------------------------------------------------------------------
    | STEP 1:
    | Exchange authorization code
    | for short-lived access token
    |--------------------------------------------------------------------------
    */

    const formData = new URLSearchParams()

    formData.append('client_id', process.env.INSTAGRAM_APP_ID)

    formData.append('client_secret', process.env.INSTAGRAM_APP_SECRET)

    formData.append('grant_type', 'authorization_code')

    formData.append('redirect_uri', process.env.INSTAGRAM_REDIRECT_URI)

    formData.append('code', code)

    const tokenResponse = await axios.post(
      'https://api.instagram.com/oauth/access_token',
      formData,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    )

    const { access_token: shortLivedToken, user_id: instagramUserId } =
      tokenResponse.data

    console.log('✅ Instagram short-lived token received')

    /*
    |--------------------------------------------------------------------------
    | STEP 2:
    | Exchange short-lived token
    | for long-lived token
    |--------------------------------------------------------------------------
    */

    const longTokenResponse = await axios.get(
      'https://graph.instagram.com/access_token',
      {
        params: {
          grant_type: 'ig_exchange_token',
          client_secret: process.env.INSTAGRAM_APP_SECRET,
          access_token: shortLivedToken
        }
      }
    )

    const { access_token: longLivedToken, expires_in } = longTokenResponse.data

    console.log('✅ Long-lived Instagram token received')

    /*
    |--------------------------------------------------------------------------
    | Calculate expiry
    |--------------------------------------------------------------------------
    */

    const tokenExpiresAt = new Date(Date.now() + expires_in * 1000)

    /*
    |--------------------------------------------------------------------------
    | STEP 3:
    | Get Instagram profile
    |--------------------------------------------------------------------------
    */

    const profileResponse = await axios.get(
      `https://graph.instagram.com/v23.0/${instagramUserId}`,
      {
        params: {
          fields: 'id,username,account_type,media_count',
          access_token: longLivedToken
        }
      }
    )

    const profile = profileResponse.data

    console.log('📸 Instagram profile:', profile)

    /*
    |--------------------------------------------------------------------------
    | STEP 4:
    | Check if this Instagram account
    | is already connected
    |--------------------------------------------------------------------------
    */

    const existingInstagramAccount = await InstagramAccount.findOne({
      where: {
        instagramUserId: String(instagramUserId)
      }
    })

    /*
    |--------------------------------------------------------------------------
    | Prevent one Instagram account
    | from being used by another user
    |--------------------------------------------------------------------------
    */

    if (
      existingInstagramAccount &&
      (existingInstagramAccount.userId !== Number(userId) ||
        existingInstagramAccount.userType !== userType)
    ) {
      return res.redirect(
        `${
          process.env.FRONTEND_URL
        }/instagram/error?message=${encodeURIComponent(
          'This Instagram account is already connected to another user'
        )}`
      )
    }

    /*
    |--------------------------------------------------------------------------
    | STEP 5:
    | Create or update connection
    |--------------------------------------------------------------------------
    */

    const existingUserConnection = await InstagramAccount.findOne({
      where: {
        userId: Number(userId),
        userType
      }
    })

    let instagramAccount

    if (existingUserConnection) {
      await existingUserConnection.update({
        instagramUserId: String(instagramUserId),

        username: profile.username || null,

        accountType: profile.account_type || null,

        mediaCount: profile.media_count || 0,

        accessToken: longLivedToken,

        tokenExpiresAt,

        isConnected: true,

        lastSyncedAt: new Date()
      })

      instagramAccount = existingUserConnection
    } else {
      instagramAccount = await InstagramAccount.create({
        userId: Number(userId),

        userType,

        instagramUserId: String(instagramUserId),

        username: profile.username || null,

        accountType: profile.account_type || null,

        mediaCount: profile.media_count || 0,

        accessToken: longLivedToken,

        tokenExpiresAt,

        isConnected: true,

        lastSyncedAt: new Date()
      })
    }

    console.log('✅ Instagram account saved:', instagramAccount.id)

    /*
    |--------------------------------------------------------------------------
    | Redirect user back to frontend
    |--------------------------------------------------------------------------
    */

    return res.redirect(`${process.env.FRONTEND_URL}/instagram/success`)
  } catch (error) {
    console.error(
      '❌ Instagram callback error:',
      error.response?.data || error.message
    )

    return res.redirect(
      `${process.env.FRONTEND_URL}/instagram/error?message=${encodeURIComponent(
        error.response?.data?.error_message ||
          error.message ||
          'Instagram connection failed'
      )}`
    )
  }
}

/*
|--------------------------------------------------------------------------
| 3. GET CONNECTED INSTAGRAM PROFILE
|--------------------------------------------------------------------------
*/

export const getInstagramProfile = async (req, res) => {
  try {
    const { userId, userType } = req.user

    const instagramAccount = await InstagramAccount.findOne({
      where: {
        userId,
        userType,
        isConnected: true
      },
      attributes: {
        exclude: ['accessToken']
      }
    })

    if (!instagramAccount) {
      return res.status(404).json({
        success: false,
        connected: false,
        message: 'No Instagram account connected'
      })
    }

    return res.status(200).json({
      success: true,
      connected: true,
      data: instagramAccount
    })
  } catch (error) {
    console.error('❌ Get Instagram profile error:', error)

    return res.status(500).json({
      success: false,
      message: 'Failed to get Instagram profile'
    })
  }
}

/*
|--------------------------------------------------------------------------
| 4. DISCONNECT INSTAGRAM
|--------------------------------------------------------------------------
*/

export const disconnectInstagram = async (req, res) => {
  try {
    const { userId, userType } = req.user

    const instagramAccount = await InstagramAccount.findOne({
      where: {
        userId,
        userType,
        isConnected: true
      }
    })

    if (!instagramAccount) {
      return res.status(404).json({
        success: false,
        message: 'No Instagram account connected'
      })
    }

    /*
    |--------------------------------------------------------------------------
    | We mark as disconnected instead of
    | immediately deleting the database record.
    |--------------------------------------------------------------------------
    */

    await instagramAccount.update({
      isConnected: false,
      accessToken: null
    })

    return res.status(200).json({
      success: true,
      message: 'Instagram account disconnected successfully'
    })
  } catch (error) {
    console.error('❌ Disconnect Instagram error:', error)

    return res.status(500).json({
      success: false,
      message: 'Failed to disconnect Instagram'
    })
  }
}
