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
    const user = req.user;

    console.log("📸 Instagram connect request:", {
      userId: user?.userId,
      userType: user?.userType,
    });

    if (!user?.userId || !user?.userType) {
      return res.status(401).json({
        success: false,
        connected: false,
        message: "Unauthorized user",
      });
    }

    if (
      !process.env.INSTAGRAM_APP_ID ||
      !process.env.INSTAGRAM_APP_SECRET ||
      !process.env.INSTAGRAM_REDIRECT_URI
    ) {
      console.error("❌ Instagram OAuth environment variables missing");

      return res.status(500).json({
        success: false,
        message: "Instagram OAuth configuration is missing",
      });
    }

    const state = createState({
      userId: user.userId,
      userType: user.userType,
    });

    const params = new URLSearchParams({
      client_id: process.env.INSTAGRAM_APP_ID,
      redirect_uri: process.env.INSTAGRAM_REDIRECT_URI,
      response_type: "code",
      scope: "instagram_business_basic,instagram_business_manage_insights",
      state,
    });

    const authUrl =
      `https://www.instagram.com/oauth/authorize?${params.toString()}`;

    console.log("✅ Instagram OAuth URL generated");

    return res.status(200).json({
      success: true,
      message: "Instagram authorization URL generated",
      data: {
        authUrl,
      },
    });
  } catch (error) {
    console.error(
      "❌ Instagram connect error:",
      error.response?.data || error.message
    );

    return res.status(500).json({
      success: false,
      message: "Failed to start Instagram connection",
    });
  }
};

/*
|--------------------------------------------------------------------------
| 2. INSTAGRAM CALLBACK
|--------------------------------------------------------------------------
*/

