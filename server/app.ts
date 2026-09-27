import fs from 'node:fs'
import path from 'node:path'
import cors from 'cors'
import express, { type Express, type NextFunction, type Request, type Response } from 'express'
import { generateBrandWithAi, getAiProviderStatus } from './aiProvider'
import {
  createJwt,
  generateSalt,
  hashPassword,
  optionalAuth,
  requireAuth,
  sanitizeUser,
  verifyPassword,
} from './auth'
import { getDatabase, type SubscriptionTier } from './db'
import {
  buildDeploymentPlan,
  simulateDeploymentCheck,
  SUPPORTED_NETWORKS,
} from './deployment'
import { generateImageAsset, getImageConfig, type ImageAssetType } from './imageProvider'
import {
  createBillingPortalSession,
  createCheckoutSession,
  getStripeStatus,
  handleStripeWebhookEvent,
} from './stripe'
import {
  auditRobinhoodReadiness,
  buildLiquidityPlan,
  buildSolanaLaunchConfig,
  buildVerificationPayload,
} from './ecosystems'
import { generateTelegramBotPackage } from './telegramBot'

export function createApp(): Express {
  const app = express()
  const db = getDatabase()

  // Configure CORS
  const corsOrigin = process.env.CORS_ORIGIN || '*'
  app.use(
    cors({
      origin: corsOrigin === '*' ? true : corsOrigin.split(','),
      credentials: true,
    }),
  )

  // Stripe webhook route needs raw body for signature verification
  app.post(
    '/api/webhooks/stripe',
    express.raw({ type: 'application/json' }),
    async (req: Request, res: Response): Promise<void> => {
      try {
        const sig = req.headers['stripe-signature'] as string | undefined
        const result = await handleStripeWebhookEvent(req.body as Buffer, sig, db)
        res.json(result)
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Webhook error'
        res.status(400).json({ error: message })
      }
    },
  )

  // Standard JSON and URL encoded body parsing for all other routes
  app.use(express.json({ limit: '10mb' }))
  app.use(express.urlencoded({ extended: true, limit: '10mb' }))

  // Health and System Status
  app.get('/api/health', (_req: Request, res: Response) => {
    const ai = getAiProviderStatus()
    const stripe = getStripeStatus()
    const image = getImageConfig()

    res.json({
      status: 'healthy',
      service: 'zand-ai-backend',
      timestamp: new Date().toISOString(),
      features: {
        ai: {
          configured: ai.configured,
          provider: ai.provider,
          model: ai.model,
        },
        stripe: {
          configured: stripe.configured,
          hasWebhookSecret: stripe.hasWebhookSecret,
        },
        image: {
          configured: Boolean(image.apiKey && image.provider !== 'fallback'),
          provider: image.provider,
        },
        database: {
          type: 'persistent-json',
        },
      },
    })
  })

  // ---------------- AUTH ROUTES ----------------
  app.post('/api/auth/register', async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body || {}
      if (!email || typeof email !== 'string' || !email.includes('@')) {
        res.status(400).json({ error: 'A valid email address is required' })
        return
      }
      if (!password || typeof password !== 'string' || password.length < 8) {
        res.status(400).json({ error: 'Password must be at least 8 characters long' })
        return
      }

      const existing = await db.findUserByEmail(email)
      if (existing) {
        res.status(409).json({ error: 'An account with this email already exists' })
        return
      }

      const salt = generateSalt()
      const passwordHash = hashPassword(password, salt)
      const user = await db.createUser(email, passwordHash, salt)
      const token = createJwt({ sub: user.id, email: user.email, tier: user.tier })

      res.status(201).json({
        user: sanitizeUser(user),
        token,
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed'
      res.status(500).json({ error: msg })
    }
  })

  app.post('/api/auth/login', async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body || {}
      if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required' })
        return
      }

      const user = await db.findUserByEmail(email)
      if (!user) {
        res.status(401).json({ error: 'Invalid email or password' })
        return
      }

      const isValid = verifyPassword(password, user.passwordHash, user.salt)
      if (!isValid) {
        res.status(401).json({ error: 'Invalid email or password' })
        return
      }

      const token = createJwt({ sub: user.id, email: user.email, tier: user.tier })
      res.json({
        user: sanitizeUser(user),
        token,
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed'
      res.status(500).json({ error: msg })
    }
  })

  app.get('/api/auth/me', requireAuth, async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }
    const user = await db.findUserById(req.user.id)
    if (!user) {
      res.status(404).json({ error: 'User not found' })
      return
    }
    res.json({ user: sanitizeUser(user) })
  })

  app.post('/api/auth/logout', (_req: Request, res: Response) => {
    res.json({ success: true, message: 'Logged out successfully' })
  })

  // ---------------- AI LAUNCH KIT GENERATION ----------------
  app.post('/api/generate', optionalAuth, async (req: Request, res: Response): Promise<void> => {
    try {
      const { prompt, provider, model } = req.body || {}
      if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
        res.status(400).json({ error: 'Prompt is required' })
        return
      }

      const kit = await generateBrandWithAi(prompt.trim(), {
        provider,
        model,
      })

      const aiStatus = getAiProviderStatus()
      res.json({
        kit,
        meta: {
          provider: aiStatus.provider,
          model: aiStatus.model,
          isAiPowered: aiStatus.configured,
        },
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Generation failed'
      res.status(500).json({ error: msg })
    }
  })

  // ---------------- IMAGE / LOGO / BANNER GENERATION ----------------
  app.post('/api/images/generate', optionalAuth, async (req: Request, res: Response): Promise<void> => {
    try {
      const { kit, type, forceSvg } = req.body || {}
      if (!kit || typeof kit !== 'object' || !kit.tokenName) {
        res.status(400).json({ error: 'A valid launch kit is required to generate imagery' })
        return
      }

      const assetType: ImageAssetType = type === 'banner' ? 'banner' : 'logo'
      const imageResult = await generateImageAsset(kit, assetType, { forceSvg: Boolean(forceSvg) })

      res.json(imageResult)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Image generation failed'
      res.status(500).json({ error: msg })
    }
  })

  // ---------------- SAVED PROJECTS CRUD ----------------
  app.get('/api/projects', requireAuth, async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }
    const projects = await db.listProjects(req.user.id)
    res.json({ projects })
  })

  app.post('/api/projects', requireAuth, async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }
    const { kit, id } = req.body || {}
    if (!kit || typeof kit !== 'object' || !kit.tokenName) {
      res.status(400).json({ error: 'Valid launch kit required to save project' })
      return
    }

    const project = await db.saveProject(req.user.id, kit, id)
    res.status(201).json({ project })
  })

  app.get('/api/projects/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }
    const project = await db.getProject(req.user.id, req.params.id)
    if (!project) {
      res.status(404).json({ error: 'Project not found' })
      return
    }
    res.json({ project })
  })

  app.put('/api/projects/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }
    const { kit } = req.body || {}
    if (!kit || typeof kit !== 'object') {
      res.status(400).json({ error: 'Kit update payload required' })
      return
    }

    const updated = await db.updateProject(req.user.id, req.params.id, { kit })
    if (!updated) {
      res.status(404).json({ error: 'Project not found' })
      return
    }
    res.json({ project: updated })
  })

  app.delete('/api/projects/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }
    const success = await db.deleteProject(req.user.id, req.params.id)
    if (!success) {
      res.status(404).json({ error: 'Project not found' })
      return
    }
    res.json({ success: true, message: 'Project deleted' })
  })

  // ---------------- STRIPE SUBSCRIPTIONS ----------------
  app.post('/api/checkout/create-session', requireAuth, async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' })
        return
      }

      const { tier, successUrl, cancelUrl } = req.body || {}
      const targetTier = (tier as SubscriptionTier) || 'pro'
      if (targetTier === 'free') {
        res.status(400).json({ error: 'Free tier does not require checkout' })
        return
      }

      const session = await createCheckoutSession({
        userId: req.user.id,
        userEmail: req.user.email,
        tier: targetTier,
        successUrl,
        cancelUrl,
      })

      res.json(session)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create checkout session'
      res.status(500).json({ error: msg })
    }
  })

  app.post('/api/checkout/portal', requireAuth, async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' })
        return
      }

      const user = await db.findUserById(req.user.id)
      const portal = await createBillingPortalSession({
        customerId: user?.stripeCustomerId || '',
        returnUrl: req.body?.returnUrl,
      })

      res.json(portal)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create portal session'
      res.status(500).json({ error: msg })
    }
  })

  // ---------------- TOKEN DEPLOYMENT ----------------
  app.get('/api/deploy/networks', (_req: Request, res: Response) => {
    res.json({ networks: Object.values(SUPPORTED_NETWORKS) })
  })

  app.post('/api/deploy/prepare', optionalAuth, (req: Request, res: Response): void => {
    const { kit, networkKey, deployerAddress } = req.body || {}
    if (!kit || typeof kit !== 'object' || !kit.tokenName) {
      res.status(400).json({ error: 'Valid launch kit required to prepare deployment plan' })
      return
    }

    const plan = buildDeploymentPlan(kit, networkKey, deployerAddress)
    res.json({ plan })
  })

  app.post('/api/deploy/simulate', optionalAuth, (req: Request, res: Response): void => {
    const { deployerAddress, networkKey } = req.body || {}
    if (!deployerAddress || !networkKey) {
      res.status(400).json({ error: 'deployerAddress and networkKey are required for simulation' })
      return
    }

    const result = simulateDeploymentCheck(deployerAddress, networkKey)
    res.json(result)
  })

  app.post('/api/deploy/record', requireAuth, async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' })
        return
      }

      const {
        projectId,
        tokenName,
        symbol,
        network,
        contractAddress,
        txHash,
        deployerAddress,
      } = req.body || {}

      if (!tokenName || !symbol || !network || !contractAddress || !txHash) {
        res.status(400).json({ error: 'Missing required deployment details' })
        return
      }

      const record = await db.saveDeployment(req.user.id, {
        projectId,
        tokenName,
        symbol,
        network,
        contractAddress,
        txHash,
        deployerAddress: deployerAddress || req.user.email,
      })

      res.status(201).json({ deployment: record })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to record deployment'
      res.status(500).json({ error: msg })
    }
  })

  app.get('/api/deploy/history', requireAuth, async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }
    const deployments = await db.listDeployments(req.user.id)
    res.json({ deployments })
  })

  // ---------------- MULTI-CHAIN ECOSYSTEMS (ETHEREUM, SOLANA, ROBINHOOD) ----------------
  app.post('/api/ecosystems/liquidity-plan', optionalAuth, (req: Request, res: Response): void => {
    const { kit, chain, initialEthOrSol, pairedTokenPriceUsd } = req.body || {}
    if (!kit || typeof kit !== 'object' || !kit.tokenName) {
      res.status(400).json({ error: 'Valid launch kit required' })
      return
    }

    const plan = buildLiquidityPlan(kit, chain, { initialEthOrSol, pairedTokenPriceUsd })
    res.json({ plan })
  })

  app.post('/api/ecosystems/robinhood-audit', optionalAuth, (req: Request, res: Response): void => {
    const { kit } = req.body || {}
    if (!kit || typeof kit !== 'object' || !kit.tokenName) {
      res.status(400).json({ error: 'Valid launch kit required' })
      return
    }

    const audit = auditRobinhoodReadiness(kit)
    res.json({ audit })
  })

  app.post('/api/ecosystems/solana-config', optionalAuth, (req: Request, res: Response): void => {
    const { kit } = req.body || {}
    if (!kit || typeof kit !== 'object' || !kit.tokenName) {
      res.status(400).json({ error: 'Valid launch kit required' })
      return
    }

    const config = buildSolanaLaunchConfig(kit)
    res.json({ config })
  })

  app.post('/api/ecosystems/verification-payload', optionalAuth, (req: Request, res: Response): void => {
    const { kit, contractAddress, networkKey } = req.body || {}
    if (!kit || !contractAddress) {
      res.status(400).json({ error: 'kit and contractAddress required' })
      return
    }

    const payload = buildVerificationPayload(kit, contractAddress, networkKey)
    res.json({ payload })
  })

  // ---------------- TELEGRAM COMMUNITY BOT ----------------
  app.post('/api/bot/generate', optionalAuth, (req: Request, res: Response): void => {
    const { kit, ethereumAddress, baseAddress, solanaMint } = req.body || {}
    if (!kit || typeof kit !== 'object' || !kit.tokenName) {
      res.status(400).json({ error: 'Valid launch kit required' })
      return
    }

    const botPackage = generateTelegramBotPackage(kit, {
      ethereumAddress,
      baseAddress,
      solanaMint,
    })
    res.json({ botPackage })
  })

  // ---------------- STATIC ASSET SERVING & SPA FALLBACK ----------------
  const distDir = path.resolve(process.cwd(), 'dist')
  if (fs.existsSync(distDir)) {
    app.use(express.static(distDir))
    app.get(/^(?!\/api).*/, (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'))
    })
  }

  // 404 handler for unmatched API routes
  app.use('/api', (_req: Request, res: Response) => {
    res.status(404).json({ error: 'API route not found' })
  })

  // Global Error Handler
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Unhandled server error:', err)
    const message = err instanceof Error ? err.message : 'Internal Server Error'
    res.status(500).json({ error: message })
  })

  return app
}
