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
    |--------------------------------------------------------------------------
    | User denied permission
    |--------------------------------------------------------------------------
    */

    if (error) {
      console.error(
        '❌ Instagram authorization error:',
        error,
        error_description
      )

      return res.redirect(
        `${process.env.FRONTEND_URL}/instagram/error?message=${encodeURIComponent(
          error_description || 'Instagram authorization failed'
        )}`
      )
    }

    if (!code) {
      return res.redirect(
        `${process.env.FRONTEND_URL}/instagram/error?message=${encodeURIComponent(
          'Authorization code missing'
        )}`
      )
    }

    /*
    |--------------------------------------------------------------------------
    | Verify state
    |--------------------------------------------------------------------------
    */

    const stateData = verifyState(state)

    const { userId, userType } = stateData

    console.log('📸 Instagram callback user:', {
      userId,
      userType
    })

    /*
    |--------------------------------------------------------------------------
    | STEP 1
    | Exchange authorization code for short-lived access token
    |--------------------------------------------------------------------------
    */

    const formData = new URLSearchParams()

    formData.append(
      'client_id',
      process.env.INSTAGRAM_APP_ID
    )

    formData.append(
      'client_secret',
      process.env.INSTAGRAM_APP_SECRET
    )

    formData.append(
      'grant_type',
      'authorization_code'
    )

    formData.append(
      'redirect_uri',
      process.env.INSTAGRAM_REDIRECT_URI
    )

    formData.append(
      'code',
      code
    )

    const tokenResponse = await axios.post(
      'https://api.instagram.com/oauth/access_token',
      formData,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    )

    const {
      access_token: shortLivedToken,
      user_id: returnedInstagramUserId
    } = tokenResponse.data

    console.log('✅ Instagram short-lived token received')

    console.log(
      '📸 Instagram OAuth user ID:',
      returnedInstagramUserId
    )

    /*
    |--------------------------------------------------------------------------
    | STEP 2
    | Exchange short-lived token for long-lived token
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

    const {
      access_token: longLivedToken,
      expires_in
    } = longTokenResponse.data

    console.log('✅ Long-lived Instagram token received')

    /*
    |--------------------------------------------------------------------------
    | Calculate expiry
    |--------------------------------------------------------------------------
    */

    const tokenExpiresAt = new Date(
      Date.now() + expires_in * 1000
    )

    /*
    |--------------------------------------------------------------------------
    | STEP 3
    | Get Instagram profile
    |--------------------------------------------------------------------------
    */


    const profileResponse = await axios.get(
      'https://graph.instagram.com/me',
      {
        params: {
          fields:
            'id,username,name,account_type,profile_picture_url,followers_count,follows_count,media_count',
          access_token: longLivedToken
        }
      }
    )

    const profile = profileResponse.data

    console.log('📸 Instagram profile:', profile)

    /*
    |--------------------------------------------------------------------------
    | Instagram account ID
    |--------------------------------------------------------------------------
    */

    const instagramUserId = profile.id

    console.log('📸 Instagram profile details:', {
      id: profile.id,
      username: profile.username,
      name: profile.name,
      accountType: profile.account_type,
      profilePictureUrl: profile.profile_picture_url,
      followersCount: profile.followers_count,
      followingCount: profile.follows_count,
      mediaCount: profile.media_count
    })
    /*
    |--------------------------------------------------------------------------
    | STEP 4
    | Check if Instagram account already exists
    |--------------------------------------------------------------------------
    */

    const existingInstagramAccount =
      await InstagramAccount.findOne({
        where: {
          instagramUserId: String(instagramUserId)
        }
      })
    /*
    |--------------------------------------------------------------------------
    | Prevent same Instagram account from being connected
    | to another user
    |--------------------------------------------------------------------------
    */
    if (
      existingInstagramAccount &&
      (
        existingInstagramAccount.userId !== Number(userId) ||
        existingInstagramAccount.userType !== userType
      )
    ) {
      return res.redirect(
        `${process.env.FRONTEND_URL}/instagram/error?message=${encodeURIComponent(
          'This Instagram account is already connected to another user'
        )}`
      )
    }

    /*
    |--------------------------------------------------------------------------
    | STEP 5
    | Check current user's Instagram connection
    |--------------------------------------------------------------------------
    */

    const existingUserConnection =
      await InstagramAccount.findOne({
        where: {
          userId: Number(userId),
          userType
        }
      })

    let instagramAccount

    /*
    |--------------------------------------------------------------------------
    | UPDATE
    |--------------------------------------------------------------------------
    */

    if (existingUserConnection) {
      await existingUserConnection.update({
        instagramUserId: String(instagramUserId),

        username: profile.username || null,

        name: profile.name || null,

        accountType: profile.account_type || null,

        profilePictureUrl: profile.profile_picture_url || null,

        followersCount: profile.followers_count || 0,

        followingCount: profile.follows_count || 0,

        mediaCount: profile.media_count || 0,

        accessToken: longLivedToken,

        tokenExpiresAt,

        isConnected: true,

        lastSyncedAt: new Date()
      })
      instagramAccount = existingUserConnection
    }

    /*
    |--------------------------------------------------------------------------
    | CREATE
    |--------------------------------------------------------------------------
    */

    else {
      instagramAccount = await InstagramAccount.create({
        userId: Number(userId),

        userType,

        instagramUserId: String(instagramUserId),

        username: profile.username || null,

        name: profile.name || null,

        accountType: profile.account_type || null,

        profilePictureUrl: profile.profile_picture_url || null,

        followersCount: profile.followers_count || 0,

        followingCount: profile.follows_count || 0,

        mediaCount: profile.media_count || 0,

        accessToken: longLivedToken,

        tokenExpiresAt,

        isConnected: true,

        lastSyncedAt: new Date()
      })


    }

    console.log(
      '✅ Instagram account saved:',
      instagramAccount.id
    )

    /*
    |--------------------------------------------------------------------------
    | Redirect
    |--------------------------------------------------------------------------
    */

    return res.redirect(
      `${process.env.FRONTEND_URL}/instagram/success`
    )
  } catch (error) {
    console.error(
      '❌ Instagram callback error:',
      error.response?.data || error.message
    )

    const message =
      error.response?.data?.error?.message ||
      error.response?.data?.error_message ||
      error.message ||
      'Instagram connection failed'

    return res.redirect(
      `${process.env.FRONTEND_URL}/instagram/error?message=${encodeURIComponent(
        message
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
    console.log("📸 GET /instagram/profile");
    console.log("🔐 req.user:", req.user);

    // 1. Check authentication data
    if (!req.user) {
      return res.status(401).json({
        success: false,
        connected: false,
        message: "Unauthorized: user information not found"
      });
    }

    const { userId, userType } = req.user;

    console.log("👤 userId:", userId);
    console.log("👤 userType:", userType);

    if (!userId || !userType) {
      return res.status(401).json({
        success: false,
        connected: false,
        message: "Invalid authentication data"
      });
    }

    // 2. Find connected Instagram account
    const instagramAccount = await InstagramAccount.findOne({
      where: {
        userId: Number(userId),
        userType: userType,
        isConnected: true
      }
    });

    console.log("📸 Instagram account:", instagramAccount);

    // 3. Instagram not connected
    if (!instagramAccount) {
      return res.status(404).json({
        success: false,
        connected: false,
        message: "Instagram account not connected"
      });
    }

    // 4. Return profile
    return res.status(200).json({
      success: true,
      connected: true,
      data: {
        username: instagramAccount.username || null,
        name: instagramAccount.name || null,
        accountType: instagramAccount.accountType || null,
        profilePictureUrl: instagramAccount.profilePictureUrl || null,
        followersCount: instagramAccount.followersCount ?? 0,
        followingCount: instagramAccount.followingCount ?? 0,
        mediaCount: instagramAccount.mediaCount ?? 0
      }
    });

  } catch (error) {
    console.error("❌ Get Instagram profile error:");
    console.error("Message:", error.message);
    console.error("Name:", error.name);
    console.error("Stack:", error.stack);

    // Sequelize specific error information
    if (error?.parent) {
      console.error("❌ DB Error:", error.parent);
    }

    if (error?.original) {
      console.error("❌ Original DB Error:", error.original);
    }

    return res.status(500).json({
      success: false,
      connected: false,
      message: "Failed to fetch Instagram profile",
      error:
        process.env.NODE_ENV === "production"
          ? undefined
          : error.message
    });
  }
};

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

/*
|--------------------------------------------------------------------------
| Helper: Get connected Instagram account
|--------------------------------------------------------------------------
*/

const getConnectedInstagramAccount = async (req) => {
  const { userId, userType } = req.user

  const instagramAccount = await InstagramAccount.findOne({
    where: {
      userId: Number(userId),
      userType,
      isConnected: true
    }
  })

  return instagramAccount
}

/*
|--------------------------------------------------------------------------
| GET /api/instagram/media
|
| Get Instagram media/posts/reels
|--------------------------------------------------------------------------
*/

export const getInstagramMedia = async (req, res) => {
  try {
    const instagramAccount =
      await getConnectedInstagramAccount(req)

    if (!instagramAccount) {
      return res.status(404).json({
        success: false,
        connected: false,
        message: 'Instagram account not connected'
      })
    }

    const {
      accessToken,
      instagramUserId
    } = instagramAccount

    /*
    |--------------------------------------------------------------------------
    | Pagination
    |--------------------------------------------------------------------------
    */

    const limit = Number(req.query.limit) || 25
    const after = req.query.after

    /*
    |--------------------------------------------------------------------------
    | Instagram Media API
    |--------------------------------------------------------------------------
    */

    const params = {
      fields:
        'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp',
      access_token: accessToken,
      limit
    }

    if (after) {
      params.after = after
    }

    const response = await axios.get(
      `https://graph.instagram.com/${instagramUserId}/media`,
      {
        params
      }
    )

    const media = response.data?.data || []

    /*
    |--------------------------------------------------------------------------
    | Format response for Flutter
    |--------------------------------------------------------------------------
    */

    const formattedMedia = media.map((item) => ({
      id: item.id,
      caption: item.caption || '',
      mediaType: item.media_type || null,
      mediaUrl: item.media_url || null,
      thumbnailUrl: item.thumbnail_url || null,
      permalink: item.permalink || null,
      timestamp: item.timestamp || null
    }))

    /*
    |--------------------------------------------------------------------------
    | Pagination
    |--------------------------------------------------------------------------
    */

    const nextCursor =
      response.data?.paging?.cursors?.after || null

    return res.status(200).json({
      success: true,
      data: formattedMedia,
      paging: {
        nextCursor
      }
    })
  } catch (error) {
    console.error(
      '❌ Instagram media error:',
      error.response?.data || error.message
    )

    const message =
      error.response?.data?.error?.message ||
      error.response?.data?.error_message ||
      error.message ||
      'Failed to fetch Instagram media'

    return res.status(500).json({
      success: false,
      message
    })
  }
}

