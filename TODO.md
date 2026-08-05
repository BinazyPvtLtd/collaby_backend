# Authentication Bug Fix — Logout/Re-login Protected API Failure

## Root Cause
JWT `userId` was inconsistent between the two auth flows:
- **Register** (`POST /api/business/register`): `userId = business.uuid`
- **Login** (`POST /api/auth/verify-otp`): `userId = User.id` (different UUID)

After logout → re-login, protected APIs query `where user_id: req.user.userId` using the wrong id, so they returned no data.

## Steps
- [x] Read auth flow files (businessRoutes, businessController, OtpController, Tokens, AuthMiddleware, models, controllers)
- [x] Identify the `userId` mismatch between registration and login token payloads
- [x] `controller/OtpController.js` — `verifyOtp`: use `business.uuid` / `influencer.id` as `userId` (matches registration)
- [x] `controller/OtpController.js` — `logout`: fall back to finding `User` by `phone`
- [x] `controller/OtpController.js` — `refreshAccessToken`: find `User` by `phone` fallback + preserve original `userId` in refreshed token
- [x] Verify syntax with `node --check`

## Testing
- [ ] Register a business → confirm protected APIs work
- [ ] Logout → login again → confirm protected APIs still work
- [ ] Test refresh-token flow after login
