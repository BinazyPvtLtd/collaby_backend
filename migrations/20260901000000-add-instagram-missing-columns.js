export default {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('instagram_accounts', 'name', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('instagram_accounts', 'profile_picture_url', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    await queryInterface.addColumn('instagram_accounts', 'followers_count', {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      allowNull: false
    });

    await queryInterface.addColumn('instagram_accounts', 'following_count', {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      allowNull: false
    });
  },

  async down (queryInterface) {
    await queryInterface.removeColumn('instagram_accounts', 'name');
    await queryInterface.removeColumn('instagram_accounts', 'profile_picture_url');
    await queryInterface.removeColumn('instagram_accounts', 'followers_count');
    await queryInterface.removeColumn('instagram_accounts', 'following_count');
  }
};