/*
|--------------------------------------------------------------------------
| GET /api/instagram/insights
|
| Get Instagram account-level insights
|--------------------------------------------------------------------------
*/

export const getInstagramInsights = async (req, res) => {
  try {
    const instagramAccount =
      await getConnectedInstagramAccount(req)

    if (!instagramAccount) {
      return res.status(404).json({
        success: false,
        connected: false,
        message: 'Instagram account not connected'
      })
    }

    const {
      accessToken,
      instagramUserId
    } = instagramAccount

    /*
    |--------------------------------------------------------------------------
    | Account insights
    |--------------------------------------------------------------------------
    */

    const response = await axios.get(
      `https://graph.instagram.com/${instagramUserId}/insights`,
      {
        params: {
          metric:
            'reach,profile_views,accounts_engaged',
          period: 'day',
          access_token: accessToken
        }
      }
    )

    const insights = response.data?.data || []

    /*
    |--------------------------------------------------------------------------
    | Convert Instagram response
    |--------------------------------------------------------------------------
    */

    const getInsightValue = (name) => {
      const insight = insights.find(
        (item) => item.name === name
      )

      if (!insight) {
        return 0
      }

      /*
      Instagram can return values inside:
      values[0].value
      */

      return (
        insight.values?.[0]?.value ??
        insight.value ??
        0
      )
    }

    return res.status(200).json({
      success: true,
      data: {
        reach: getInsightValue('reach'),

        profileViews:
          getInsightValue('profile_views'),

        accountsEngaged:
          getInsightValue('accounts_engaged')
      }
    })
  } catch (error) {
    console.error(
      '❌ Instagram insights error:',
      error.response?.data || error.message
    )

    const message =
      error.response?.data?.error?.message ||
      error.response?.data?.error_message ||
      error.message ||
      'Failed to fetch Instagram insights'

    return res.status(500).json({
      success: false,
      message
    })
  }
}

