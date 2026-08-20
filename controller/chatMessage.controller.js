// controllers/chatMessage.controller.js

import {
  Op
} from 'sequelize'

import ChatMessage from '../models/ChatMessage.js'
import ChatRoom from '../models/ChatRoom.js'

import ChatAuthorizationService
  from '../services/ChatAuthorizationService.js'


// ============================================================
// GET MESSAGES
// GET /api/chat/:roomId/messages
// ============================================================

export const getMessages = async (
  req,
  res
) => {
  try {
    const { roomId } = req.params
    const user = req.user

    const access =
      await ChatAuthorizationService.canAccessRoom({
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

    const messages =
      await ChatMessage.findAll({
        where: {
          roomId
        },
        order: [
          ['createdAt', 'ASC']
        ]
      })

    return res.status(200).json({
      success: true,
      data: {
        roomId: Number(roomId),
        messages
      }
    })

  } catch (error) {
    console.error(
      'getMessages error:',
      error
    )

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch messages',
      error: error.message
    })
  }
}


// ============================================================
// SEND MESSAGE
// POST /api/chat/:roomId/messages
// ============================================================

export const sendMessage = async (
  req,
  res
) => {
  try {
    const { roomId } = req.params

    const {
      content,
      messageType = 'text',
      fileUrl,
      fileName,
      fileSize,
      mimeType
    } = req.body

    const user = req.user

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      })
    }

    if (!content && !fileUrl) {
      return res.status(400).json({
        success: false,
        message:
          'Message content or file is required'
      })
    }

    // --------------------------------------------------------
    // Authorization
    // --------------------------------------------------------

    const access =
      await ChatAuthorizationService.canAccessRoom({
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

    // --------------------------------------------------------
    // Don't allow sending to archived room
    // --------------------------------------------------------

    if (access.room.status === 'archived') {
      return res.status(400).json({
        success: false,
        message: 'Chat is archived'
      })
    }

    // --------------------------------------------------------
    // Create message
    // --------------------------------------------------------

    const message =
      await ChatMessage.create({
        roomId: Number(roomId),

        senderId:
          Number(user.userId),

        senderType:
          user.userType === 'business'
            ? 'brand'
            : 'creator',

        messageType,

        content:
          content || null,

        fileUrl:
          fileUrl || null,

        fileName:
          fileName || null,

        fileSize:
          fileSize || null,

        mimeType:
          mimeType || null
      })

    // --------------------------------------------------------
    // Update room
    // --------------------------------------------------------

    await ChatRoom.update(
      {
        lastMessageId: message.id,
        lastMessageAt:
          message.createdAt
      },
      {
        where: {
          id: roomId
        }
      }
    )

    // --------------------------------------------------------
    // Socket event
    // --------------------------------------------------------

    const io = req.app.get('io')

    if (io) {
      io.to(`chat:${roomId}`).emit(
        'chat:message',
        {
          message: message.toJSON()
        }
      )
    }

    return res.status(201).json({
      success: true,
      message:
        'Message sent successfully',
      data: {
        message
      }
    })

  } catch (error) {
    console.error(
      'sendMessage error:',
      error
    )

    return res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: error.message
    })
  }
}


// ============================================================
// MARK MESSAGE AS READ
// PATCH /api/chat/:roomId/messages/:messageId/read
// ============================================================

export const markMessageAsRead = async (
  req,
  res
) => {
  try {
    const {
      roomId,
      messageId
    } = req.params

    const user = req.user

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      })
    }

    // --------------------------------------------------------
    // Authorization
    // --------------------------------------------------------

    const access =
      await ChatAuthorizationService.canAccessRoom({
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

    // --------------------------------------------------------
    // Find message
    // --------------------------------------------------------

    const message =
      await ChatMessage.findOne({
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

    // --------------------------------------------------------
    // Don't mark own message
    // --------------------------------------------------------

    const userSenderType =
      user.userType === 'business'
        ? 'brand'
        : 'creator'

    if (
      Number(message.senderId) ===
        Number(user.userId) &&
      message.senderType ===
        userSenderType
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Cannot mark your own message as read'
      })
    }

    // --------------------------------------------------------
    // Already read
    // --------------------------------------------------------

    if (message.readAt) {
      return res.status(200).json({
        success: true,
        message:
          'Message already marked as read',
        data: {
          message
        }
      })
    }

    // --------------------------------------------------------
    // Mark read
    // --------------------------------------------------------

    message.readAt = new Date()

    await message.save()

    // --------------------------------------------------------
    // Socket event
    // --------------------------------------------------------

    const io = req.app.get('io')

    if (io) {
      io.to(`chat:${roomId}`).emit(
        'chat:message-read',
        {
          roomId: Number(roomId),
          messageId: Number(messageId),
          readAt: message.readAt,
          readBy: {
            userId:
              Number(user.userId),
            userType:
              user.userType
          }
        }
      )
    }

    return res.status(200).json({
      success: true,
      message:
        'Message marked as read',
      data: {
        message
      }
    })

  } catch (error) {
    console.error(
      'markMessageAsRead error:',
      error
    )

    return res.status(500).json({
      success: false,
      message:
        'Failed to mark message as read',
      error: error.message
    })
  }
}