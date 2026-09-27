import fs from 'node:fs'
import path from 'node:path'
import { exportLaunchKitMarkdown, type LaunchKit } from '../src/brandGenerator'

export type SubscriptionTier = 'free' | 'pro' | 'founder'

export type User = {
  id: string
  email: string
  passwordHash: string
  salt: string
  tier: SubscriptionTier
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  createdAt: string
  updatedAt: string
}

export type SavedProject = {
  id: string
  ownerId: string
  tokenName: string
  ticker: string
  kit: LaunchKit
  markdown: string
  createdAt: string
  updatedAt: string
}

export type DeploymentRecord = {
  id: string
  ownerId: string
  projectId?: string
  tokenName: string
  symbol: string
  network: {
    chainId: number
    name: string
    rpcUrl: string
    explorerUrl: string
  }
  contractAddress: string
  txHash: string
  deployerAddress: string
  createdAt: string
}

export interface DatabaseStore {
  createUser(email: string, passwordHash: string, salt: string): Promise<User>
  findUserByEmail(email: string): Promise<User | null>
  findUserById(id: string): Promise<User | null>
  updateUserTier(
    userId: string,
    tier: SubscriptionTier,
    stripeCustomerId?: string,
    stripeSubscriptionId?: string,
  ): Promise<User | null>
  saveProject(ownerId: string, kit: LaunchKit, customId?: string): Promise<SavedProject>
  getProject(ownerId: string, projectId: string): Promise<SavedProject | null>
  listProjects(ownerId: string): Promise<SavedProject[]>
  updateProject(ownerId: string, projectId: string, updates: Partial<{ kit: LaunchKit }>): Promise<SavedProject | null>
  deleteProject(ownerId: string, projectId: string): Promise<boolean>
  saveDeployment(ownerId: string, record: Omit<DeploymentRecord, 'id' | 'ownerId' | 'createdAt'>): Promise<DeploymentRecord>
  listDeployments(ownerId: string): Promise<DeploymentRecord[]>
}

const now = () => new Date().toISOString()
const randomId = (prefix: string) => `${prefix}_${crypto.randomUUID().replace(/-/g, '').slice(0, 18)}`

interface PersistedData {
  users: User[]
  projects: SavedProject[]
  deployments: DeploymentRecord[]
}

export class PersistentDatabase implements DatabaseStore {
  private filePath: string | null
  private users = new Map<string, User>()
  private usersByEmail = new Map<string, string>()
  private projects = new Map<string, SavedProject>()
  private deployments = new Map<string, DeploymentRecord>()
  private saveTimeout: NodeJS.Timeout | null = null

  constructor(filePath: string | null = null) {
    this.filePath = filePath
    if (this.filePath) {
      this.loadFromFile()
    }
  }

