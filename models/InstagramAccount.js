import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const InstagramAccount = sequelize.define(
  'InstagramAccount',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'userId',
    },

    userType: {
      type: DataTypes.ENUM('business', 'influencer', 'admin'),
      allowNull: false,
      field: 'userType',
    },

    instagramUserId: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'instagram_user_id',
    },

    username: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'username',
    },

    name: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'name',
    },

    accountType: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'account_type',
    },

    profilePictureUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'profile_picture_url',
    },

    followersCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'followers_count',
    },

    followingCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'following_count',
    },

    mediaCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'media_count',
    },

    accessToken: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'access_token',
    },

    tokenExpiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'token_expires_at',
    },

    isConnected: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_connected',
    },

    lastSyncedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_synced_at',
    },
  },
  {
    tableName: 'instagram_accounts',
    timestamps: true,

    // IMPORTANT:
    // Do not let Sequelize automatically convert userId/userType
    // to user_id/user_type.
    underscored: false,

    indexes: [
      {
        name: 'instagram_accounts_instagram_user_id_unique',
        unique: true,
        fields: ['instagram_user_id'],
      },
      {
        name: 'instagram_accounts_user_id_user_type_unique',
        unique: true,
        fields: ['userId', 'userType'],
      },
    ],
  }
);

export default InstagramAccount;