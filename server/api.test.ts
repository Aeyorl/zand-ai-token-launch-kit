import type { Server } from 'node:http'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createApp } from './app'
import { PersistentDatabase, setDatabase } from './db'

describe('Full Backend API Integration Suite', () => {
  let server: Server
  let baseUrl: string
  let testDb: PersistentDatabase

  beforeAll(async () => {
    testDb = new PersistentDatabase(null)
    setDatabase(testDb)
    const app = createApp()

    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const addr = server.address()
        if (addr && typeof addr === 'object') {
          baseUrl = `http://127.0.0.1:${addr.port}`
        }
        resolve()
      })
    })
  })

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve())
    })
  })

  it('GET /api/health returns healthy system status and feature config', async () => {
    const res = await fetch(`${baseUrl}/api/health`)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.status).toBe('healthy')
    expect(data.features).toBeDefined()
    expect(data.features.database.type).toBe('persistent-json')
  })

  it('handles auth lifecycle: register, login, me, and rejects invalid tokens', async () => {
    // 1. Register
    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'founder@zand.ai', password: 'super-secure-password' }),
    })
    expect(regRes.status).toBe(201)
    const regData = await regRes.json()
    expect(regData.user.email).toBe('founder@zand.ai')
    expect(regData.user.tier).toBe('free')
    expect(regData.token).toBeTruthy()

    // 2. Reject duplicate email
    const dupRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'founder@zand.ai', password: 'another-password' }),
    })
    expect(dupRes.status).toBe(409)

    // 3. Login
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'founder@zand.ai', password: 'super-secure-password' }),
    })
    expect(loginRes.status).toBe(200)
    const loginData = await loginRes.json()
    expect(loginData.token).toBeTruthy()
    const authToken = loginData.token

    // 4. GET /api/auth/me with Bearer token
    const meRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${authToken}` },
    })
    expect(meRes.status).toBe(200)
    const meData = await meRes.json()
    expect(meData.user.email).toBe('founder@zand.ai')

    // 5. Reject invalid token
    const badAuthRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: 'Bearer invalid.fake.token' },
    })
    expect(badAuthRes.status).toBe(401)
  })

  it('generates launch kits and high quality logo and banner assets', async () => {
    // Generate launch kit
    const genRes = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'Angry billionaire cat that hates Wall Street.' }),
    })
    expect(genRes.status).toBe(200)
    const genData = await genRes.json()
    expect(genData.kit.tokenName).toBe('WallStreet Claw')
    expect(genData.kit.primaryTicker).toBe('$CLAW')

    // Generate Logo (1:1 SVG vector)
    const logoRes = await fetch(`${baseUrl}/api/images/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kit: genData.kit, type: 'logo' }),
    })
    expect(logoRes.status).toBe(200)
    const logoData = await logoRes.json()
    expect(logoData.type).toBe('logo')
    expect(logoData.kind).toBe('svg')
    expect(logoData.url).toMatch(/^data:image\/svg\+xml;base64,/)
    expect(logoData.svgContent).toContain('<svg')

    // Generate Banner (3:1 SVG header)
    const bannerRes = await fetch(`${baseUrl}/api/images/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kit: genData.kit, type: 'banner' }),
    })
    expect(bannerRes.status).toBe(200)
    const bannerData = await bannerRes.json()
    expect(bannerData.type).toBe('banner')
    expect(bannerData.kind).toBe('svg')
    expect(bannerData.url).toMatch(/^data:image\/svg\+xml;base64,/)
    expect(bannerData.svgContent).toContain('DEPLOYED ON')
  })

  it('supports complete saved project CRUD for authenticated users', async () => {
    // Login to get token
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'founder@zand.ai', password: 'super-secure-password' }),
    })
    const { token } = await loginRes.json()

    // 1. Generate kit
    const genRes = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'Frog trader who only buys green candles and roasts paper hands.' }),
    })
    const { kit } = await genRes.json()

    // 2. Save project
    const saveRes = await fetch(`${baseUrl}/api/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ kit }),
    })
    expect(saveRes.status).toBe(201)
    const { project } = await saveRes.json()
    expect(project.id).toBeTruthy()
    expect(project.tokenName).toBe(kit.tokenName)

    // 3. List projects
    const listRes = await fetch(`${baseUrl}/api/projects`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(listRes.status).toBe(200)
    const listData = await listRes.json()
    expect(listData.projects.length).toBeGreaterThanOrEqual(1)

    // 4. Get single project
    const getRes = await fetch(`${baseUrl}/api/projects/${project.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(getRes.status).toBe(200)
    const singleData = await getRes.json()
    expect(singleData.project.id).toBe(project.id)

    // 5. Update project
    const modifiedKit = { ...kit, tokenName: 'Super Frog Ribbit' }
    const putRes = await fetch(`${baseUrl}/api/projects/${project.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ kit: modifiedKit }),
    })
    expect(putRes.status).toBe(200)
    const updatedData = await putRes.json()
    expect(updatedData.project.tokenName).toBe('Super Frog Ribbit')

    // 6. Delete project
    const delRes = await fetch(`${baseUrl}/api/projects/${project.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(delRes.status).toBe(200)
  })

  it('creates Stripe checkout and customer portal sessions', async () => {
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'founder@zand.ai', password: 'super-secure-password' }),
    })
    const { token } = await loginRes.json()

    // Create checkout session for Pro
    const checkoutRes = await fetch(`${baseUrl}/api/checkout/create-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ tier: 'pro' }),
    })
    expect(checkoutRes.status).toBe(200)
    const checkoutData = await checkoutRes.json()
    expect(checkoutData.url).toContain('tier=pro')

    // Portal session
    const portalRes = await fetch(`${baseUrl}/api/checkout/portal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({}),
    })
    expect(portalRes.status).toBe(200)
    const portalData = await portalRes.json()
    expect(portalData.url).toBeTruthy()
  })

  it('prepares token deployment plans, validates parameters, and records deployed contracts', async () => {
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'founder@zand.ai', password: 'super-secure-password' }),
    })
    const { token } = await loginRes.json()

    const genRes = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'Angry billionaire cat that hates Wall Street.' }),
    })
    const { kit } = await genRes.json()

    // 1. Prepare deployment plan
    const planRes = await fetch(`${baseUrl}/api/deploy/prepare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kit,
        networkKey: 'base-mainnet',
        deployerAddress: '0x1111111111111111111111111111111111111111',
      }),
    })
    expect(planRes.status).toBe(200)
    const { plan } = await planRes.json()
    expect(plan.contractName).toBe('WallStreetClawToken')
    expect(plan.solidity).toContain('contract WallStreetClawToken is Context, IERC20, Ownable')
    expect(plan.network.chainId).toBe(8453)
    expect(plan.checklist.length).toBeGreaterThan(3)

    // 2. Simulate deployment check
    const simRes = await fetch(`${baseUrl}/api/deploy/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deployerAddress: '0x1111111111111111111111111111111111111111',
        networkKey: 'base-mainnet',
      }),
    })
    expect(simRes.status).toBe(200)
    const simData = await simRes.json()
    expect(simData.valid).toBe(true)

    // 3. Record deployment
    const recordRes = await fetch(`${baseUrl}/api/deploy/record`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        tokenName: kit.tokenName,
        symbol: kit.primaryTicker,
        network: plan.network,
        contractAddress: '0x2222222222222222222222222222222222222222',
        txHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        deployerAddress: '0x1111111111111111111111111111111111111111',
      }),
    })
    expect(recordRes.status).toBe(201)
    const recordData = await recordRes.json()
    expect(recordData.deployment.contractAddress).toBe('0x2222222222222222222222222222222222222222')

    // 4. List deployments
    const historyRes = await fetch(`${baseUrl}/api/deploy/history`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(historyRes.status).toBe(200)
    const historyData = await historyRes.json()
    expect(historyData.deployments.length).toBe(1)
  })
})
