import fs from 'node:fs'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { generateLaunchKit } from '../src/brandGenerator'
import { hashPassword } from './auth'
import { PersistentDatabase } from './db'

describe('PersistentDatabase Storage Layer', () => {
  const testDbFile = path.resolve(process.cwd(), 'data', 'test-db.json')

  beforeAll(() => {
    if (fs.existsSync(testDbFile)) {
      fs.unlinkSync(testDbFile)
    }
  })

  afterAll(() => {
    if (fs.existsSync(testDbFile)) {
      fs.unlinkSync(testDbFile)
    }
  })

  it('creates users, hashes passwords, persists to disk, and reloads on startup', async () => {
    const db1 = new PersistentDatabase(testDbFile)
    const salt = 'testsalt123'
    const hash = hashPassword('mypassword', salt)

    const user = await db1.createUser('test@example.com', hash, salt)
    expect(user.id).toBeTruthy()
    expect(user.tier).toBe('free')

    // Update tier
    await db1.updateUserTier(user.id, 'pro', 'cus_123', 'sub_456')
    db1.flushToDisk()

    expect(fs.existsSync(testDbFile)).toBe(true)

    // Reload with fresh instance
    const db2 = new PersistentDatabase(testDbFile)
    const reloaded = await db2.findUserById(user.id)
    expect(reloaded).not.toBeNull()
    expect(reloaded?.email).toBe('test@example.com')
    expect(reloaded?.tier).toBe('pro')
    expect(reloaded?.stripeCustomerId).toBe('cus_123')
  })

  it('performs project and deployment CRUD with user scoping', async () => {
    const db = new PersistentDatabase(null)
    const user1 = await db.createUser('u1@test.com', 'hash1', 'salt1')
    const user2 = await db.createUser('u2@test.com', 'hash2', 'salt2')

    const kit = generateLaunchKit('Angry cat meme coin')
    const project = await db.saveProject(user1.id, kit)

    expect(project.ownerId).toBe(user1.id)
    expect(project.markdown).toContain('# ')

    // user1 can access
    const list1 = await db.listProjects(user1.id)
    expect(list1).toHaveLength(1)

    // user2 cannot access user1 project
    const list2 = await db.listProjects(user2.id)
    expect(list2).toHaveLength(0)

    const unauthorizedGet = await db.getProject(user2.id, project.id)
    expect(unauthorizedGet).toBeNull()

    // Save deployment
    const dep = await db.saveDeployment(user1.id, {
      tokenName: kit.tokenName,
      symbol: kit.primaryTicker,
      network: {
        chainId: 8453,
        name: 'Base Mainnet',
        rpcUrl: 'https://mainnet.base.org',
        explorerUrl: 'https://basescan.org',
      },
      contractAddress: '0x1234567890123456789012345678901234567890',
      txHash: '0xabcdef',
      deployerAddress: '0xdeployer',
    })
    expect(dep.contractAddress).toBe('0x1234567890123456789012345678901234567890')

    const deployments = await db.listDeployments(user1.id)
    expect(deployments).toHaveLength(1)
  })
})
