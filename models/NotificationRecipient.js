import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'

const NotificationRecipient = sequelize.define(
  'NotificationRecipient',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },

    notificationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'notification_id'
    },

    // ── Universal identity (THE canonical reference) ──────────────────────
    // FK -> user_identities.id. Every recipient is matched to a device token
    // via this identity, so business(UUID) and influencer(INTEGER) both work.
    identityId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'identity_id'
    },

    // Legacy reference kept for backward compatibility (informational).
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'user_id'
    },

    userType: {
      type: DataTypes.ENUM('business', 'influencer', 'admin'),
      allowNull: false,
      field: 'user_type'
    },

    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_read'
    },

    delivered: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },

    deliveredAt: {
      type: DataTypes.DATE,
      field: 'delivered_at'
    },

    readAt: {
      type: DataTypes.DATE,
      field: 'read_at'
    },
    failureReason: {
      type: DataTypes.TEXT,
      field: 'failure_reason'
    }
  },
  {
    tableName: 'notification_recipients',
    underscored: true
  }
)

export default NotificationRecipient
