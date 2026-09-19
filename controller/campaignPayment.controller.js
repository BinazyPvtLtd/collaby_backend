import CampaignPayment from '../models/CampaignPayment.js'
import Campaign from '../models/Campaign.js'
import {
    createOrder
} from '../services/razorpay.service.js'

// Create campaign payment order

export const createCampaignPaymentOrder = async (req, res) => {
    try {
        const user = req.user

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            })
        }

        const campaignId = Number(req.params.campaignId)

        const campaign = await Campaign.findByPk(campaignId)

        if (!campaign) {
            return res.status(404).json({
                success: false,
                message: 'Campaign not found'
            })
        }

        const brandId = Number(user.userId)

        // Replace this with your actual campaign price field
        const amountRupees = Number(campaign.budget)

        if (!amountRupees || amountRupees <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid campaign amount'
            })
        }

        const amount = Math.round(amountRupees * 100)

        // Example platform fee = 10%
        const platformFee = Math.round(amount * 0.10)

        const creatorAmount = amount - platformFee

        const existingPayment =
            await CampaignPayment.findOne({
                where: {
                    campaignId,
                    brandId,
                    status: [
                        'PENDING',
                        'AUTHORIZED',
                        'CAPTURED',
                        'ESCROW_LOCKED'
                    ]
                }
            })

        if (existingPayment) {
            return res.status(200).json({
                success: true,
                message: 'Payment already exists',
                data: existingPayment
            })
        }

        const payment = await CampaignPayment.create({
            campaignId,
            brandId,
            creatorId: Number(campaign.creatorId),
            amount,
            currency: 'INR',
            platformFee,
            creatorAmount,
            status: 'PENDING'
        })

        const order = await createOrder({
            amount,
            receipt: `campaign_${campaignId}_payment_${payment.id}`,
            notes: {
                campaignId: String(campaignId),
                paymentId: String(payment.id),
                brandId: String(brandId)
            }
        })

        await payment.update({
            razorpayOrderId: order.id
        })

        return res.status(201).json({
            success: true,
            message: 'Razorpay order created',
            data: {
                paymentId: payment.id,
                orderId: order.id,
                amount: order.amount,
                currency: order.currency,
                key: process.env.RAZORPAY_KEY_ID
            }
        })
    } catch (error) {
        console.error(
            'createCampaignPaymentOrder:',
            error
        )

        return res.status(500).json({
            success: false,
            message: 'Unable to create payment order'
        })
    }
}

// Verify payment
export const verifyCampaignPayment = async (
    req,
    res
) => {
    try {
        const {
            paymentId,
            razorpayOrderId,
            razorpaySignature
        } = req.body

        if (
            !paymentId ||
            !razorpayOrderId ||
            !razorpaySignature
        ) {
            return res.status(400).json({
                success: false,
                message: 'Payment verification data missing'
            })
        }

        const payment =
            await CampaignPayment.findOne({
                where: {
                    razorpayOrderId
                }
            })

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Campaign payment not found'
            })
        }

        const valid =
            verifyPaymentSignature({
                orderId: razorpayOrderId,
                paymentId,
                signature: razorpaySignature
            })

        if (!valid) {
            return res.status(400).json({
                success: false,
                message: 'Invalid payment signature'
            })
        }

        const razorpayPayment =
            await fetchPayment(paymentId)

        if (razorpayPayment.status !== 'captured') {
            return res.status(400).json({
                success: false,
                message: `Payment is ${razorpayPayment.status}`
            })
        }

        await payment.update({
            razorpayPaymentId: paymentId,
            status: 'ESCROW_LOCKED',
            escrowLockedAt: new Date()
        })

        return res.status(200).json({
            success: true,
            message: 'Payment verified and locked in escrow',
            data: {
                paymentId: payment.id,
                status: 'ESCROW_LOCKED',
                razorpayPaymentId: paymentId
            }
        })
    } catch (error) {
        console.error(
            'verifyCampaignPayment:',
            error
        )

        return res.status(500).json({
            success: false,
            message: 'Payment verification failed'
        })
    }
}