  private loadFromFile(): void {
    if (!this.filePath) return
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8')
        const data: PersistedData = JSON.parse(raw)
        if (Array.isArray(data.users)) {
          for (const u of data.users) {
            this.users.set(u.id, u)
            this.usersByEmail.set(u.email.toLowerCase(), u.id)
          }
        }
        if (Array.isArray(data.projects)) {
          for (const p of data.projects) {
            this.projects.set(p.id, p)
          }
        }
        if (Array.isArray(data.deployments)) {
          for (const d of data.deployments) {
            this.deployments.set(d.id, d)
          }
        }
      }
    } catch (err) {
      console.warn('Could not load database file, starting clean:', err)
    }
  }

  private scheduleSave(): void {
    if (!this.filePath) return
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout)
    }
    this.saveTimeout = setTimeout(() => {
      this.flushToDisk()
    }, 50)
  }

  public flushToDisk(): void {
    if (!this.filePath) return
    try {
      const dir = path.dirname(this.filePath)
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
      const data: PersistedData = {
        users: Array.from(this.users.values()),
        projects: Array.from(this.projects.values()),
        deployments: Array.from(this.deployments.values()),
      }
      const tempPath = `${this.filePath}.tmp`
      fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8')
      fs.renameSync(tempPath, this.filePath)
    } catch (err) {
      console.error('Failed to flush database to disk:', err)
    }
  }

  async createUser(email: string, passwordHash: string, salt: string): Promise<User> {
    const normalizedEmail = email.trim().toLowerCase()
    const existingId = this.usersByEmail.get(normalizedEmail)
    if (existingId) {
      const existing = this.users.get(existingId)
      if (existing) return existing
    }

    const timestamp = now()
    const user: User = {
      id: randomId('user'),
      email: normalizedEmail,
      passwordHash,
      salt,
      tier: 'free',
      createdAt: timestamp,
      updatedAt: timestamp,
    }

    this.users.set(user.id, user)
    this.usersByEmail.set(normalizedEmail, user.id)
    this.scheduleSave()
    return user
  }

  async findUserByEmail(email: string): Promise<User | null> {
    const normalizedEmail = email.trim().toLowerCase()
    const id = this.usersByEmail.get(normalizedEmail)
    if (!id) return null
    return this.users.get(id) || null
  }

  async findUserById(id: string): Promise<User | null> {
    return this.users.get(id) || null
  }

  async updateUserTier(
    userId: string,
    tier: SubscriptionTier,
    stripeCustomerId?: string,
    stripeSubscriptionId?: string,
  ): Promise<User | null> {
    const user = this.users.get(userId)
    if (!user) return null
    user.tier = tier
    if (stripeCustomerId) user.stripeCustomerId = stripeCustomerId
    if (stripeSubscriptionId) user.stripeSubscriptionId = stripeSubscriptionId
    user.updatedAt = now()
    this.users.set(userId, user)
    this.scheduleSave()
    return user
  }

  async saveProject(ownerId: string, kit: LaunchKit, customId?: string): Promise<SavedProject> {
    const timestamp = now()
    const project: SavedProject = {
      id: customId || randomId('project'),
      ownerId,
      tokenName: kit.tokenName,
      ticker: kit.primaryTicker,
      kit,
      markdown: exportLaunchKitMarkdown(kit),
      createdAt: timestamp,
      updatedAt: timestamp,
    }
    this.projects.set(project.id, project)
    this.scheduleSave()
    return project
  }

  async getProject(ownerId: string, projectId: string): Promise<SavedProject | null> {
    const project = this.projects.get(projectId)
    if (!project || project.ownerId !== ownerId) return null
    return project
  }

  async listProjects(ownerId: string): Promise<SavedProject[]> {
    return Array.from(this.projects.values())
      .filter((p) => p.ownerId === ownerId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  async updateProject(
    ownerId: string,
    projectId: string,
    updates: Partial<{ kit: LaunchKit }>,
  ): Promise<SavedProject | null> {
    const project = this.projects.get(projectId)
    if (!project || project.ownerId !== ownerId) return null

    if (updates.kit) {
      project.kit = updates.kit
      project.tokenName = updates.kit.tokenName
      project.ticker = updates.kit.primaryTicker
      project.markdown = exportLaunchKitMarkdown(updates.kit)
    }
    project.updatedAt = now()
    this.projects.set(projectId, project)
    this.scheduleSave()
    return project
  }

  async deleteProject(ownerId: string, projectId: string): Promise<boolean> {
    const project = this.projects.get(projectId)
    if (!project || project.ownerId !== ownerId) return false
    this.projects.delete(projectId)
    this.scheduleSave()
    return true
  }

  async saveDeployment(
    ownerId: string,
    record: Omit<DeploymentRecord, 'id' | 'ownerId' | 'createdAt'>,
  ): Promise<DeploymentRecord> {
    const deployment: DeploymentRecord = {
      ...record,
      id: randomId('deploy'),
      ownerId,
      createdAt: now(),
    }
    this.deployments.set(deployment.id, deployment)
    this.scheduleSave()
    return deployment
  }

  async listDeployments(ownerId: string): Promise<DeploymentRecord[]> {
    return Array.from(this.deployments.values())
      .filter((d) => d.ownerId === ownerId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }
}

let defaultDb: PersistentDatabase | null = null

export function getDatabase(): PersistentDatabase {
  if (!defaultDb) {
    const dbPath =
      process.env.NODE_ENV === 'test' && !process.env.TEST_PERSIST_DB
        ? null
        : process.env.DATABASE_FILE || path.resolve(process.cwd(), 'data', 'db.json')
    defaultDb = new PersistentDatabase(dbPath)
  }
  return defaultDb
}

export function setDatabase(db: PersistentDatabase): void {
  defaultDb = db
}
