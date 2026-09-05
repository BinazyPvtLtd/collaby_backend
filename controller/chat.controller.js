import ChatReport from '../models/ChatReport.js'
import ChatMessage from '../models/ChatMessage.js'
import ChatRoom from '../models/ChatRoom.js'
import ChatAuthorizationService from '../services/ChatAuthorizationService.js'
import { Op, fn, col, literal } from 'sequelize'

export const getMessages = async (req, res) => {
  try {
    const { roomId } = req.params
    const user = req.user

    const access = await ChatAuthorizationService.canAccessRoom({
      roomId,
      userId: user.userId,
      userType: user.userType
    })

    if (!access.allowed) {
      return res.status(403).json({
        success: false,
        message: access.reason
      })
    }

    const messages = await ChatMessage.findAll({
      where: {
        roomId
      },

      order: [['id', 'ASC']]

      // limit: 30
    })

    return res.status(200).json({
      success: true,
      messages
    })
  } catch (error) {
    console.error('getMessages error:', error)

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch messages'
    })
  }
}

export const sendMessage = async (req, res) => {
  try {
    const { roomId } = req.params
    const user = req.user

    const {
      messageType = 'text',
      content,
      fileUrl,
      fileName,
      fileSize,
      mimeType
    } = req.body

    // ============================================================
    // 1. AUTH CHECK
    // ============================================================

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      })
    }

    // ============================================================
    // 2. VALIDATE MESSAGE CONTENT OR FILE
    // ============================================================

    if (!content?.trim() && !fileUrl) {
      return res.status(400).json({
        success: false,
        message: 'Message content or file is required'
      })
    }

    // ============================================================
    // 3. VALIDATE MESSAGE TYPE
    // ============================================================

    const allowedMessageTypes = ['text', 'image', 'pdf', 'video']

    if (!allowedMessageTypes.includes(messageType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid message type'
      })
    }

    // ============================================================
    // 4. VALIDATE CHAT ACCESS
    // ============================================================

    const access = await ChatAuthorizationService.canAccessRoom({
      roomId,
      userId: user.userId,
      userType: user.userType
    })

    if (!access.allowed) {
      return res.status(403).json({
        success: false,
        message: access.reason
      })
    }

    // ============================================================
    // 5. BLOCK MESSAGE IF CHAT IS ARCHIVED
    // ============================================================

    if (access.room.status === 'archived') {
      return res.status(403).json({
        success: false,
        message: 'Chat is archived'
      })
    }

    // ============================================================
    // 6. CREATE MESSAGE
    // ============================================================

    const message = await ChatMessage.create({
      roomId: access.room.id,

      senderId: Number(user.userId),

      senderType: user.userType === 'business' ? 'brand' : 'creator',

      messageType,

      content: content?.trim() || null,

      fileUrl: fileUrl || null,

      fileName: fileName || null,

      fileSize: fileSize || null,

      mimeType: mimeType || null,

      readAt: null
    })

    const roomUpdate = {
      lastMessageId: message.id,
      lastMessageAt: message.createdAt
    }

    // ============================================================
    // UNARCHIVE CHAT FOR RECEIVER WHEN NEW MESSAGE ARRIVES
    // ============================================================

    if (senderType === 'brand') {
      roomUpdate.creatorArchivedAt = null
    }

    if (senderType === 'creator') {
      roomUpdate.brandArchivedAt = null
    }
    // ============================================================
    // 7. UPDATE CHAT ROOM
    // ============================================================

    await access.room.update(roomUpdate)

    // ============================================================
    // 8. SOCKET EVENT
    // ============================================================

    const io = req.app.get('io')

    if (io) {
      io.to(`chat:${roomId}`).emit('chat:message', {
        roomId: Number(roomId),
        message: message.toJSON()
      })

      console.log(`📨 chat:message emitted to chat:${roomId}`)
    } else {
      console.log('❌ Socket.IO instance not found')
    }

    // ============================================================
    // 9. RESPONSE
    // ============================================================

    return res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: {
        message: message.toJSON()
      }
    })
  } catch (error) {
    console.error('sendMessage error:', error)

    return res.status(500).json({
      success: false,
      message: 'Failed to send message'
    })
  }
}


