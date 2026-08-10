import BusinessHack from './BusinessHacks.js'
import BusinessHackDetail from './BusinessHackDetail.js'
import BusinessHackStep3 from './BusinessHackDetail2.js'
import BusinessHackStep4 from './BusinessHackStep4.js'

import Application from './Application.js'
import InfluencerUser from './InfluencerUser.js'
import ContentCategory from './contentcategory.js'
import InfluencerCategory from './InfluencerCategory.js'

import Notification from './Notification.js'
import NotificationRecipient from './NotificationRecipient.js'
import DeviceToken from './DeviceToken.js'
import UserIdentity from './UserIdentity.js'

// ================= BUSINESS HACK =================

BusinessHack.hasOne(BusinessHackDetail, {
  foreignKey: 'businessHackId',
  as: 'business_hack_details'
})

BusinessHack.hasOne(BusinessHackStep3, {
  foreignKey: 'businessHackId',
  as: 'business_hack_step3'
})

BusinessHack.hasOne(BusinessHackStep4, {
  foreignKey: 'businessHackId',
  as: 'business_hack_step4'
})

BusinessHackDetail.belongsTo(BusinessHack, {
  foreignKey: 'businessHackId'
})

BusinessHackStep3.belongsTo(BusinessHack, {
  foreignKey: 'businessHackId'
})

BusinessHackStep4.belongsTo(BusinessHack, {
  foreignKey: 'businessHackId'
})

// ================= APPLICATION =================

Application.belongsTo(InfluencerUser, {
  foreignKey: 'influencer_id',
  targetKey: 'id',
  as: 'influencer'
})

InfluencerUser.hasMany(Application, {
  foreignKey: 'influencer_id',
  sourceKey: 'id',
  as: 'applications'
})

// ================= CATEGORY =================

InfluencerUser.hasMany(InfluencerCategory, {
  foreignKey: 'influencer_id',
  sourceKey: 'id',
  as: 'categories'
})

InfluencerCategory.belongsTo(InfluencerUser, {
  foreignKey: 'influencer_id',
  targetKey: 'id',
  as: 'influencer'
})

ContentCategory.hasMany(InfluencerCategory, {
  foreignKey: 'category_id',
  sourceKey: 'id',
  as: 'influencerMappings'
})

InfluencerCategory.belongsTo(ContentCategory, {
  foreignKey: 'category_id',
  targetKey: 'id',
  as: 'category'
})

// Notification and DeviceToken associations are defined in their respective model files (Notification.js, DeviceToken.js, NotificationRecipient.js) and do not require additional associations here.
Notification.hasMany(NotificationRecipient, {
  foreignKey: 'notificationId',
  as: 'recipients'
})

NotificationRecipient.belongsTo(Notification, {
  foreignKey: 'notificationId',
  as: 'notification'
})

// ================= USER IDENTITY (universal mapping) =================

// A DeviceToken belongs to exactly one UserIdentity.
DeviceToken.belongsTo(UserIdentity, {
  foreignKey: 'identityId',
  targetKey: 'id',
  as: 'identity'
})

UserIdentity.hasMany(DeviceToken, {
  foreignKey: 'identityId',
  sourceKey: 'id',
  as: 'deviceTokens'
})

// A NotificationRecipient belongs to exactly one UserIdentity.
NotificationRecipient.belongsTo(UserIdentity, {
  foreignKey: 'identityId',
  targetKey: 'id',
  as: 'identity'
})

UserIdentity.hasMany(NotificationRecipient, {
  foreignKey: 'identityId',
  sourceKey: 'id',
  as: 'notificationRecipients'
})

export {
  BusinessHack,
  BusinessHackDetail,
  BusinessHackStep3,
  BusinessHackStep4,
  Application,
  InfluencerUser,
  ContentCategory,
  InfluencerCategory,
  Notification,
  NotificationRecipient,
  DeviceToken,
  UserIdentity
}
