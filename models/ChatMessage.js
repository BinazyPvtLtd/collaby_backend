import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'

const ChatMessage = sequelize.define(
  'ChatMessage',
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true
    },

    roomId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'room_id'
    },

    senderId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'sender_id'
    },

    senderType: {
      type: DataTypes.ENUM(
        'brand',
        'creator',
        'system'
      ),
      allowNull: false,
      field: 'sender_type'
    },

    messageType: {
      type: DataTypes.ENUM(
        'text',
        'image',
        'pdf',
        'video',
        'system'
      ),
      allowNull: false,
      defaultValue: 'text',
      field: 'message_type'
    },

    content: {
      type: DataTypes.TEXT,
      allowNull: true
    },

    fileUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'file_url'
    },

    fileName: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'file_name'
    },

    fileSize: {
      type: DataTypes.BIGINT,
      allowNull: true,
      field: 'file_size'
    },

    mimeType: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'mime_type'
    },

    readAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'read_at'
    },

    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'deleted_at'
    }
  },
  {
    tableName: 'chat_messages',
    timestamps: true,
    underscored: true
  }
)

export default ChatMessage