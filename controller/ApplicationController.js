import Application from '../models/Application.js'
import BusinessRegistration from '../models/Business.js'
import InfluencerUser from '../models/InfluencerUser.js'
import User from '../models/User.js'
import BusinessHack from '../models/BusinessHacks.js'
import { NotificationTypes } from '../constants/notificationTypes.js'
import { ClickActions } from '../constants/clickActions.js'
import notificationService from '../services/notification.service.js'
/**
 * @desc    Influencer applies to a campaign
 * @route   POST /api/applications
 * @access  Influencer (Protected)
 */

export const applyToCampaign = async (req, res) => {
  try {
    const { campaignId, pitchMessage, expectedRate, brandId } = req.body

    const user = req.user

    // ============================================================
    // 1. AUTH CHECK
    // ============================================================
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      })
    }

    // ============================================================
    // 2. ROLE CHECK
    // ============================================================
    if (user.userType !== 'influencer') {
      return res.status(403).json({
        success: false,
        message: 'Only influencers can apply'
      })
    }

    // ============================================================
    // 3. VALIDATE INFLUENCER
    // ============================================================
    const influencerId = Number(user.userId)

    if (!Number.isInteger(influencerId) || influencerId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid influencer ID'
      })
    }

    // ============================================================
    // 4. VALIDATE CAMPAIGN
    // ============================================================
    const campaignIdNum = Number(campaignId)

    if (!Number.isInteger(campaignIdNum) || campaignIdNum <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid campaign ID'
      })
    }

    // ============================================================
    // 5. FIND CAMPAIGN
    // ============================================================
    const campaign = await BusinessHack.findByPk(campaignIdNum)

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      })
    }

    // ============================================================
    // 6. CHECK DUPLICATE APPLICATION
    // ============================================================
    const existing = await Application.findOne({
      where: {
        campaign_id: campaignIdNum,
        influencer_id: influencerId
      }
    })

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Already applied to this campaign'
      })
    }

    // ============================================================
    // 7. CREATE APPLICATION
    // ============================================================
    const application = await Application.create({
      user_id: user.userId,
      campaign_id: campaignIdNum,
      influencer_id: influencerId,
      brand_id: brandId,
      pitch_message: pitchMessage,
      expected_rate: expectedRate
    })

    console.log('✅ Application created:', application.id)
    console.log('========== INFLUENCER DEBUG ==========')
    console.log('req.user:', user)
    console.log('user.userId:', user.userId)
    console.log('influencerId:', influencerId)
    console.log('======================================')
    // ============================================================
    // 8. NOTIFICATION INFO
    // ============================================================

    let notificationInfo = {
      sent: false,
      notificationId: null,
      type: NotificationTypes.APPLICATION_RECEIVED,
      title: 'New Application',
      body: 'An influencer has applied to your campaign.',
      referenceId: application.id,
      recipient: null,
      message: 'Notification was not sent'
    }

    try {
      // campaign.user_id = business/user who owns the campaign
      const businessUserId = Number(campaign.user_id)

      if (Number.isInteger(businessUserId) && businessUserId > 0) {
        notificationInfo.recipient = {
          userId: businessUserId,
          userType: 'business'
        }

        const notification = await notificationService.sendNotification({
          users: [
            {
              userId: businessUserId,
              userType: 'business'
            }
          ],

          title: 'New Application',

          body: 'An influencer has applied to your campaign.',

          type: NotificationTypes.APPLICATION_RECEIVED,

          clickAction: ClickActions.APPLICATION_DETAILS,

          referenceId: application.id,

          createdBy: influencerId,

          data: {
            applicationId: String(application.id),
            campaignId: String(campaign.id),
            influencerId: String(influencerId)
          }
        })

        console.log(
          '🔔 Application notification sent to business:',
          businessUserId
        )

        console.log('🔔 Notification result:', notification)

        // ========================================================
        // STORE NOTIFICATION RESULT FOR FRONTEND
        // ========================================================

        notificationInfo = {
          sent: true,

          notificationId:
            notification?.notification?.id || notification?.id || null,

          type: NotificationTypes.APPLICATION_RECEIVED,

          title: 'New Application',

          body: 'An influencer has applied to your campaign.',

          clickAction: ClickActions.APPLICATION_DETAILS,

          referenceId: application.id,

          recipient: {
            userId: businessUserId,
            userType: 'business'
          },

          data: {
            applicationId: String(application.id),
            campaignId: String(campaign.id),
            influencerId: String(influencerId)
          },

          message: 'Notification sent successfully'
        }
      } else {
        console.error('❌ Invalid business user ID:', campaign.user_id)

        notificationInfo.message =
          'Application created, but business user ID is invalid'
      }
    } catch (notificationError) {
      // ============================================================
      // IMPORTANT:
      // APPLICATION IS ALREADY CREATED.
      // DO NOT FAIL THE API.
      // ============================================================

      console.error(
        '⚠️ Failed to send application notification:',
        notificationError
      )

      notificationInfo = {
        ...notificationInfo,

        sent: false,

        message:
          'Application created successfully, but notification could not be sent',

        error:
          process.env.NODE_ENV === 'development'
            ? notificationError.message
            : undefined
      }
    }

    // ============================================================
    // 9. RESPONSE
    // ============================================================

    return res.status(201).json({
      success: true,

      message: 'Application submitted successfully',

      data: {
        application,

        notification: notificationInfo
      }
    })
  } catch (error) {
    console.error('❌ applyToCampaign ERROR:', error)

    return res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

/**
 * @desc    Get all applications of logged-in influencer
 * @route   GET /api/applications/my
 * @access  Influencer (Protected)
 */
export const getMyApplications = async (req, res) => {
  try {
    const user = req.user

    // Auth check
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      })
    }

    // Role check
    if (user.userType !== 'influencer') {
      return res.status(403).json({
        success: false,
        message: 'Only influencers can view their applications'
      })
    }
    const influencerId = Number(user.userId)

    if (isNaN(influencerId) || influencerId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid influencer ID'
      })
    }

    const applications = await Application.findAll({
      where: {
        influencer_id: influencerId
      },
      order: [['createdAt', 'DESC']]
    })

    return res.json({
      success: true,
      count: applications.length,
      data: applications
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    })
  }
}
/**
 * @desc    Get all applications for a specific campaign
 * @route   GET /api/applications/campaign/:campaignId
 * @access  Brand (Protected)
 */
