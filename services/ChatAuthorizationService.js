import ChatRoom from '../models/ChatRoom.js'
import Application from '../models/Application.js'

class ChatAuthorizationService {
  async canAccessRoom ({
    roomId,
    userId,
    userType
  }) {
    console.log('================================')
    console.log('CHAT AUTHORIZATION')
    console.log('roomId:', roomId)
    console.log('userId:', userId)
    console.log('userType:', userType)

    // ============================================================
    // 1. FIND CHAT ROOM
    // ============================================================

    const room = await ChatRoom.findByPk(roomId)

    console.log(
      'CHAT ROOM:',
      room?.toJSON()
    )

    if (!room) {
      return {
        allowed: false,
        reason: 'Chat room not found'
      }
    }

    // ============================================================
    // 2. CHECK ROOM STATUS
    // ============================================================

    if (
      room.status !== 'active' &&
      room.status !== 'archived'
    ) {
      return {
        allowed: false,
        reason: 'Chat is blocked'
      }
    }

    // ============================================================
    // 3. NORMALIZE IDS
    // ============================================================

    const currentUserId = Number(userId)
    const roomBrandId = Number(room.brandId)
    const roomCreatorId = Number(room.creatorId)

    console.log('NORMALIZED IDS:', {
      currentUserId,
      roomBrandId,
      roomCreatorId
    })

    // ============================================================
    // 4. VALIDATE IDS
    // ============================================================

    if (!Number.isInteger(currentUserId)) {
      return {
        allowed: false,
        reason: 'Invalid user ID'
      }
    }

    if (!Number.isInteger(roomBrandId)) {
      return {
        allowed: false,
        reason: 'Invalid room brand ID'
      }
    }

    if (!Number.isInteger(roomCreatorId)) {
      return {
        allowed: false,
        reason: 'Invalid room creator ID'
      }
    }

    // ============================================================
    // 5. CHECK PARTICIPANT
    // ============================================================

    let participantRole = null

    if (userType === 'business') {
      if (currentUserId !== roomBrandId) {
        console.log(
          '❌ BUSINESS IS NOT ROOM BRAND'
        )

        return {
          allowed: false,
          reason: 'Not a participant'
        }
      }

      participantRole = 'business'
    }

    else if (userType === 'influencer') {
      if (currentUserId !== roomCreatorId) {
        console.log(
          '❌ INFLUENCER IS NOT ROOM CREATOR'
        )

        return {
          allowed: false,
          reason: 'Not a participant'
        }
      }

      participantRole = 'influencer'
    }

    else {
      return {
        allowed: false,
        reason: 'Invalid user type'
      }
    }

    console.log(
      '✅ PARTICIPANT VERIFIED:',
      participantRole
    )

    // ============================================================
    // 6. CHECK APPROVED APPLICATION
    // ============================================================

    const application = await Application.findOne({
      where: {
        campaign_id: room.campaignId,
        brand_id: room.brandId,
        influencer_id: room.creatorId,
        status: 'accepted'
      }
    })

    console.log(
      'CHAT APPLICATION:',
      application?.toJSON()
    )

    if (!application) {
      return {
        allowed: false,
        reason:
          'Chat is available only after approval'
      }
    }

    // ============================================================
    // 7. ACCESS GRANTED
    // ============================================================

    console.log(
      '✅ CHAT ACCESS GRANTED'
    )

    return {
      allowed: true,
      participantRole,
      room,
      application
    }
  }
}

export default new ChatAuthorizationService()