import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'

const InstagramAccount = sequelize.define(
  'InstagramAccount',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },

    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    userType: {
      type: DataTypes.ENUM('business', 'influencer', 'admin'),
      allowNull: false
    },

    instagramUserId: {
      type: DataTypes.STRING,
      allowNull: false
    },

    username: {
      type: DataTypes.STRING,
      allowNull: true
    },

    name: {
      type: DataTypes.STRING,
      allowNull: true
    },

    accountType: {
      type: DataTypes.STRING,
      allowNull: true
    },

    profilePictureUrl: {
      type: DataTypes.TEXT,
      allowNull: true
    },

    followersCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },

    followingCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },

    mediaCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },

    accessToken: {
      type: DataTypes.TEXT,
      allowNull: true
    },

    tokenExpiresAt: {
      type: DataTypes.DATE,
      allowNull: true
    },

    isConnected: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },

    lastSyncedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    tableName: 'instagram_accounts',

    timestamps: true,

    underscored: true,

    indexes: [
      {
        unique: true,
        fields: ['instagram_user_id']
      },
      {
        unique: true,
        fields: ['user_id', 'user_type']
      }
    ]
  }
)

export default InstagramAccount