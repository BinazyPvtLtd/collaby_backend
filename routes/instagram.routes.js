import express from 'express'

import {
  connectInstagram,
  instagramCallback,
  getInstagramProfile,
  disconnectInstagram
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
| Disconnect Instagram
|--------------------------------------------------------------------------
*/

router.delete('/disconnect', verifyToken, disconnectInstagram)

export default router
