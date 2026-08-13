import sequelize from '../config/database.js'

import DeviceToken from '../models/DeviceToken.js'
import Notification from '../models/Notification.js'
import NotificationRecipient from '../models/NotificationRecipient.js'

import identityService from './identity.service.js'
import firebaseService from './firebase.service.js'

/**
 * NotificationService
 *
 * Single unified notification pipeline for ALL actors (Business/Influencer/Admin).
 *
 * Flow:
 *   Controller
 *      → NotificationService.sendNotification()
 *      → Notification (create)
 *      → NotificationRecipient (create, resolved via UserIdentity)
 *      → DeviceToken (lookup by identity)
 *      → Firebase (send)
 *      → Update delivery status
 *
 * Recipients may be passed in any of these shapes and are all resolved to a
 * UserIdentity internally:
 *   { identityId }
 *   { userId: <businessId>, userType: 'business' }
 *   { userId: <influencerId>, userType: 'influencer' }
 *   { userId: <adminId>, userType: 'admin' }
 *
 * All references are INTEGER database IDs. DeviceToken and
 * NotificationRecipient only ever reference UserIdentity.id.
 */
class NotificationService {
  // ==========================================================
  // Register Device
  // ==========================================================

  async registerDevice(data) {
    const {
      identityId: providedIdentityId,
      userId,
      userType,
      deviceId,
      deviceName,
      deviceType,
      appVersion,
      osVersion,
      fcmToken
    } = data

    console.log('📦 registerDevice data:', data)
    console.log('📱 deviceId:', deviceId)
    console.log('🔥 fcmToken:', fcmToken)

    // ==========================================================
    // 1. VALIDATION
    // ==========================================================
    if (!deviceId) {
      throw new Error('deviceId is required')
    }

    if (!fcmToken) {
      throw new Error('fcmToken is required')
    }

    if (!userId) {
      throw new Error('userId is required')
    }

    if (!userType) {
      throw new Error('userType is required')
    }

    // ==========================================================
    // 2. RESOLVE UNIVERSAL IDENTITY
    // ==========================================================
    const identity = await identityService.resolve({
      userId,
      userType
    })

    console.log('🆔 Resolved identity:', {
      identityId: identity.id,
      userType: identity.userType,
      businessId: identity.businessId,
      influencerId: identity.influencerId,
      adminId: identity.adminId
    })

    const resolvedIdentityId = Number(identity.id)

    if (!Number.isInteger(resolvedIdentityId)) {
      throw new Error(`Invalid UserIdentity ID: ${identity.id}`)
    }

    // ==========================================================
    // 3. FIND BY FCM TOKEN FIRST
    //
    // fcm_token is UNIQUE in database.
    // Therefore we MUST check it before creating.
    // ==========================================================
    const existingToken = await DeviceToken.findOne({
      where: {
        fcmToken
      }
    })

    // ==========================================================
    // 4. EXISTING FCM TOKEN
    //
    // Same FCM token can be sent again by Flutter.
    // UPDATE instead of INSERT.
    // ==========================================================
    if (existingToken) {
      console.log(
        `♻️ Existing FCM token found. Updating device ${existingToken.id}`
      )

      await existingToken.update({
        identityId: resolvedIdentityId,
        userId: Number(userId),
        userType,
        deviceId,
        deviceName,
        deviceType,
        appVersion,
        osVersion,
        isActive: true,
        lastUsedAt: new Date()
      })

      return {
        ...existingToken.toJSON(),
        isNew: false
      }
    }

    // ==========================================================
    // 5. NO EXISTING FCM TOKEN
    //
    // Check whether this identity + device already exists.
    // ==========================================================
    const existingDevice = await DeviceToken.findOne({
      where: {
        identityId: resolvedIdentityId,
        deviceId
      }
    })

    if (existingDevice) {
      console.log(
        `♻️ Existing device found. Updating device ${existingDevice.id}`
      )

      await existingDevice.update({
        userId: Number(userId),
        userType,
        deviceName,
        deviceType,
        appVersion,
        osVersion,
        fcmToken,
        isActive: true,
        lastUsedAt: new Date()
      })

      return {
        ...existingDevice.toJSON(),
        isNew: false
      }
    }

    // ==========================================================
    // 6. CREATE NEW DEVICE
    // ==========================================================
    const newDevice = await DeviceToken.create({
      identityId: resolvedIdentityId,
      userId: Number(userId),
      userType,
      deviceId,
      deviceName,
      deviceType,
      appVersion,
      osVersion,
      fcmToken,
      isActive: true,
      lastUsedAt: new Date()
    })

    console.log(`✅ New device registered: ${newDevice.id}`)

    return {
      ...newDevice.toJSON(),
      isNew: true
    }
  }


  // ==========================================================
  // Logout Device
  // ==========================================================
  async logoutDevice ({ userId, userType, deviceId }) {
    const identity = await identityService.resolve({ userId, userType })

    await DeviceToken.update(
      { isActive: false },
      {
        where: {
          identityId: identity.id,
          deviceId
        }
      }
    )
  }

  // ==========================================================
  // Create Notification
  // ==========================================================
  async createNotification (payload, transaction = null) {
    return Notification.create(payload, { transaction })
  }

  // ==========================================================
  // Create Recipients (resolved via universal identity)
  // ==========================================================
  async createRecipients (notificationId, identities, transaction = null) {
    const recipients = identities.map(identity => ({
      notificationId,
      identityId: identity.id,
      userId: identity.influencerId || null,
      userType: identity.userType
    }))

    return NotificationRecipient.bulkCreate(recipients, { transaction })
  }

