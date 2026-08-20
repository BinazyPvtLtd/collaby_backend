import express from 'express'

import {
  getChats,
  getMessages,
  sendMessage,
  markMessageRead,
  markAllMessagesRead,
  getUnreadCount,
  reportChat,
  archiveChat
} from '../controller/chat.controller.js'

import { verifyToken } from '../middleware/AuthMiddleware.js'

const router = express.Router()

// Chat list
router.get('/', verifyToken, getChats)

// Messages
router.get('/:roomId/messages', verifyToken, getMessages)

router.post('/:roomId/messages', verifyToken, sendMessage)

// Read receipts
router.patch('/:roomId/messages/:messageId/read', verifyToken, markMessageRead)

router.patch('/:roomId/read-all', verifyToken, markAllMessagesRead)

// Unread
router.get('/:roomId/unread-count', verifyToken, getUnreadCount)

// Report
router.post('/:roomId/report', verifyToken, reportChat)

// Archive
router.patch('/:roomId/archive', verifyToken, archiveChat)

export default router