export const instagramCallback = async (req, res) => {
  try {
    const { code, state, error, error_description } = req.query;

    console.log("📸 Instagram callback received");

    // --------------------------------------------------
    // 1. INSTAGRAM DENIED AUTHORIZATION
    // --------------------------------------------------

    if (error) {
      console.error("❌ Instagram authorization error:", {
        error,
        error_description,
      });

      return res.redirect(
        `${process.env.FRONTEND_URL}/instagram/error?message=${encodeURIComponent(
          error_description || "Instagram authorization failed"
        )}`
      );
    }

    // --------------------------------------------------
    // 2. CODE CHECK
    // --------------------------------------------------

    if (!code) {
      console.error("❌ Instagram authorization code missing");

      return res.redirect(
        `${process.env.FRONTEND_URL}/instagram/error?message=${encodeURIComponent(
          "Authorization code missing"
        )}`
      );
    }

    // --------------------------------------------------
    // 3. STATE CHECK
    // --------------------------------------------------

    if (!state) {
      console.error("❌ Instagram state missing");

      return res.redirect(
        `${process.env.FRONTEND_URL}/instagram/error?message=${encodeURIComponent(
          "OAuth state missing"
        )}`
      );
    }

    const stateData = verifyState(state);

    if (!stateData?.userId || !stateData?.userType) {
      console.error("❌ Invalid Instagram OAuth state");

      return res.redirect(
        `${process.env.FRONTEND_URL}/instagram/error?message=${encodeURIComponent(
          "Invalid OAuth state"
        )}`
      );
    }

    const { userId, userType } = stateData;

    console.log("👤 OAuth user:", {
      userId,
      userType,
    });

    // --------------------------------------------------
    // 4. EXCHANGE CODE -> SHORT-LIVED TOKEN
    // --------------------------------------------------

    const tokenForm = new URLSearchParams();

    tokenForm.append(
      "client_id",
      process.env.INSTAGRAM_APP_ID
    );

    tokenForm.append(
      "client_secret",
      process.env.INSTAGRAM_APP_SECRET
    );

    tokenForm.append(
      "grant_type",
      "authorization_code"
    );

    tokenForm.append(
      "redirect_uri",
      process.env.INSTAGRAM_REDIRECT_URI
    );

    tokenForm.append("code", code);

    console.log("🔄 Exchanging authorization code...");

    const tokenResponse = await axios.post(
      "https://api.instagram.com/oauth/access_token",
      tokenForm.toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        timeout: 15000,
      }
    );

    const shortLivedToken = tokenResponse.data?.access_token;
    const returnedInstagramUserId = tokenResponse.data?.user_id;

    if (!shortLivedToken) {
      console.error(
        "❌ Instagram did not return access token:",
        tokenResponse.data
      );

      throw new Error("Instagram access token was not returned");
    }

    console.log("✅ Short-lived Instagram token received");

    console.log("📸 Instagram OAuth user ID:", {
      returnedInstagramUserId,
    });

    // --------------------------------------------------
    // 5. EXCHANGE SHORT TOKEN -> LONG-LIVED TOKEN
    // --------------------------------------------------

    console.log("🔄 Exchanging for long-lived token...");

    const longTokenResponse = await axios.get(
      "https://graph.instagram.com/access_token",
      {
        params: {
          grant_type: "ig_exchange_token",
          client_secret: process.env.INSTAGRAM_APP_SECRET,
          access_token: shortLivedToken,
        },
        timeout: 15000,
      }
    );

    const longLivedToken =
      longTokenResponse.data?.access_token;

    const expiresIn =
      Number(longTokenResponse.data?.expires_in) || 0;

    if (!longLivedToken) {
      console.error(
        "❌ Long-lived token missing:",
        longTokenResponse.data
      );

      throw new Error(
        "Instagram long-lived access token was not returned"
      );
    }

    const tokenExpiresAt = new Date(
      Date.now() + expiresIn * 1000
    );

    console.log("✅ Long-lived Instagram token received");

    console.log("🔐 Token information:", {
      tokenReceived: !!longLivedToken,
      expiresIn,
      tokenExpiresAt,
    });

    // --------------------------------------------------
    // 6. GET INSTAGRAM PROFILE
    // --------------------------------------------------

    console.log("🔄 Fetching Instagram profile...");

    const profileResponse = await axios.get(
      "https://graph.instagram.com/me",
      {
        params: {
          fields:
            "id,username,name,account_type,profile_picture_url,followers_count,follows_count,media_count",
          access_token: longLivedToken,
        },
        timeout: 15000,
      }
    );

    const profile = profileResponse.data;

    if (!profile?.id) {
      throw new Error(
        "Instagram profile could not be retrieved"
      );
    }

    console.log("✅ Instagram profile received:", {
      id: profile.id,
      username: profile.username,
      name: profile.name,
      accountType: profile.account_type,
    });

    const instagramUserId = String(profile.id);

    // --------------------------------------------------
    // 7. CHECK WHETHER INSTAGRAM ACCOUNT IS ALREADY USED
    // --------------------------------------------------

    const existingInstagramAccount =
      await InstagramAccount.findOne({
        where: {
          instagramUserId,
        },
      });

    if (
      existingInstagramAccount &&
      (
        Number(existingInstagramAccount.userId) !== Number(userId) ||
        existingInstagramAccount.userType !== userType
      )
    ) {
      console.error(
        "❌ Instagram account already connected to another user"
      );

      return res.redirect(
        `${process.env.FRONTEND_URL}/instagram/error?message=${encodeURIComponent(
          "This Instagram account is already connected to another user"
        )}`
      );
    }

    // --------------------------------------------------
    // 8. FIND CURRENT USER CONNECTION
    // --------------------------------------------------

    let instagramAccount =
      await InstagramAccount.findOne({
        where: {
          userId: Number(userId),
          userType,
        },
      });

    // --------------------------------------------------
    // 9. DATA TO SAVE
    // --------------------------------------------------

    const instagramData = {
      userId: Number(userId),
      userType,

      instagramUserId,

      username: profile.username || null,
      name: profile.name || null,

      accountType: profile.account_type || null,

      profilePictureUrl:
        profile.profile_picture_url || null,

      followersCount:
        Number(profile.followers_count) || 0,

      followingCount:
        Number(profile.follows_count) || 0,

      mediaCount:
        Number(profile.media_count) || 0,

      // VERY IMPORTANT
      accessToken: longLivedToken,

      tokenExpiresAt,

      isConnected: true,

      lastSyncedAt: new Date(),
    };

    // --------------------------------------------------
    // 10. CREATE / UPDATE DATABASE RECORD
    // --------------------------------------------------

    if (instagramAccount) {
      console.log(
        "🔄 Updating existing Instagram account:",
        instagramAccount.id
      );

      await instagramAccount.update(instagramData);

      // Reload from database
      await instagramAccount.reload();
    } else {
      console.log(
        "➕ Creating new Instagram account"
      );

      instagramAccount =
        await InstagramAccount.create(instagramData);
    }

    // --------------------------------------------------
    // 11. VERIFY TOKEN WAS ACTUALLY SAVED
    // --------------------------------------------------

    if (!instagramAccount.accessToken) {
      console.error(
        "❌ CRITICAL: Instagram account saved WITHOUT access token",
        {
          id: instagramAccount.id,
          userId: instagramAccount.userId,
          instagramUserId:
            instagramAccount.instagramUserId,
        }
      );

      throw new Error(
        "Instagram access token was not saved in database"
      );
    }

    console.log("✅ Instagram account saved successfully:", {
      id: instagramAccount.id,
      userId: instagramAccount.userId,
      userType: instagramAccount.userType,
      instagramUserId:
        instagramAccount.instagramUserId,
      username: instagramAccount.username,
      hasAccessToken:
        !!instagramAccount.accessToken,
      tokenExpiresAt:
        instagramAccount.tokenExpiresAt,
    });

    // --------------------------------------------------
    // 12. SUCCESS
    // --------------------------------------------------

    return res.redirect(
      `${process.env.FRONTEND_URL}/instagram/success`
    );
  } catch (error) {
    console.error(
      "❌ Instagram callback error:",
      error.response?.data || error.message
    );

    const message =
      error.response?.data?.error?.message ||
      error.response?.data?.error_message ||
      error.message ||
      "Instagram connection failed";

    return res.redirect(
      `${process.env.FRONTEND_URL}/instagram/error?message=${encodeURIComponent(
        message
      )}`
    );
  }
};

