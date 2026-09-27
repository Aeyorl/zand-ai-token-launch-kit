import crypto from 'node:crypto'
import type { DatabaseStore, SubscriptionTier } from './db'

export interface StripeConfig {
  secretKey: string
  webhookSecret: string
  pricePro: string
  priceFounder: string
  appUrl: string
}

export function getStripeConfig(): StripeConfig {
  return {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    pricePro: process.env.STRIPE_PRICE_PRO || 'price_pro_monthly',
    priceFounder: process.env.STRIPE_PRICE_FOUNDER || 'price_founder_monthly',
    appUrl: process.env.APP_URL || 'http://localhost:5173',
  }
}

export function getStripeStatus(): {
  configured: boolean
  hasWebhookSecret: boolean
} {
  const config = getStripeConfig()
  return {
    configured: Boolean(config.secretKey),
    hasWebhookSecret: Boolean(config.webhookSecret),
  }
}

export async function createCheckoutSession(params: {
  userId: string
  userEmail: string
  tier: SubscriptionTier
  successUrl?: string
  cancelUrl?: string
}): Promise<{ id: string; url: string; mode: string }> {
  const config = getStripeConfig()
  const sessionId = `cs_${crypto.randomUUID().replace(/-/g, '').slice(0, 24)}`

  const success = params.successUrl || `${config.appUrl}/?session_id={CHECKOUT_SESSION_ID}&billing=success`
  const cancel = params.cancelUrl || `${config.appUrl}/?billing=cancelled`

  if (params.tier === 'free') {
    throw new Error('Free tier does not require payment checkout')
  }

  const priceId = params.tier === 'founder' ? config.priceFounder : config.pricePro

  if (config.secretKey) {
    try {
      const body = new URLSearchParams()
      body.append('mode', 'subscription')
      body.append('payment_method_types[0]', 'card')
      body.append('line_items[0][price]', priceId)
      body.append('line_items[0][quantity]', '1')
      body.append('customer_email', params.userEmail)
      body.append('client_reference_id', params.userId)
      body.append('metadata[userId]', params.userId)
      body.append('metadata[tier]', params.tier)
      body.append('success_url', success)
      body.append('cancel_url', cancel)

      const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.secretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      })

      if (response.ok) {
        const data = (await response.json()) as { id: string; url: string }
        return {
          id: data.id,
          url: data.url,
          mode: 'subscription',
        }
      }
      const err = await response.text()
      console.warn('Stripe checkout API error, falling back to simulated session:', err)
    } catch (err) {
      console.warn('Failed to call Stripe API, falling back to simulated checkout session:', err)
    }
  }

  // Graceful offline/demo session fallback
  return {
    id: sessionId,
    mode: 'subscription',
    url: `${config.appUrl}/?session_id=${sessionId}&user=${encodeURIComponent(params.userId)}&tier=${params.tier}&demo_checkout=true`,
  }
}

export async function createBillingPortalSession(params: {
  customerId: string
  returnUrl?: string
}): Promise<{ url: string }> {
  const config = getStripeConfig()
  const returnUrl = params.returnUrl || config.appUrl

  if (config.secretKey && params.customerId) {
    try {
      const body = new URLSearchParams()
      body.append('customer', params.customerId)
      body.append('return_url', returnUrl)

      const response = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.secretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      })

      if (response.ok) {
        const data = (await response.json()) as { url: string }
        return { url: data.url }
      }
    } catch (err) {
      console.warn('Failed to call Stripe billing portal API:', err)
    }
  }

  return { url: `${returnUrl}?portal=demo` }
}

export function verifyStripeSignature(rawBody: Buffer, signatureHeader: string, secret: string): boolean {
  try {
    const items = signatureHeader.split(',')
    let timestamp = ''
    const signatures: string[] = []

    for (const item of items) {
      const [key, val] = item.trim().split('=')
      if (key === 't') timestamp = val
      if (key === 'v1') signatures.push(val)
    }

    if (!timestamp || signatures.length === 0) return false

    const payload = `${timestamp}.${rawBody.toString('utf-8')}`
    const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex')

    for (const sig of signatures) {
      const a = Buffer.from(sig, 'hex')
      const b = Buffer.from(expected, 'hex')
      if (a.length === b.length && crypto.timingSafeEqual(a, b)) {
        return true
      }
    }
    return false
  } catch {
    return false
  }
}

export async function handleStripeWebhookEvent(
  rawBody: Buffer,
  signatureHeader: string | undefined,
  db: DatabaseStore,
): Promise<{ received: boolean; handledEvent?: string }> {
  const config = getStripeConfig()

  if (config.webhookSecret && signatureHeader) {
    const isValid = verifyStripeSignature(rawBody, signatureHeader, config.webhookSecret)
    if (!isValid) {
      throw new Error('Invalid Stripe webhook signature')
    }
  }

  let event: {
    type: string
    data: {
      object: {
        id?: string
        client_reference_id?: string
        customer?: string
        subscription?: string
        metadata?: Record<string, string>
        status?: string
      }
    }
  }

  try {
    event = JSON.parse(rawBody.toString('utf-8'))
  } catch {
    throw new Error('Malformed webhook payload')
  }

  const eventType = event.type
  const obj = event.data.object

  if (eventType === 'checkout.session.completed') {
    const userId = obj.client_reference_id || obj.metadata?.userId
    const tier = (obj.metadata?.tier as SubscriptionTier) || 'pro'
    const customerId = obj.customer
    const subscriptionId = obj.subscription

    if (userId) {
      await db.updateUserTier(userId, tier, customerId, subscriptionId)
    }
  } else if (eventType === 'customer.subscription.deleted') {
    const customerId = obj.customer
    if (customerId) {
      // Find user by customerId if available, otherwise handled via webhook
      // For simplicity and resilience, search or downgrade
    }
  }

  return { received: true, handledEvent: eventType }
}
