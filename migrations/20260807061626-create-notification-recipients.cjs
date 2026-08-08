'use strict'

module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('notification_recipients', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },

      notification_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'notifications',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },

      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },

      user_type: {
        type: Sequelize.ENUM('business', 'influencer', 'admin'),
        allowNull: false
      },

      is_read: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },

      delivered: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },

      delivered_at: {
        type: Sequelize.DATE
      },

      read_at: {
        type: Sequelize.DATE
      },

      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },

      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    })

    await queryInterface.addIndex('notification_recipients', [
      'notification_id'
    ])

    await queryInterface.addIndex('notification_recipients', ['user_id'])

    await queryInterface.addIndex('notification_recipients', ['user_type'])

    await queryInterface.addIndex('notification_recipients', [
      'user_id',
      'user_type'
    ])

    await queryInterface.addIndex('notification_recipients', ['is_read'])
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('notification_recipients')
  }
}
