import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'

const CampaignPayment = sequelize.define(
  'CampaignPayment',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },

    campaignId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    brandId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    creatorId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    amount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Amount in paise'
    },

    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'INR'
    },

    platformFee: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },

    creatorAmount: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    razorpayOrderId: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    },

    razorpayPaymentId: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    },

    razorpayTransferId: {
      type: DataTypes.STRING,
      allowNull: true
    },

    razorpayRefundId: {
      type: DataTypes.STRING,
      allowNull: true
    },

    razorpayLinkedAccountId: {
      type: DataTypes.STRING,
      allowNull: true
    },

    status: {
      type: DataTypes.ENUM(
        'PENDING',
        'AUTHORIZED',
        'CAPTURED',
        'ESCROW_LOCKED',
        'RELEASE_PENDING',
        'RELEASED',
        'REFUND_PENDING',
        'REFUNDED',
        'PARTIALLY_REFUNDED',
        'DISPUTED',
        'FAILED',
        'CANCELLED'
      ),
      defaultValue: 'PENDING'
    },

    escrowLockedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },

    releasedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },

    refundedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },

    completionVerifiedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },

    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  },
  {
    tableName: 'campaign_payments',
    timestamps: true,
    underscored: true
  }
)

export default CampaignPayment