  // ==========================================================
  // Get Active Tokens for a set of identities
  // ==========================================================
  async getActiveTokens (identities) {
    const identityIds = identities.map(i => i.id)

    if (!identityIds.length) return []

    return DeviceToken.findAll({
      where: {
        identityId: identityIds,
        isActive: true
      }
    })
  }

  // ==========================================================
  // Send Notification (single pipeline for all actors)
  // ==========================================================
  async sendNotification ({
    users,
    title,
    body,
    imageUrl = '',
    type,
    clickAction,
    referenceId,
    priority = 'NORMAL',
    createdBy = null,
    data = {}
  }) {
    const transaction = await sequelize.transaction()

    try {
      // 1) Resolve all recipients to universal identities (within txn).
      const identities = await identityService.resolveMany(users, {
        transaction
      })

      // 2) Create the notification record.
      const notification = await this.createNotification(
        {
          title,
          body,
          imageUrl,
          type,
          priority,
          createdBy,
          clickAction,
          referenceId: referenceId != null ? String(referenceId) : null,
          data,
          status: 'PENDING',
          recipientCount: identities.length
        },
        transaction
      )

      // 3) Create recipient rows.
      await this.createRecipients(notification.id, identities, transaction)

      await transaction.commit()

      // 4) Fetch active tokens for the recipients.
      const devices = await this.getActiveTokens(identities)
      const tokens = devices.map(d => d.fcmToken)

      // 5) Send via Firebase (outside the DB transaction).
      const firebaseResponse = await firebaseService.sendToMultipleDevices({
        tokens,
        title,
        body,
        imageUrl,
        data: {
          ...data,
          clickAction: clickAction || '',
          referenceId: referenceId != null ? String(referenceId) : '',
          type
        }
      })

      // 6) Update overall notification status.
      const overallStatus =
        firebaseResponse.success && tokens.length ? 'SENT' : 'FAILED'

      await Notification.update(
        { status: overallStatus },
        { where: { id: notification.id } }
      )

      // 7) Update per-recipient delivery status.
      //    If there are no tokens, we still mark delivered=false but record a
      //    failure reason so admins can see why nothing was pushed.
      const delivered = tokens.length > 0 && firebaseResponse.success
      const failureReason = delivered
        ? null
        : tokens.length === 0
        ? 'No active device tokens for recipient(s)'
        : firebaseResponse.error?.message || 'Firebase send partially failed'

      await NotificationRecipient.update(
        {
          delivered,
          deliveredAt: delivered ? new Date() : null,
          failureReason
        },
        {
          where: { notificationId: notification.id }
        }
      )

      // 8) Clean up invalid FCM tokens (messaging/registration-token-not-registered).
      if (firebaseResponse.invalidTokens.length) {
        await DeviceToken.destroy({
          where: { fcmToken: firebaseResponse.invalidTokens }
        })
      }

      return notification
    } catch (error) {
      if (transaction && !transaction.finished) {
        await transaction.rollback()
      }

      console.error('NotificationService.sendNotification error:', error)

      throw error
    }
  }

  // ==========================================================
  // Broadcast to all active identities of a given userType
  // (e.g. send a "New Campaign" push to every influencer).
  // ==========================================================
  async broadcast ({
    userType,
    title,
    body,
    imageUrl = '',
    type,
    clickAction,
    referenceId,
    priority = 'NORMAL',
    createdBy = null,
    data = {}
  }) {
    const UserIdentity = (await import('../models/UserIdentity.js')).default

    const identities = await UserIdentity.findAll({ where: { userType } })

    if (!identities.length) return null

    return this.sendNotification({
      users: identities.map(i => ({ identityId: i.id })),
      title,
      body,
      imageUrl,
      type,
      clickAction,
      referenceId,
      priority,
      createdBy,
      data
    })
  }

  // ==========================================================
  // Get Notification History for the authenticated identity
  // ==========================================================
  async getNotificationHistory (identityId, { page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit

    const { rows, count } = await NotificationRecipient.findAndCountAll({
      where: { identityId },
      include: [{ model: Notification, as: 'notification' }],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    })

    return {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
      data: rows
    }
  }

  // ==========================================================
  // Mark Single Notification as Read
  // ==========================================================
  async markRead (identityId, notificationId) {
    const [affected] = await NotificationRecipient.update(
      { isRead: true, readAt: new Date() },
      {
        where: {
          identityId,
          notificationId
        }
      }
    )

    return affected > 0
  }

  // ==========================================================
  // Mark All Notifications as Read
  // ==========================================================
  async markAllRead (identityId) {
    const [affected] = await NotificationRecipient.update(
      { isRead: true, readAt: new Date() },
      {
        where: {
          identityId,
          isRead: false
        }
      }
    )

    return affected
  }

  // ==========================================================
  // Get Unread Count
  // ==========================================================
  async getUnreadCount (identityId) {
    const count = await NotificationRecipient.count({
      where: { identityId, isRead: false }
    })

    return count
  }

  // ==========================================================
  // Cleanup Invalid FCM Tokens (manual + called after sends)
  // ==========================================================
  async cleanupInvalidTokens () {
    // Find tokens that are inactive OR have not been used recently.
    const stale = await DeviceToken.findAll({
      where: { isActive: false }
    })

    const staleTokens = stale.map(t => t.fcmToken)

    if (staleTokens.length) {
      await DeviceToken.destroy({ where: { fcmToken: staleTokens } })
    }

    return { removed: staleTokens.length }
  }
}

export default new NotificationService()
