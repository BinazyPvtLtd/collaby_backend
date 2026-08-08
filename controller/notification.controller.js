import notificationService from '../services/notification.service.js'
import identityService from '../services/identity.service.js'

/**
 * Helper: get the universal identity for the authenticated user.
 *
 * Prefers req.user.identityId (set at login), but falls back to resolving the
 * identity from the legacy req.user.userId + req.user.userType so that tokens
 * issued before this refactor keep working.
 */
const resolveCurrentIdentity = async req => {
  if (req.user.identityId) {
    return { id: req.user.identityId }
  }

  const identity = await identityService.resolve({
    userId: req.user.userId,
    userType: req.user.userType
  })

  return { id: identity.id }
}

/**
 * Register Device
 */
export const registerDevice = async (req, res) => {
  try {
    console.log('📥 Request body:', req.body)
    console.log('👤 User:', req.user)

    const identity = await resolveCurrentIdentity(req)

    console.log('🔍 Resolved identity:', identity)

    const {
      deviceId,
      deviceName,
      deviceType,
      appVersion,
      osVersion,
      fcmToken
    } = req.body || {}

    console.log('📱 Controller deviceId:', deviceId)
    console.log('🔥 Controller fcmToken:', fcmToken)

    if (!deviceId) {
      return res.status(400).json({
        success: false,
        message: 'deviceId is required'
      })
    }

    if (!fcmToken) {
      return res.status(400).json({
        success: false,
        message: 'fcmToken is required'
      })
    }

    // Make sure we have a numeric database identity
    const identityId = Number(identity.id)

    if (!Number.isInteger(identityId)) {
      console.error('❌ Invalid identity ID:', identity.id)

      return res.status(400).json({
        success: false,
        message: 'Invalid user identity ID'
      })
    }

    const response = await notificationService.registerDevice({
      identityId,
      userId: identityId,
      userType: req.user.userType,
      deviceId,
      deviceName,
      deviceType,
      appVersion,
      osVersion,
      fcmToken
    })

    return res.json({
      success: true,
      message: 'Device registered successfully',
      data: response
    })
  } catch (error) {
    console.error('❌ registerDevice error:', error)

    return res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

/**
 * Logout Device
 */
export const logoutDevice = async (req, res) => {
  try {
    const identity = await resolveCurrentIdentity(req)

    const { deviceId } = req.body

    if (!deviceId || typeof deviceId !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'deviceId is required'
      })
    }

    await notificationService.logoutDevice({
      identityId: identity.id,
      userId: req.user.userId,
      userType: req.user.userType,
      deviceId: deviceId.trim()
    })

    return res.status(200).json({
      success: true,
      message: 'Device logged out successfully'
    })
  } catch (error) {
    console.error('Logout device error:', error)

    return res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

/**
 * Notification History (paginated)
 */
export const getNotifications = async (req, res) => {
  try {
    const identity = await resolveCurrentIdentity(req)

    const page = parseInt(req.query.page, 10) || 1
    const limit = parseInt(req.query.limit, 10) || 20

    const result = await notificationService.getNotificationHistory(
      identity.id,
      { page, limit }
    )

    // Fetch unread count for the same identity.
    const unreadCount = await notificationService.getUnreadCount(identity.id)

    return res.json({
      success: true,
      unreadCount,
      data: result
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

/**
 * Mark Read
 */
export const markRead = async (req, res) => {
  try {
    const identity = await resolveCurrentIdentity(req)

    const { id } = req.params

    const success = await notificationService.markRead(identity.id, id)

    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      })
    }

    return res.json({
      success: true,
      message: 'Marked as read'
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

/**
 * Mark All Read
 */
export const markAllRead = async (req, res) => {
  try {
    const identity = await resolveCurrentIdentity(req)

    const affected = await notificationService.markAllRead(identity.id)

    return res.json({
      success: true,
      message: 'All notifications marked as read',
      updated: affected
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

/**
 * Get Unread Count
 */
export const getUnreadCount = async (req, res) => {
  try {
    const identity = await resolveCurrentIdentity(req)

    const count = await notificationService.getUnreadCount(identity.id)

    return res.json({
      success: true,
      unreadCount: count
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

/**
 * Send Notification (bulk / targeted) — used by admin announcements or
 * internal tooling. Accepts recipients as an array of { userId, userType }.
 */
export const sendNotification = async (req, res) => {
  try {
    const {
      users,
      title,
      body,
      imageUrl,
      type,
      clickAction,
      referenceId,
      data
    } = req.body

    if (!users || !users.length) {
      return res.status(400).json({
        success: false,
        message: 'users[] is required'
      })
    }

    if (!title || !body || !type) {
      return res.status(400).json({
        success: false,
        message: 'title, body and type are required'
      })
    }

    const notification = await notificationService.sendNotification({
      users,
      title,
      body,
      imageUrl,
      type,
      clickAction,
      referenceId,
      createdBy: req.user.userId || null,
      data: data || {}
    })

    return res.status(201).json({
      success: true,
      message: 'Notification sent',
      data: notification
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

/**
 * Cleanup invalid / stale FCM tokens
 */
export const cleanupTokens = async (req, res) => {
  try {
    const result = await notificationService.cleanupInvalidTokens()

    return res.json({
      success: true,
      message: 'Token cleanup completed',
      data: result
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    })
  }
}
