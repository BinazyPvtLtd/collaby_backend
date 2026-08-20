import ChatRoom from '../models/ChatRoom.js'

class ChatService {
  async createRoom ({ campaignId, brandId, creatorId, transaction = null }) {
    if (!campaignId) {
      throw new Error('Campaign ID is required to create chat room')
    }

    if (!brandId) {
      throw new Error('Brand ID is required to create chat room')
    }

    if (!creatorId) {
      throw new Error('Creator ID is required to create chat room')
    }

    const roomKey = `${campaignId}:${brandId}:${creatorId}`

    console.log('CREATING CHAT ROOM:', {
      campaignId,
      brandId,
      creatorId,
      roomKey
    })

    const roomKey = `${campaignId}:${brandId}:${creatorId}`

    const [room, created] = await ChatRoom.findOrCreate({
      where: {
        roomKey
      },

      defaults: {
        campaignId,
        brandId,
        creatorId,
        roomKey,
        status: 'active'
      },

      transaction
    })

    return {
      room,
      created
    }
  }
}

export default new ChatService()