/*
|--------------------------------------------------------------------------
| GET /api/instagram/media/:mediaId/insights
|
| Get insights for a specific Instagram media
|--------------------------------------------------------------------------
*/

export const getInstagramMediaInsights = async (req, res) => {
  try {
    const { mediaId } = req.params

    if (!mediaId) {
      return res.status(400).json({
        success: false,
        message: 'Media ID is required'
      })
    }

    const instagramAccount =
      await getConnectedInstagramAccount(req)

    if (!instagramAccount) {
      return res.status(404).json({
        success: false,
        connected: false,
        message: 'Instagram account not connected'
      })
    }

    const {
      accessToken
    } = instagramAccount

    /*
    |--------------------------------------------------------------------------
    | Media insights
    |--------------------------------------------------------------------------
    */

    const response = await axios.get(
      `https://graph.instagram.com/${mediaId}/insights`,
      {
        params: {
          metric:
            'views,reach,likes,comments,shares,saved',
          access_token: accessToken
        }
      }
    )

    const insights = response.data?.data || []

    /*
    |--------------------------------------------------------------------------
    | Get individual metric
    |--------------------------------------------------------------------------
    */

    const getInsightValue = (name) => {
      const insight = insights.find(
        (item) => item.name === name
      )

      if (!insight) {
        return 0
      }

      return (
        insight.values?.[0]?.value ??
        insight.value ??
        0
      )
    }

    return res.status(200).json({
      success: true,
      data: {
        views: getInsightValue('views'),

        reach: getInsightValue('reach'),

        likes: getInsightValue('likes'),

        comments: getInsightValue('comments'),

        shares: getInsightValue('shares'),

        saved: getInsightValue('saved')
      }
    })
  } catch (error) {
    console.error(
      '❌ Instagram media insights error:',
      error.response?.data || error.message
    )

    const message =
      error.response?.data?.error?.message ||
      error.response?.data?.error_message ||
      error.message ||
      'Failed to fetch Instagram media insights'

    return res.status(500).json({
      success: false,
      message
    })
  }
}