export const getApplicationsByCampaign = async (req, res) => {
  try {
    // Correct param name
    const { campaignId } = req.params

    // Validation
    if (!campaignId) {
      return res.status(400).json({
        success: false,
        message: 'campaignId is required'
      })
    }

    // If DB column is INTEGER
    if (isNaN(campaignId)) {
      return res.status(400).json({
        success: false,
        message: 'campaignId must be a number'
      })
    }

    const applications = await Application.findAll({
      where: { campaign_id: Number(campaignId) }
    })

    return res.json({
      success: true,
      data: applications
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    })
  }
}
import Deal from '../models/Deal.js'
import sequelize from '../config/database.js'

/**
 * @desc    Brand accepts an application and creates a deal
 * @route   POST /api/applications/:id/accept
 * @access  Brand (Protected)
 */

export const acceptApplication = async (req, res) => {
  let transaction = null

  try {
    // ============================================================
    // 1. CREATE TRANSACTION
    // ============================================================
    transaction = await sequelize.transaction()

    const { id } = req.params
    const user = req.user

    // ============================================================
    // 2. AUTH CHECK
    // ============================================================
    if (!user) {
      if (transaction && !transaction.finished) {
        await transaction.rollback()
      }

      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      })
    }

    // ============================================================
    // 3. ROLE CHECK
    // ============================================================
    if (user.userType !== 'business') {
      if (transaction && !transaction.finished) {
        await transaction.rollback()
      }

      return res.status(403).json({
        success: false,
        message: 'Only brands can accept applications'
      })
    }

    const businessId = Number(user.userId)

    // ============================================================
    // 4. VALIDATE APPLICATION ID
    // ============================================================
    const applicationId = Number(id)

    if (!id || !Number.isInteger(applicationId) || applicationId <= 0) {
      if (transaction && !transaction.finished) {
        await transaction.rollback()
      }

      return res.status(400).json({
        success: false,
        message: 'Invalid application ID'
      })
    }

    // ============================================================
    // 5. FIND APPLICATION
    // ============================================================
    const application = await Application.findByPk(applicationId, {
      transaction
    })

    if (!application) {
      if (transaction && !transaction.finished) {
        await transaction.rollback()
      }

      return res.status(404).json({
        success: false,
        message: 'Application not found'
      })
    }

    // ============================================================
    // 6. PREVENT RE-ACCEPT
    // ============================================================
    if (application.status !== 'pending') {
      if (transaction && !transaction.finished) {
        await transaction.rollback()
      }

      return res.status(400).json({
        success: false,
        message: `Application already ${application.status}`
      })
    }

    // ============================================================
    // 7. FIND CAMPAIGN
    // ============================================================
    const campaign = await BusinessHack.findByPk(application.campaign_id, {
      transaction
    })

    console.log('CAMPAIGN FOUND:', campaign)

    if (!campaign) {
      if (transaction && !transaction.finished) {
        await transaction.rollback()
      }

      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      })
    }

    // ============================================================
    // 8. PREVENT DUPLICATE DEAL
    // ============================================================
    const existingDeal = await Deal.findOne({
      where: {
        application_id: application.id
      },
      transaction
    })

    if (existingDeal) {
      if (transaction && !transaction.finished) {
        await transaction.rollback()
      }

      return res.status(400).json({
        success: false,
        message: 'Deal already exists for this application'
      })
    }

    console.log('APPLICATION:', application)

    // ============================================================
    // 9. UPDATE APPLICATION
    // ============================================================
    application.status = 'accepted'

    await application.save({
      transaction
    })

    // ============================================================
    // 10. CREATE DEAL
    // ============================================================
    const deal = await Deal.create(
      {
        user_id: application.user_id,
        campaign_id: application.campaign_id,
        application_id: application.id,
        influencer_id: application.influencer_id,
        brand_id: application.brand_id,
        business_id: businessId,
        agreed_price: application.expected_rate || 0,
        deal_status: 'accepted'
      },
      {
        transaction
      }
    )

    // ============================================================
    // 11. COMMIT TRANSACTION
    // ============================================================
    await transaction.commit()

    // ============================================================
    // 12. NOTIFICATION OBJECT
    // ============================================================
    let notificationInfo = {
      sent: false,

      title: 'Application Accepted',

      body: 'Congratulations! Your application has been accepted.',

      type: NotificationTypes.APPLICATION_ACCEPTED,

      clickAction: ClickActions.DEAL_DETAILS,

      referenceId: deal.id,

      recipient: {
        userId: application.influencer_id,
        userType: 'influencer'
      },

      data: {
        dealId: String(deal.id),
        applicationId: String(application.id),
        campaignId: String(application.campaign_id)
      },

      message: 'Notification was not sent'
    }

    // ============================================================
    // 13. SEND NOTIFICATION AFTER COMMIT
    // ============================================================
    try {
      const notification = await notificationService.sendNotification({
        users: [
          {
            userId: application.influencer_id,
            userType: 'influencer'
          }
        ],

        // ✅ Backend controlled
        title: 'Application Accepted',

        // ✅ Backend controlled
        body: 'Congratulations! Your application has been accepted.',

        type: NotificationTypes.APPLICATION_ACCEPTED,

        clickAction: ClickActions.DEAL_DETAILS,

        referenceId: deal.id,

        createdBy: businessId,

        data: {
          dealId: String(deal.id),
          applicationId: String(application.id),
          campaignId: String(application.campaign_id)
        }
      })

      console.log('🔔 Acceptance notification sent:', notification)

      // ==========================================================
      // STORE NOTIFICATION RESULT
      // ==========================================================
      notificationInfo = {
        ...notificationInfo,

        sent: true,

        notificationId:
          notification?.notification?.id || notification?.id || null,

        message: 'Notification sent successfully'
      }
    } catch (notificationError) {
      // IMPORTANT:
      // Deal/application are already committed.
      // Notification failure should NOT fail this API.

      console.error(
        '⚠️ Failed to send acceptance notification:',
        notificationError
      )

      notificationInfo = {
        ...notificationInfo,

        sent: false,

        message:
          'Application accepted and deal created, but notification failed',

        error:
          process.env.NODE_ENV === 'development'
            ? notificationError.message
            : undefined
      }
    }

    // ============================================================
    // 14. RESPONSE
    // ============================================================
    return res.status(200).json({
      success: true,

      message: 'Application accepted and deal created',

      data: {
        deal,

        notification: notificationInfo
      }
    })
  } catch (error) {
    console.error('ACCEPT APPLICATION ERROR:', error)

    try {
      if (transaction && !transaction.finished) {
        await transaction.rollback()
      }
    } catch (rollbackError) {
      console.error('ROLLBACK ERROR:', rollbackError)
    }

    return res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

/**
 * @desc    Brand rejects an application
 * @route   POST /api/applications/:id/reject
 * @access  Brand (Protected)
 */

export const rejectApplication = async (req, res) => {
  try {
    const { id } = req.params
    const user = req.user

    // ============================================================
    // 1. AUTH CHECK
    // ============================================================
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      })
    }

    // ============================================================
    // 2. ROLE CHECK
    // ============================================================
    if (user.userType !== 'business') {
      return res.status(403).json({
        success: false,
        message: 'Only brands can reject applications'
      })
    }

    // ============================================================
    // 3. VALIDATE APPLICATION ID
    // ============================================================
    const applicationId = Number(id)

    if (!id || !Number.isInteger(applicationId) || applicationId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid application ID'
      })
    }

    // ============================================================
    // 4. FIND APPLICATION
    // ============================================================
    const application = await Application.findByPk(applicationId)

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      })
    }

    // ============================================================
    // 5. PREVENT RE-ACTION
    // ============================================================
    if (application.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Application already ${application.status}`
      })
    }

    // ============================================================
    // 6. REJECT APPLICATION
    // ============================================================
    application.status = 'rejected'

    await application.save()

    console.log('❌ Application rejected:', application.id)

    // ============================================================
    // 7. NOTIFICATION INFO
    // ============================================================

    let notificationInfo = {
      sent: false,

      title: 'Application Rejected',

      body: 'Unfortunately your application has been rejected.',

      type: NotificationTypes.APPLICATION_REJECTED,

      clickAction: ClickActions.APPLICATION_DETAILS,

      referenceId: application.id,

      recipient: {
        userId: application.influencer_id,
        userType: 'influencer'
      },

      data: {
        applicationId: String(application.id),
        campaignId: String(application.campaign_id)
      },

      message: 'Notification was not sent'
    }

    // ============================================================
    // 8. SEND NOTIFICATION
    // ============================================================

    try {
      const notification = await notificationService.sendNotification({
        users: [
          {
            userId: application.influencer_id,
            userType: 'influencer'
          }
        ],

        // ✅ Backend controlled
        title: 'Application Rejected',

        // ✅ Backend controlled
        body: 'Unfortunately your application has been rejected.',

        type: NotificationTypes.APPLICATION_REJECTED,

        clickAction: ClickActions.APPLICATION_DETAILS,

        referenceId: application.id,

        createdBy: user.userId || null,

        data: {
          applicationId: String(application.id),
          campaignId: String(application.campaign_id)
        }
      })

      console.log('🔔 Rejection notification sent:', notification)

      // ==========================================================
      // 9. STORE NOTIFICATION RESULT
      // ==========================================================

      notificationInfo = {
        ...notificationInfo,

        sent: true,

        notificationId:
          notification?.notification?.id || notification?.id || null,

        message: 'Notification sent successfully'
      }
    } catch (notificationError) {
      // IMPORTANT:
      // Application is already rejected.
      // Do NOT fail the API because FCM failed.

      console.error(
        '⚠️ Failed to send rejection notification:',
        notificationError
      )

      notificationInfo = {
        ...notificationInfo,

        sent: false,

        message: 'Application rejected successfully, but notification failed',

        error:
          process.env.NODE_ENV === 'development'
            ? notificationError.message
            : undefined
      }
    }

    // ============================================================
    // 10. RESPONSE
    // ============================================================

    return res.status(200).json({
      success: true,

      message: 'Application rejected successfully',

      data: {
        application,

        notification: notificationInfo
      }
    })
  } catch (error) {
    console.error('REJECT APPLICATION ERROR:', error)

    return res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

/**
 * @desc    Influencer withdraws their application
 * @route   POST /api/applications/:id/withdraw
 * @access  Influencer (Protected)
 */
export const withdrawApplication = async (req, res) => {
  try {
    const { id } = req.params

    // Logged-in influencer ID
    const influencerId = req.user.userId

    // Find application that belongs to this influencer
    const application = await Application.findOne({
      where: {
        id,
        influencer_id: influencerId
      }
    })

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      })
    }

    // 🔁 Update status to withdrawn
    application.status = 'withdrawn'
    await application.save()

    res.json({
      success: true,
      message: 'Application withdrawn successfully'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

// //get all influencer applicants for a campaign (brand user)
// export const getCampaignApplicants = async (req, res) => {
//   try {
//     const { campaignId } = req.params;

//     const applications = await Application.findAll({
//       where: {
//         campaign_id: campaignId,
//       },

//       include: [
//         {
//           model: User,
//           as: "influencer", // association alias
//           attributes: ["id", "name", "email", "profilePhoto", "followers"],
//         },
//       ],

//       order: [["createdAt", "DESC"]],
//     });

//     return res.status(200).json({
//       success: true,
//       totalApplicants: applications.length,
//       data: applications,
//     });
//   } catch (error) {
//     console.log(error);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch applicants",
//       error: error.message,
//     });
//   }
// };

//api to get all influencers applied to a campaign (brand user)

export const getCampaignApplicants = async (req, res) => {
  try {
    const { campaignId } = req.params

    if (!campaignId) {
      return res.status(400).json({
        success: false,
        message: 'Campaign ID is required'
      })
    }

    const applicants = await Application.findAll({
      where: {
        campaign_id: campaignId
      },

      include: [
        {
          model: User,
          as: 'influencer',
          attributes: ['id', 'name', 'email']
        }
      ],

      order: [['createdAt', 'DESC']]
    })

    return res.status(200).json({
      success: true,
      total: applicants.length,
      data: applicants
    })
  } catch (error) {
    console.error('Get Campaign Applicants Error:', error)

    return res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    })
  }
}
