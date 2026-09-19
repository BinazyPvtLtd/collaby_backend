import express from 'express'

import {
    createCampaignPaymentOrder,
    verifyCampaignPayment,
    releaseEscrow,
    refundCampaignPayment,
    createPaymentDispute,
    getEscrowStatus
} from '../controllers/campaignPayment.controller.js'

import {
    razorpayWebhook
} from '../controllers/razorpayWebhook.controller.js'

import verifyToken from '../middleware/verifyToken.js'

const router = express.Router()

// Razorpay webhook
router.post(
    '/webhook/razorpay',
    razorpayWebhook
)

// Brand creates payment
router.post(
    '/campaign/:campaignId/create-order',
    verifyToken,
    createCampaignPaymentOrder
)

// Verify payment
router.post(
    '/verify',
    verifyToken,
    verifyCampaignPayment
)

// Escrow
router.get(
    '/:paymentId/escrow',
    verifyToken,
    getEscrowStatus
)

// Release after verified completion
router.post(
    '/:paymentId/release',
    verifyToken,
    releaseEscrow
)

// Refund
router.post(
    '/:paymentId/refund',
    verifyToken,
    refundCampaignPayment
)

// Dispute
router.post(
    '/:paymentId/dispute',
    verifyToken,
    createPaymentDispute
)

export default router