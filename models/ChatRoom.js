import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'

const ChatRoom = sequelize.define(
  'ChatRoom',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },

    campaignId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'campaign_id'
    },

    brandId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'brand_id'
    },

    creatorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'creator_id'
    },

    roomKey: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      field: 'room_key'
    },

    status: {
      type: DataTypes.ENUM('active', 'archived', 'blocked'),
      allowNull: false,
      defaultValue: 'active'
    },

    lastMessageId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'last_message_id'
    },

    lastMessageAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_message_at'
    },

    brandArchivedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },

    creatorArchivedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    tableName: 'chat_rooms',
    timestamps: true,
    underscored: true
  }
)

export default ChatRoom