// Release escrow to creator
export const releaseEscrow = async (req, res) => {
    try {
        const user = req.user

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            })
        }

        const paymentId =
            Number(req.params.paymentId)

        const payment =
            await CampaignPayment.findByPk(paymentId)

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found'
            })
        }

        if (payment.status !== 'ESCROW_LOCKED') {
            return res.status(400).json({
                success: false,
                message: `Payment cannot be released from ${payment.status}`
            })
        }

        if (!payment.razorpayPaymentId) {
            return res.status(400).json({
                success: false,
                message: 'Razorpay payment ID missing'
            })
        }

        if (!payment.razorpayLinkedAccountId) {
            return res.status(400).json({
                success: false,
                message: 'Creator Razorpay linked account is not configured'
            })
        }

        await payment.update({
            status: 'RELEASE_PENDING'
        })

        try {
            const transfer =
                await createTransfer({
                    paymentId:
                        payment.razorpayPaymentId,

                    accountId:
                        payment.razorpayLinkedAccountId,

                    amount:
                        payment.creatorAmount,

                    notes: {
                        campaignId:
                            String(payment.campaignId),

                        paymentId:
                            String(payment.id)
                    }
                })

            const transferEntity =
                transfer.items?.[0]

            await payment.update({
                razorpayTransferId:
                    transferEntity?.id || null,

                status:
                    transferEntity?.status === 'processed'
                        ? 'RELEASED'
                        : 'RELEASE_PENDING',

                releasedAt:
                    transferEntity?.status === 'processed'
                        ? new Date()
                        : null,

                completionVerifiedAt:
                    new Date()
            })

            return res.status(200).json({
                success: true,
                message: 'Escrow release initiated',
                data: {
                    paymentId: payment.id,
                    transferId:
                        transferEntity?.id,
                    status: payment.status,
                    amount:
                        payment.creatorAmount
                }
            })
        } catch (transferError) {
            await payment.update({
                status: 'ESCROW_LOCKED'
            })

            throw transferError
        }
    } catch (error) {
        console.error(
            'releaseEscrow:',
            error
        )

        return res.status(500).json({
            success: false,
            message: 'Unable to release escrow'
        })
    }
}

// Refund API
export const refundCampaignPayment = async (
    req,
    res
) => {
    try {
        const paymentId =
            Number(req.params.paymentId)

        const {
            amount,
            reason
        } = req.body

        const payment =
            await CampaignPayment.findByPk(paymentId)

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found'
            })
        }

        if (
            ![
                'ESCROW_LOCKED',
                'CAPTURED',
                'DISPUTED'
            ].includes(payment.status)
        ) {
            return res.status(400).json({
                success: false,
                message: 'Payment cannot be refunded'
            })
        }

        if (!payment.razorpayPaymentId) {
            return res.status(400).json({
                success: false,
                message: 'Razorpay payment not found'
            })
        }

        const refundAmount =
            amount
                ? Math.round(Number(amount) * 100)
                : payment.amount

        await payment.update({
            status: 'REFUND_PENDING'
        })

        const refund =
            await refundPayment({
                paymentId:
                    payment.razorpayPaymentId,

                amount:
                    refundAmount,

                notes: {
                    campaignId:
                        String(payment.campaignId),

                    paymentId:
                        String(payment.id),

                    reason:
                        reason || 'Campaign refund'
                }
            })

        const isFullRefund =
            refundAmount >= payment.amount

        await payment.update({
            razorpayRefundId:
                refund.id,

            status:
                isFullRefund
                    ? 'REFUNDED'
                    : 'PARTIALLY_REFUNDED',

            refundedAt:
                new Date()
        })

        return res.status(200).json({
            success: true,
            message: 'Refund initiated',
            data: {
                refundId: refund.id,
                amount: refundAmount,
                status: payment.status
            }
        })
    } catch (error) {
        console.error(
            'refundCampaignPayment:',
            error
        )

        return res.status(500).json({
            success: false,
            message: 'Refund failed'
        })
    }
}

