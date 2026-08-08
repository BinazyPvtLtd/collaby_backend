import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'

const DeviceToken = sequelize.define(
  'DeviceToken',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },

    deviceId: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'device_id'
    },
    deviceName: {
      type: DataTypes.STRING,
      field: 'device_name'
    },

    // ── Universal identity (THE canonical reference) ──────────────────────
    // FK -> user_identities.id. Every device token belongs to ONE universal
    // identity, regardless of whether the actor is a business(UUID) or an
    // influencer(INTEGER).
    identityId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'identity_id',
    },

    // ── Legacy reference (kept for backward compatibility / admin tooling) ──
    // For influencers this equals the legacy INTEGER id. For business/entities
    // this field could not hold a UUID, so it is now optional and informational.
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

    deviceType: {
      type: DataTypes.ENUM('android', 'ios', 'web'),
      allowNull: false,
      field: 'device_type'
    },

    fcmToken: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: true,
      field: 'fcm_token'
    },

    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    },
    appVersion: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'app_version'
    },

    osVersion: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'os_version'
    },

    lastUsedAt: {
      type: DataTypes.DATE,
      field: 'last_used_at'
    }
    
  },
  {
    tableName: 'device_tokens',
    underscored: true,
indexes: [
      {
        unique: true,
        fields: ['identity_id', 'device_id']
      }
    ]
  }
)

export default DeviceToken
