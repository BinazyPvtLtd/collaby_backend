import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'

const ChatReport = sequelize.define(
  'ChatReport',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },

    roomId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'room_id'
    },

    reportedBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'reported_by'
    },

    reportedByType: {
      type: DataTypes.ENUM(
        'brand',
        'creator'
      ),
      allowNull: false,
      field: 'reported_by_type'
    },

    reason: {
      type: DataTypes.STRING,
      allowNull: false
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },

    status: {
      type: DataTypes.ENUM(
        'pending',
        'reviewed',
        'resolved'
      ),
      defaultValue: 'pending'
    },

    resolvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'resolved_at'
    }
  },
  {
    tableName: 'chat_reports',
    timestamps: true,
    underscored: true
  }
)

export default ChatReport