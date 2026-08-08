# UUID → INTEGER Migration TODO

## Phase 1 — Models ✅
- [x] Business.js: add explicit `id` INTEGER PK, remove `uuid`, `business_user_id` → INTEGER
- [x] BusinessHacks.js: `user_id` → INTEGER, remove isUUID
- [x] Campaign.js: `user_id` → INTEGER
- [x] BusinessHackDetail.js: `user_id` → INTEGER
- [x] BusinessHackDetail2.js: `user_id` → INTEGER
- [x] BusinessHackStep4.js: `user_id` → INTEGER
- [x] BusinessHacksVideo.js: `user_id` → INTEGER
- [x] Deal.js: `influencer_id`, `business_id`, `user_id` → INTEGER, remove isUUID
- [x] Brand.js: `user_id` → INTEGER
- [x] Banner.js: `user_id` → INTEGER
- [x] BusinessProfile.js: `user_id` → INTEGER
- [x] InfluencerDashboard.js: `user_id` → INTEGER
- [x] InHacks.js: `user_id` → INTEGER
- [x] Product.js: `user_id` → INTEGER
- [x] Profile.js: `user_id` → INTEGER
- [x] Referral.js: `user_id` → INTEGER
- [x] UserIdentity.js: `businessUuid` → `businessId` (INTEGER)

## Phase 2 — Identity service & JWT ✅
- [x] services/identity.service.js: businessUuid → businessId
- [x] controller/businessController.js: use business.id, getBusinessById
- [x] controller/AuthController.js: use user.id for business
- [x] controller/OtpController.js: use user.id
- [x] Remove uuidv4 imports in businessController.js, InfluencerUserController.js

## Phase 3 — Controllers ✅
- [x] ApplicationController.js: remove isUUID import
- [x] InfluencerControllers.js: remove isUUID import
- [x] routes/businessRoutes.js: getBusinessById

## Phase 4 — Migration ✅
- [x] Create migration to convert business_registration to INTEGER
      (migrations/20260809000001-convert-business-uuid-to-int.cjs)

## Phase 5 — Verification
- [ ] Provide verification SQL
- [ ] Provide Postman test sequence
