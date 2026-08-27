import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'

const InstagramAccount = sequelize.define(
  'InstagramAccount',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },

    // Your Collaby user ID
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    userType: {
      type: DataTypes.ENUM(
        'influencer',
        'business'
      ),
      allowNull: false
    },

    // Instagram's professional account ID
    instagramUserId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },

    username: {
      type: DataTypes.STRING,
      allowNull: true
    },

    accountType: {
      type: DataTypes.STRING,
      allowNull: true
    },

    mediaCount: {
      type: DataTypes.INTEGER,
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

    indexes: [
      {
        unique: true,
        fields: ['userId', 'userType']
      }
    ]
  }
)

export default InstagramAccount