import Razorpay from 'razorpay'
import crypto from 'crypto'

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
})

export const createOrder = async ({
  amount,
  receipt,
  notes = {}
}) => {
  return razorpay.orders.create({
    amount,
    currency: 'INR',
    receipt,
    partial_payment: false,
    notes
  })
}

export const fetchPayment = async paymentId => {
  return razorpay.payments.fetch(paymentId)
}

export const fetchOrder = async orderId => {
  return razorpay.orders.fetch(orderId)
}

export const refundPayment = async ({
  paymentId,
  amount,
  notes = {}
}) => {
  const payload = {
    notes
  }

  if (amount) {
    payload.amount = amount
  }

  return razorpay.payments.refund(
    paymentId,
    payload
  )
}

export const createTransfer = async ({
  paymentId,
  accountId,
  amount,
  notes = {}
}) => {
  return razorpay.payments.createTransfer(
    paymentId,
    {
      transfers: [
        {
          account: accountId,
          amount,
          currency: 'INR',
          notes
        }
      ]
    }
  )
}

export const verifyPaymentSignature = ({
  orderId,
  paymentId,
  signature
}) => {
  const generatedSignature = crypto
    .createHmac(
      'sha256',
      process.env.RAZORPAY_KEY_SECRET
    )
    .update(`${orderId}|${paymentId}`)
    .digest('hex')

  return generatedSignature === signature
}

export const verifyWebhookSignature = (
  rawBody,
  signature
) => {
  const expectedSignature = crypto
    .createHmac(
      'sha256',
      process.env.RAZORPAY_WEBHOOK_SECRET
    )
    .update(rawBody)
    .digest('hex')

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(signature)
  )
}

export default razorpay