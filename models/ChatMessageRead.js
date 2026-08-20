import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'

const ChatMessageRead = sequelize.define(
  'ChatMessageRead',
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true
    },

    messageId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: 'message_id'
    },

    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id'
    },

    userType: {
      type: DataTypes.ENUM(
        'brand',
        'creator'
      ),
      allowNull: false,
      field: 'user_type'
    },

    readAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'read_at'
    }
  },
  {
    tableName: 'chat_message_reads',
    timestamps: true,
    underscored: true
  }
)

export default ChatMessageRead