export const markMessageRead = async (req, res) => {
  try {
    const { roomId, messageId } = req.params

    const user = req.user

    // 1. Check room access
    const access = await ChatAuthorizationService.canAccessRoom({
      roomId,
      userId: user.userId,
      userType: user.userType
    })

    if (!access.allowed) {
      return res.status(403).json({
        success: false,
        message: access.reason
      })
    }

    // 2. Find message
    const message = await ChatMessage.findOne({
      where: {
        id: messageId,
        roomId
      }
    })

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      })
    }

    // 3. Don't mark your own message as read
    if (Number(message.senderId) === Number(user.userId)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot mark your own message as read'
      })
    }

    // 4. Already read
    if (message.readAt) {
      return res.status(200).json({
        success: true,
        message: 'Message already marked as read',
        data: {
          message
        }
      })
    }

    // 5. Mark message as read
    const readAt = new Date()

    message.readAt = readAt

    await message.save()

    // 6. Get Socket.IO instance
    const io = req.app.get('io')

    // 7. Emit message-read event
    if (io) {
      io.to(`chat:${roomId}`).emit(
        'chat:message-read',
        {
          roomId: Number(roomId),
          messageId: Number(messageId),
          readBy: Number(user.userId),
          readByType:
            user.userType === 'business'
              ? 'brand'
              : 'creator',
          readAt
        }
      )
    }

    // 8. API response
    return res.status(200).json({
      success: true,
      message: 'Message marked as read',
      data: {
        message
      }
    })
  } catch (error) {
    console.error('markMessageRead error:', error)

    return res.status(500).json({
      success: false,
      message: 'Failed to mark message as read'
    })
  }
}


export const markAllMessagesRead = async (req, res) => {
  try {
    const { roomId } = req.params

    const user = req.user

    // 1. Check room access
    const access = await ChatAuthorizationService.canAccessRoom({
      roomId,
      userId: user.userId,
      userType: user.userType
    })

    if (!access.allowed) {
      return res.status(403).json({
        success: false,
        message: access.reason
      })
    }

    // 2. Convert user type
    const senderType =
      user.userType === 'business'
        ? 'brand'
        : 'creator'

    // 3. Use ONE timestamp for all messages
    const readAt = new Date()

    // 4. Mark all unread messages as read
    const [updatedCount] = await ChatMessage.update(
      {
        readAt
      },
      {
        where: {
          roomId,
          readAt: null,

          // Don't mark current user's own messages
          [Op.not]: {
            senderId: Number(user.userId),
            senderType
          }
        }
      }
    )

    // 5. Get Socket.IO instance
    const io = req.app.get('io')

    // 6. Emit only if messages were actually updated
    if (updatedCount > 0 && io) {
      io.to(`chat:${roomId}`).emit(
        'chat:messages-read',
        {
          roomId: Number(roomId),
          readBy: Number(user.userId),
          readByType: senderType,
          readAt,
          updatedCount
        }
      )
    }

    // 7. API response
    return res.status(200).json({
      success: true,
      message: 'All messages marked as read',
      data: {
        updatedCount
      }
    })
  } catch (error) {
    console.error('markAllMessagesRead error:', error)

    return res.status(500).json({
      success: false,
      message: 'Failed to mark messages as read'
    })
  }
}

// ============================================================
// GET ALL CHATS
// GET /api/chat
// ============================================================

export const getChats = async (req, res) => {
  try {
    const user = req.user

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      })
    }

    const userId = Number(user.userId)
    const userType = user.userType

    if (!Number.isInteger(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      })
    }

    // ============================================================
    // UNREAD MESSAGE SENDER TYPE
    // business   -> count creator messages
    // influencer -> count brand messages
    // ============================================================

    const unreadSenderType =
      userType === 'business'
        ? 'creator'
        : 'brand'

    // ============================================================
    // FIND ROOMS BELONGING TO CURRENT PARTICIPANT
    // ============================================================

    const where =
      userType === 'business'
        ? {
          brandId: userId,
          brandArchivedAt: {
            [Op.is]: null
          }
        }
        : userType === 'influencer'
          ? {
            creatorId: userId,
            creatorArchivedAt: {
              [Op.is]: null
            }
          }
          : null

    if (!where) {
      return res.status(403).json({
        success: false,
        message: 'Invalid user type'
      })
    }

    const rooms = await ChatRoom.findAll({
      where,

      order: [
        ['lastMessageAt', 'DESC'],
        ['updatedAt', 'DESC']
      ]
    })

    // ============================================================
    // BUILD CHAT RESPONSE
    // ============================================================

    const chats = await Promise.all(
      rooms.map(async room => {
        const latestMessage = await ChatMessage.findOne({
          where: {
            roomId: room.id
          },

          order: [
            ['createdAt', 'DESC']
          ]
        })

        // ========================================================
        // TEMPORARY UNREAD DEBUG LOGS
        // ========================================================
        console.log('USER TYPE:', userType)
        console.log('UNREAD SENDER TYPE:', unreadSenderType)
        console.log('ROOM ID:', room.id)

        const unreadCount = await ChatMessage.count({
          where: {
            roomId: room.id,
            senderType: unreadSenderType,
            readAt: null,
            deletedAt: null
          }
        })

        console.log('UNREAD COUNT:', unreadCount)
        return {
          id: room.id,
          campaignId: room.campaignId,
          brandId: room.brandId,
          creatorId: room.creatorId,
          roomKey: room.roomKey,
          status: room.status,

          lastMessageAt: room.lastMessageAt,

          unreadCount,

          lastMessage: latestMessage
            ? latestMessage.toJSON()
            : null,

          createdAt: room.createdAt,
          updatedAt: room.updatedAt
        }
      })
    )

    return res.status(200).json({
      success: true,
      data: {
        chats
      }
    })

  } catch (error) {
    console.error('getChats error:', error)

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch chats',
      error: error.message
    })
  }
}

