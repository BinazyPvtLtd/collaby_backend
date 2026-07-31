'use strict'

/** @type {import('sequelize-cli').Migration} */
export default {
  async up (queryInterface) {
    await queryInterface.bulkInsert('content_categories', [
      {
        category_name: 'Fashion',
        status: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      {
        category_name: 'Beauty',
        status: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      {
        category_name: 'Travel',
        status: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      {
        category_name: 'Food',
        status: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      {
        category_name: 'Fitness',
        status: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      {
        category_name: 'Gaming',
        status: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      {
        category_name: 'Technology',
        status: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      {
        category_name: 'Lifestyle',
        status: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      {
        category_name: 'Education',
        status: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      {
        category_name: 'Comedy',
        status: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ])
  },

  async down (queryInterface) {
    await queryInterface.bulkDelete('content_categories', null, {})
  }
}
