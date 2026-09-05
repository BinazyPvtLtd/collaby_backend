// middleware/chatSocketAuth.js

import jwt from 'jsonwebtoken'

export const chatSocketAuth = (socket, next) => {
  try {
    const token = socket.handshake.auth?.token

    if (!token) {
      return next(
        new Error('Authentication token required')
      )
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    )

    socket.user = {
      identityId: decoded.identityId,
      userId: decoded.userId,
      userType: decoded.userType
    }

    console.log('🔐 SOCKET USER:', socket.user)

    next()

  } catch (error) {
    console.error(
      'Socket authentication failed:',
      error
    )

    next(
      new Error('Invalid authentication token')
    )
  }
}
