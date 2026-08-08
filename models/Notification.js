import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'

const Notification = sequelize.define(
  'Notification',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },

    title: {
      type: DataTypes.STRING,
      allowNull: false
    },

    body: {
      type: DataTypes.TEXT,
      allowNull: false
    },

    imageUrl: {
      type: DataTypes.TEXT,
      field: 'image_url'
    },

    type: {
      type: DataTypes.STRING,
      allowNull: false
    },

    data: {
      type: DataTypes.JSONB
    },

    createdBy: {
      type: DataTypes.INTEGER,
      field: 'created_by'
    },

    // The deep-link action a client should perform when the notification is
    // tapped. NOTE: This was previously (incorrectly) declared as a table
    // option; it is now a proper column attribute.
    clickAction: {
      type: DataTypes.STRING,
      field: 'click_action'
    },

    // Reference to the business-domain entity this notification relates to
    // (e.g. campaign id, application id, deal id). Stored as a string so that
    // both INTEGER and UUID references are supported without type collisions.
    referenceId: {
      type: DataTypes.STRING,
      field: 'reference_id'
    },

    priority: {
      type: DataTypes.ENUM('LOW', 'NORMAL', 'HIGH'),
      defaultValue: 'NORMAL'
    },

    status: {
      type: DataTypes.ENUM('PENDING', 'SENT', 'FAILED'),
      defaultValue: 'PENDING'
    },

    // Total number of recipients this notification was sent to (denormalized
    // for fast history counts).
    recipientCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'recipient_count'
    },

    scheduledAt: {
      type: DataTypes.DATE
    }
  },
  {
    tableName: 'notifications',
    underscored: true,
  }
)

export default Notification