// Dispute API
export const createPaymentDispute = async (
    req,
    res
) => {
    try {
        const paymentId =
            Number(req.params.paymentId)

        const {
            reason,
            description
        } = req.body

        if (!reason) {
            return res.status(400).json({
                success: false,
                message: 'Dispute reason is required'
            })
        }

        const payment =
            await CampaignPayment.findByPk(paymentId)

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found'
            })
        }

        if (
            ![
                'ESCROW_LOCKED',
                'RELEASE_PENDING'
            ].includes(payment.status)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    'Dispute cannot be opened for this payment'
            })
        }

        await payment.update({
            status: 'DISPUTED',

            metadata: {
                ...(payment.metadata || {}),

                dispute: {
                    reason,
                    description,
                    createdAt:
                        new Date().toISOString()
                }
            }
        })

        return res.status(200).json({
            success: true,
            message: 'Dispute opened',
            data: {
                paymentId,
                status: 'DISPUTED'
            }
        })
    } catch (error) {
        console.error(
            'createPaymentDispute:',
            error
        )

        return res.status(500).json({
            success: false,
            message: 'Unable to create dispute'
        })
    }
}

// Escrow status API
export const getEscrowStatus = async (
    req,
    res
) => {
    try {
        const payment =
            await CampaignPayment.findByPk(
                Number(req.params.paymentId)
            )

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found'
            })
        }

        return res.status(200).json({
            success: true,
            data: {
                id: payment.id,
                campaignId:
                    payment.campaignId,

                amount:
                    payment.amount,

                creatorAmount:
                    payment.creatorAmount,

                platformFee:
                    payment.platformFee,

                status:
                    payment.status,

                razorpayOrderId:
                    payment.razorpayOrderId,

                razorpayPaymentId:
                    payment.razorpayPaymentId,

                razorpayTransferId:
                    payment.razorpayTransferId,

                escrowLockedAt:
                    payment.escrowLockedAt,

                completionVerifiedAt:
                    payment.completionVerifiedAt,

                releasedAt:
                    payment.releasedAt,

                refundedAt:
                    payment.refundedAt
            }
        })
    } catch (error) {
        console.error(
            'getEscrowStatus:',
            error
        )

        return res.status(500).json({
            success: false,
            message: 'Unable to fetch escrow status'
        })
    }
}

// Razorpay webhook
export const razorpayWebhook = async (
    req,
    res
) => {
    try {
        const signature =
            req.headers['x-razorpay-signature']

        if (!signature) {
            return res.status(400).json({
                success: false,
                message: 'Webhook signature missing'
            })
        }

        const rawBody =
            req.rawBody

        const valid =
            verifyWebhookSignature(
                rawBody,
                signature
            )

        if (!valid) {
            return res.status(400).json({
                success: false,
                message: 'Invalid webhook signature'
            })
        }

        const event = JSON.parse(
            rawBody.toString()
        )

        console.log(
            'Razorpay webhook:',
            event.event
        )

        switch (event.event) {

            case 'order.paid': {
                const order =
                    event.payload?.order?.entity

                if (!order?.id) break

                const payment =
                    await CampaignPayment.findOne({
                        where: {
                            razorpayOrderId: order.id
                        }
                    })

                if (payment) {
                    await payment.update({
                        status: 'CAPTURED'
                    })
                }

                break
            }

            case 'payment.captured': {
                const razorpayPayment =
                    event.payload?.payment?.entity

                if (!razorpayPayment?.id) break

                const payment =
                    await CampaignPayment.findOne({
                        where: {
                            razorpayPaymentId:
                                razorpayPayment.id
                        }
                    })

                if (payment) {
                    await payment.update({
                        status: 'ESCROW_LOCKED',
                        escrowLockedAt:
                            payment.escrowLockedAt ||
                            new Date()
                    })
                }

                break
            }

            case 'transfer.processed': {
                const transfer =
                    event.payload?.transfer?.entity

                const payment =
                    await CampaignPayment.findOne({
                        where: {
                            razorpayTransferId:
                                transfer?.id
                        }
                    })

                if (payment) {
                    await payment.update({
                        status: 'RELEASED',
                        releasedAt:
                            new Date()
                    })
                }

                break
            }

            case 'payment.failed': {
                const failedPayment =
                    event.payload?.payment?.entity

                if (!failedPayment?.order_id) break

                const payment =
                    await CampaignPayment.findOne({
                        where: {
                            razorpayOrderId:
                                failedPayment.order_id
                        }
                    })

                if (payment) {
                    await payment.update({
                        status: 'FAILED'
                    })
                }

                break
            }

            default:
                console.log(
                    `Unhandled Razorpay event: ${event.event}`
                )
        }

        return res.status(200).json({
            success: true
        })
    } catch (error) {
        console.error(
            'razorpayWebhook:',
            error
        )

        return res.status(500).json({
            success: false
        })
    }
}