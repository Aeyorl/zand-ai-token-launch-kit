import { describe, expect, it } from 'vitest'
import {
  createCheckoutSession,
  createImageAsset,
  createTokenDeploymentPlan,
  createUserSession,
  InMemoryDatabase,
  runAiBrandGeneration,
  saveLaunchProject,
} from './core'

describe('full product backend core', () => {
  it('registers users, saves generated projects, and keeps ownership boundaries', async () => {
    const db = new InMemoryDatabase()
    const session = await createUserSession(db, 'aeyo@example.com', 'strong-password')
    const kit = await runAiBrandGeneration('Angry billionaire cat that hates Wall Street.', {
      apiKey: '',
      fallback: true,
    })

    const saved = await saveLaunchProject(db, session.user.id, kit)

    expect(session.token).toContain('.')
    expect(saved.ownerId).toBe(session.user.id)
    expect(db.projectsForUser(session.user.id)).toHaveLength(1)
    expect(db.projectsForUser('other-user')).toHaveLength(0)
  })

  it('creates real integration payloads for AI images, payments, and token deployment', async () => {
    const kit = await runAiBrandGeneration('Angry billionaire cat that hates Wall Street.', {
      apiKey: '',
      fallback: true,
    })

    const image = await createImageAsset(kit, { apiKey: '', fallback: true })
    const checkout = await createCheckoutSession({
      stripeSecretKey: '',
      baseUrl: 'https://example.com',
      userId: 'user_1',
      priceId: 'price_test',
      fallback: true,
    })
    const deployment = createTokenDeploymentPlan(kit, {
      chainId: 8453,
      rpcUrl: 'https://base.example/rpc',
      deployerAddress: '0x0000000000000000000000000000000000000001',
    })

    expect(image.kind).toBe('svg')
    expect(image.url).toMatch(/^data:image\/svg\+xml/)
    expect(checkout.url).toContain('checkout')
    expect(deployment.contractName).toBe('WallStreetClawToken')
    expect(deployment.solidity).toContain('contract WallStreetClawToken')
    expect(deployment.network.chainId).toBe(8453)
  })
})
