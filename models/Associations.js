import BusinessHack from "./BusinessHacks.js";
import BusinessHackDetail from "./BusinessHackDetail.js";
import BusinessHackStep3 from "./BusinessHackDetail2.js";
import BusinessHackStep4 from "./BusinessHackStep4.js";

import Application from "./Application.js";
import User from "./User.js";

// ================= BUSINESS HACK ASSOCIATIONS =================

BusinessHack.hasOne(BusinessHackDetail, {
  foreignKey: "businessHackId",
  as: "business_hack_details",
});

BusinessHack.hasOne(BusinessHackStep3, {
  foreignKey: "businessHackId",
  as: "business_hack_step3",
});

BusinessHack.hasOne(BusinessHackStep4, {
  foreignKey: "businessHackId",
  as: "business_hack_step4",
});

// CHILD → PARENT

BusinessHackDetail.belongsTo(BusinessHack, {
  foreignKey: "businessHackId",
});

BusinessHackStep3.belongsTo(BusinessHack, {
  foreignKey: "businessHackId",
});

BusinessHackStep4.belongsTo(BusinessHack, {
  foreignKey: "businessHackId",
});

// ================= APPLICATION ASSOCIATIONS =================

// Application → User (Influencer)

Application.belongsTo(User, {
  foreignKey: "influencer_id",
  targetKey: "id",
  as: "influencer",
});

// User → Applications

User.hasMany(Application, {
  foreignKey: "influencer_id",
  sourceKey: "id",
  as: "applications",
});

export {
  BusinessHack,
  BusinessHackDetail,
  BusinessHackStep3,
  BusinessHackStep4,
  Application,
  User,
};