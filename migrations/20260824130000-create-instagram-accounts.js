export default {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('instagram_accounts', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },

      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },

      user_type: {
        type: Sequelize.ENUM('influencer', 'business'),
        allowNull: false
      },

      instagram_user_id: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },

      username: {
        type: Sequelize.STRING,
        allowNull: true
      },

      account_type: {
        type: Sequelize.STRING,
        allowNull: true
      },

      media_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },

      access_token: {
        type: Sequelize.TEXT,
        allowNull: true
      },

      token_expires_at: {
        type: Sequelize.DATE,
        allowNull: true
      },

      is_connected: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },

      last_synced_at: {
        type: Sequelize.DATE,
        allowNull: true
      },

      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },

      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    })

    await queryInterface.addIndex(
      'instagram_accounts',
      ['user_id', 'user_type'],
      {
        unique: true,
        name: 'unique_instagram_connection_per_user'
      }
    )
  },

  async down (queryInterface) {
    await queryInterface.dropTable('instagram_accounts')
  }
}