/*
|--------------------------------------------------------------------------
| 3. GET CONNECTED INSTAGRAM PROFILE
|--------------------------------------------------------------------------
*/

export const getInstagramProfile = async (req, res) => {
  try {
    console.log("📸 GET /instagram/profile");
    console.log("🔐 req.user:", req.user);

    if (!req.user) {
      return res.status(401).json({
        success: false,
        connected: false,
        message: "Unauthorized: user information not found",
      });
    }

    const { userId, userType } = req.user;

    console.log("👤 userId:", userId);
    console.log("👤 userType:", userType);

    if (!userId || !userType) {
      return res.status(401).json({
        success: false,
        connected: false,
        message: "Invalid authentication data",
      });
    }

    // 1. Find connected Instagram account
    const instagramAccount = await InstagramAccount.findOne({
      where: {
        userId: Number(userId),
        userType,
        isConnected: true,
      },
    });

    console.log("📸 DB Instagram account:", instagramAccount?.toJSON());

    if (!instagramAccount) {
      return res.status(404).json({
        success: false,
        connected: false,
        message: "Instagram account not connected",
      });
    }

    // 2. Check access token
    if (!instagramAccount.accessToken) {
      return res.status(401).json({
        success: false,
        connected: false,
        message: "Instagram access token not found",
      });
    }

    // 3. Fetch latest profile from Instagram
    const profileResponse = await axios.get(
      "https://graph.instagram.com/me",
      {
        params: {
          fields:
            "id,username,name,account_type,profile_picture_url,followers_count,follows_count,media_count",
          access_token: instagramAccount.accessToken,
        },
      }
    );

    const profile = profileResponse.data;

    console.log("📸 Fresh Instagram profile:", profile);

    // 4. Update database with latest Instagram data
    await instagramAccount.update({
      instagramUserId: String(profile.id),
      username: profile.username || null,
      name: profile.name || null,
      accountType: profile.account_type || null,
      profilePictureUrl: profile.profile_picture_url || null,
      followersCount: profile.followers_count ?? 0,
      followingCount: profile.follows_count ?? 0,
      mediaCount: profile.media_count ?? 0,
      lastSyncedAt: new Date(),
    });

    // 5. Return fresh data
    return res.status(200).json({
      success: true,
      connected: true,
      data: {
        username: profile.username || null,
        name: profile.name || null,
        accountType: profile.account_type || null,
        profilePictureUrl: profile.profile_picture_url || null,
        followersCount: profile.followers_count ?? 0,
        followingCount: profile.follows_count ?? 0,
        mediaCount: profile.media_count ?? 0,
      },
    });
  } catch (error) {
    console.error("❌ Get Instagram profile error:");
    console.error("Message:", error.message);
    console.error("Instagram Error:", error.response?.data);

    return res.status(500).json({
      success: false,
      connected: false,
      message: "Failed to fetch Instagram profile",
      error:
        process.env.NODE_ENV === "production"
          ? undefined
          : error.response?.data || error.message,
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
