import express from 'express'

import {
  connectInstagram,
  instagramCallback,
  getInstagramProfile,
  disconnectInstagram,
  getInstagramMedia,
  getInstagramInsights,
  getInstagramMediaInsights
} from '../controller/instagram.controller.js'

import { verifyToken } from '../middleware/AuthMiddleware.js'

const router = express.Router()

/*
|--------------------------------------------------------------------------
| Start Instagram OAuth
|--------------------------------------------------------------------------
*/

router.get('/auth-url', verifyToken, connectInstagram)

/*
|--------------------------------------------------------------------------
| Instagram OAuth callback
|--------------------------------------------------------------------------
*/

router.get('/callback', instagramCallback)

/*
|--------------------------------------------------------------------------
| Get connected account
|--------------------------------------------------------------------------
*/

router.get('/profile', verifyToken, getInstagramProfile)

/*
|--------------------------------------------------------------------------
| Instagram Media
|--------------------------------------------------------------------------
*/

router.get('/media', verifyToken, getInstagramMedia)

/*
|--------------------------------------------------------------------------
| Instagram Account Insights
|--------------------------------------------------------------------------
*/

router.get('/insights', verifyToken, getInstagramInsights)

/*
|--------------------------------------------------------------------------
| Instagram Media Insights
|--------------------------------------------------------------------------
*/

router.get('/media/:mediaId/insights', verifyToken, getInstagramMediaInsights)

/*
|--------------------------------------------------------------------------
| Disconnect Instagram
|--------------------------------------------------------------------------
*/

router.delete('/disconnect', verifyToken, disconnectInstagram)

export default router
