import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'

const Wallet = sequelize.define(
  'Wallet',
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
      type: DataTypes.ENUM(
        'business',
        'influencer'
      ),
      allowNull: false
    },

    availableBalance: {
      type: DataTypes.BIGINT,
      defaultValue: 0
    },

    pendingBalance: {
      type: DataTypes.BIGINT,
      defaultValue: 0
    },

    totalEarned: {
      type: DataTypes.BIGINT,
      defaultValue: 0
    },

    totalWithdrawn: {
      type: DataTypes.BIGINT,
      defaultValue: 0
    },

    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'INR'
    }
  },
  {
    tableName: 'wallets',
    timestamps: true,
    underscored: true
  }
)

export default Wallet