// ============================================================
// GET UNREAD COUNT
// GET /api/chat/:roomId/unread-count
// ============================================================

export const getUnreadCount = async (req, res) => {
  try {
    const { roomId } = req.params
    const user = req.user

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      })
    }

    // ============================================================
    // CHECK CHAT ACCESS
    // ============================================================

    const access = await ChatAuthorizationService.canAccessRoom({
      roomId,
      userId: user.userId,
      userType: user.userType
    })

    if (!access.allowed) {
      return res.status(403).json({
        success: false,
        message: access.reason
      })
    }

    const userId = Number(user.userId)

    if (!Number.isInteger(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      })
    }

    // ============================================================
    // NORMALIZE USER TYPE TO MESSAGE SENDER TYPE
    // ============================================================

    const senderType =
      user.userType === 'business'
        ? 'brand'
        : user.userType === 'influencer'
          ? 'creator'
          : null

    if (!senderType) {
      return res.status(403).json({
        success: false,
        message: 'Invalid user type'
      })
    }

    // ============================================================
    // COUNT ONLY OTHER PARTICIPANT'S UNREAD MESSAGES
    // ============================================================

    const unreadCount = await ChatMessage.count({
      where: {
        roomId,

        readAt: {
          [Op.is]: null
        },

        // Don't count current user's own messages
        [Op.not]: literal(
          `"sender_id" = ${userId} AND "sender_type" = '${senderType}'`
        )
      }
    })

    return res.status(200).json({
      success: true,
      data: {
        roomId: Number(roomId),
        unreadCount
      }
    })
  } catch (error) {
    console.error('getUnreadCount error:', error)

    return res.status(500).json({
      success: false,
      message: 'Failed to get unread count',
      error: error.message
    })
  }
}

// ============================================================
// REPORT CHAT
// POST /api/chat/:roomId/report
// ============================================================

export const reportChat = async (req, res) => {
  try {
    const { roomId } = req.params

    const { reason, description } = req.body

    const user = req.user

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      })
    }

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Report reason is required'
      })
    }

    const access = await ChatAuthorizationService.canAccessRoom({
      roomId,
      userId: user.userId,
      userType: user.userType
    })

    if (!access.allowed) {
      return res.status(403).json({
        success: false,
        message: access.reason
      })
    }

    const report = await ChatReport.create({
      roomId: Number(roomId),

      reporterId: Number(user.userId),

      reporterType: user.userType,

      reason,

      description: description || null
    })

    return res.status(201).json({
      success: true,
      message: 'Chat reported successfully',
      data: {
        report
      }
    })
  } catch (error) {
    console.error('reportChat error:', error)

    return res.status(500).json({
      success: false,
      message: 'Failed to report chat',
      error: error.message
    })
  }
}

// ============================================================
// ARCHIVE CHAT
// PATCH /api/chat/:roomId/archive
// ============================================================

export const archiveChat = async (req, res) => {
  try {
    const { roomId } = req.params
    const user = req.user

    // ============================================================
    // 1. AUTH CHECK
    // ============================================================

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      })
    }

    // ============================================================
    // 2. CHECK CHAT ACCESS
    // ============================================================

    const access = await ChatAuthorizationService.canAccessRoom({
      roomId,
      userId: user.userId,
      userType: user.userType
    })

    if (!access.allowed) {
      return res.status(403).json({
        success: false,
        message: access.reason
      })
    }

    const room = access.room

    // ============================================================
    // 3. ARCHIVE ONLY FOR CURRENT USER
    // ============================================================

    if (user.userType === 'business') {
      room.brandArchivedAt = new Date()
    }

    if (user.userType === 'influencer') {
      room.creatorArchivedAt = new Date()
    }

    await room.save()

    // ============================================================
    // 4. RESPONSE
    // ============================================================

    return res.status(200).json({
      success: true,
      message: 'Chat archived successfully',
      data: {
        roomId: room.id,

        archivedFor: user.userType === 'business' ? 'business' : 'influencer'
      }
    })
  } catch (error) {
    console.error('archiveChat error:', error)

    return res.status(500).json({
      success: false,
      message: 'Failed to archive chat'
    })
  }
}
