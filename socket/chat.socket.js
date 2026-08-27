// socket/chat.socket.js

import ChatAuthorizationService from '../services/ChatAuthorizationService.js'

import ChatMessage from '../models/ChatMessage.js'
import ChatRoom from '../models/ChatRoom.js'
import ChatMessageRead from '../models/ChatMessageRead.js'

class ChatSocketService {
  initialize (io) {
    io.on('connection', socket => {
      console.log('🔌 CHAT SOCKET CONNECTED:', socket.id)

      // ======================================================
      // AUTHENTICATION
      // Already handled by chatSocketAuth middleware via JWT
      // socket.user is set on connection
      // ======================================================

      console.log('🔐 CHAT SOCKET AUTHENTICATED:', socket.user)

      socket.emit('chat:authenticated', {
        success: true,
        user: socket.user
      })

      // ======================================================
      // JOIN ROOM
      // ======================================================

      socket.on('chat:join', async data => {
        try {
          if (!socket.user) {
            return socket.emit('chat:error', {
              message: 'Authenticate socket first'
            })
          }

          const { roomId } = data

          if (!roomId) {
            return socket.emit('chat:error', {
              message: 'roomId is required'
            })
          }

          // ------------------------------------------------
          // Authorization
          // ------------------------------------------------

          const access = await ChatAuthorizationService.canAccessRoom({
            roomId,
            userId: socket.user.userId,
            userType: socket.user.userType
          })

          if (!access.allowed) {
            return socket.emit('chat:error', {
              message: access.reason
            })
          }

          const roomName = `chat:${roomId}`

          socket.join(roomName)

          socket.currentRoomId = Number(roomId)

          console.log(`👤 ${socket.id} joined ${roomName}`)

          socket.emit('chat:joined', {
            success: true,
            roomId: Number(roomId)
          })

          socket.to(roomName).emit('chat:user-joined', {
            roomId: Number(roomId),

            user: socket.user
          })
        } catch (error) {
          console.error('chat:join error:', error)

          socket.emit('chat:error', {
            message: 'Unable to join chat'
          })
        }
      })

      // ======================================================
      // LEAVE ROOM
      // ======================================================

      socket.on('chat:leave', async data => {
        try {
          if (!socket.user) {
            return socket.emit('chat:error', {
              message: 'Authenticate socket first'
            })
          }

          const { roomId } = data

          if (!roomId) {
            return
          }

          const roomName = `chat:${roomId}`

          socket.leave(roomName)

          if (socket.currentRoomId === Number(roomId)) {
            socket.currentRoomId = null
          }

          socket.to(roomName).emit('chat:user-left', {
            roomId: Number(roomId),

            user: socket.user
          })
        } catch (error) {
          console.error('chat:leave error:', error)
        }
      })

      // ======================================================
      // SEND MESSAGE
      // ======================================================

      socket.on('chat:send-message', async data => {
        try {
          if (!socket.user) {
            return socket.emit('chat:error', {
              message: 'Authenticate socket first'
            })
          }

          const {
            roomId,
            content,
            messageType = 'text',
            fileUrl,
            fileName,
            fileSize,
            mimeType
          } = data

          if (!roomId) {
            return socket.emit('chat:error', {
              message: 'roomId is required'
            })
          }

          if (!content && !fileUrl) {
            return socket.emit('chat:error', {
              message: 'Message content or file is required'
            })
          }

          // ------------------------------------------------
          // Authorization
          // ------------------------------------------------

          const access = await ChatAuthorizationService.canAccessRoom({
            roomId,
            userId: socket.user.userId,
            userType: socket.user.userType
          })

          if (!access.allowed) {
            return socket.emit('chat:error', {
              message: access.reason
            })
          }

          // ------------------------------------------------
          // Archived chat
          // ------------------------------------------------

          if (access.room.status === 'archived') {
            return res.status(403).json({
              success: false,
              message: 'Chat is archived'
            })
          }

          // ------------------------------------------------
          // Create message
          // ------------------------------------------------

          const message = await ChatMessage.create({
            roomId: Number(roomId),

            senderId: Number(socket.user.userId),

            senderType:
              socket.user.userType === 'business' ? 'brand' : 'creator',

            messageType,

            content: content || null,

            fileUrl: fileUrl || null,

            fileName: fileName || null,

            fileSize: fileSize || null,

            mimeType: mimeType || null
          })

          // ------------------------------------------------
          // Update room
          // ------------------------------------------------

          await ChatRoom.update(
            {
              lastMessageId: message.id,

              lastMessageAt: message.createdAt
            },
            {
              where: {
                id: roomId
              }
            }
          )

          // ------------------------------------------------
          // Broadcast
          // ------------------------------------------------

          io.to(`chat:${roomId}`).emit('chat:message', {
            roomId: Number(roomId),
            message: message.toJSON()
          })
        } catch (error) {
          console.error('chat:send-message error:', error)

          socket.emit('chat:error', {
            message: 'Failed to send message'
          })
        }
      })

      // ======================================================
      // TYPING
      // ======================================================

      socket.on('chat:typing', data => {
        const { roomId } = data

        if (!socket.user || !roomId) {
          return
        }

        socket.to(`chat:${roomId}`).emit('chat:typing', {
          roomId: Number(roomId),

          user: socket.user
        })
      })

      // ======================================================
      // STOP TYPING
      // ======================================================

      socket.on('chat:stop-typing', data => {
        const { roomId } = data

        if (!socket.user || !roomId) {
          return
        }

        socket.to(`chat:${roomId}`).emit('chat:stop-typing', {
          roomId: Number(roomId),

          user: socket.user
        })
      })

      // ======================================================
      // MESSAGE READ
      // ======================================================

      socket.on('chat:read-message', async data => {
        try {
          if (!socket.user) {
            return socket.emit('chat:error', {
              message: 'Authenticate socket first'
            })
          }

          const { roomId, messageId } = data

          // ------------------------------------------------
          // Authorization
          // ------------------------------------------------

          const access = await ChatAuthorizationService.canAccessRoom({
            roomId,
            userId: socket.user.userId,
            userType: socket.user.userType
          })

          if (!access.allowed) {
            return socket.emit('chat:error', {
              message: access.reason
            })
          }

          // ------------------------------------------------
          // Message
          // ------------------------------------------------

          const message = await ChatMessage.findOne({
            where: {
              id: messageId,
              roomId
            }
          })

          if (!message) {
            return socket.emit('chat:error', {
              message: 'Message not found'
            })
          }

          // ------------------------------------------------
          // Own message
          // ------------------------------------------------

          const userSenderType =
            socket.user.userType === 'business' ? 'brand' : 'creator'

          if (
            Number(message.senderId) === Number(socket.user.userId) &&
            message.senderType === userSenderType
          ) {
            return socket.emit('chat:error', {
              message: 'Cannot mark your own message as read'
            })
          }

          // ------------------------------------------------
          // Mark read
          // ------------------------------------------------

          if (!message.readAt) {
            message.readAt = new Date()

            await message.save()
          }

          // ------------------------------------------------
          // Broadcast read receipt
          // ------------------------------------------------

const readRecord = await ChatMessageRead.findOne({
  where: {
    messageId,
    userId: Number(socket.user.userId),
    userType: userSenderType
  }
});
const now = new Date();
if (!readRecord) {
  await ChatMessageRead.create({
    messageId,
    userId: Number(socket.user.userId),
    userType: userSenderType,
    readAt: now
  });
} else if (!readRecord.readAt) {
  await readRecord.update({ readAt: now });
}
io.to(`chat:${roomId}`).emit('chat:message-read', {
            roomId: Number(roomId),

            messageId: Number(messageId),

            readAt: message.readAt,

            readBy: socket.user
          })
        } catch (error) {
          console.error('chat:read-message error:', error)

          socket.emit('chat:error', {
            message: 'Failed to mark message as read'
          })
        }
      })

      // ======================================================
      // DISCONNECT
      // ======================================================

      socket.on('disconnect', reason => {
        if (socket.currentRoomId) {
          const roomName = `chat:${socket.currentRoomId}`
          socket.leave(roomName)
          socket.to(roomName).emit('chat:user-left', {
            roomId: Number(socket.currentRoomId),
            user: socket.user
          })
          socket.currentRoomId = null
        }

        console.log('🔌 CHAT SOCKET DISCONNECTED:', socket.id, reason)
      })
    })
  }
}

export default new ChatSocketService()
