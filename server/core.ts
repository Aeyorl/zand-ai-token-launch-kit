import { exportLaunchKitMarkdown, generateLaunchKit, type LaunchKit } from '../src/brandGenerator'

export type User = {
  id: string
  email: string
  passwordHash: string
  createdAt: string
}

export type UserSession = {
  user: Omit<User, 'passwordHash'>
  token: string
}

export type SavedProject = {
  id: string
  ownerId: string
  kit: LaunchKit
  markdown: string
  createdAt: string
  updatedAt: string
}

export type ImageAsset = {
  kind: 'svg' | 'remote'
  url: string
  prompt: string
}

export type CheckoutSession = {
  id: string
  url: string
  mode: 'subscription'
  priceId: string
}

export type TokenDeploymentPlan = {
  contractName: string
  network: {
    chainId: number
    rpcUrl: string
    deployerAddress: string
  }
  constructorArgs: [string, string, string]
  solidity: string
  checklist: string[]
}

const now = () => new Date().toISOString()

const toHash = async (value: string) => {
  const encoded = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest('SHA-256', encoded)
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

const randomId = (prefix: string) => `${prefix}_${crypto.randomUUID().replace(/-/g, '').slice(0, 18)}`

const base64Url = (value: string) => btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')

export class InMemoryDatabase {
  private users = new Map<string, User>()
  private usersByEmail = new Map<string, string>()
  private projects = new Map<string, SavedProject>()

  async createUser(email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedEmail.includes('@')) {
      throw new Error('A valid email address is required')
    }
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters')
    }
    const existingUserId = this.usersByEmail.get(normalizedEmail)
    if (existingUserId) {
      const existing = this.users.get(existingUserId)
      if (!existing) throw new Error('User index is out of sync')
      return existing
    }

    const user: User = {
      id: randomId('user'),
      email: normalizedEmail,
      passwordHash: await toHash(password),
      createdAt: now(),
    }
    this.users.set(user.id, user)
    this.usersByEmail.set(normalizedEmail, user.id)
    return user
  }

  saveProject(ownerId: string, kit: LaunchKit) {
    const timestamp = now()
    const project: SavedProject = {
      id: randomId('project'),
      ownerId,
      kit,
      markdown: exportLaunchKitMarkdown(kit),
      createdAt: timestamp,
      updatedAt: timestamp,
    }
    this.projects.set(project.id, project)
    return project
  }

  projectsForUser(ownerId: string) {
    return Array.from(this.projects.values()).filter((project) => project.ownerId === ownerId)
  }
}

export async function createUserSession(db: InMemoryDatabase, email: string, password: string): Promise<UserSession> {
  const user = await db.createUser(email, password)
  const header = base64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = base64Url(JSON.stringify({ sub: user.id, email: user.email, iat: Math.floor(Date.now() / 1000) }))
  const signature = base64Url((await toHash(`${header}.${payload}.${user.passwordHash}`)).slice(0, 32))

  return {
    user: {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
    },
    token: `${header}.${payload}.${signature}`,
  }
}

export async function runAiBrandGeneration(
  prompt: string,
  options: { apiKey?: string; fallback?: boolean } = {},
): Promise<LaunchKit> {
  if (!options.apiKey || options.fallback) {
    return generateLaunchKit(prompt)
  }

  // Provider hook: production deployments can route this payload to OpenAI/xAI/etc.
  // The deterministic generator remains as a safe fallback so demos never break.
  return generateLaunchKit(prompt)
}

const escapeSvg = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export async function createImageAsset(
  kit: LaunchKit,
  options: { apiKey?: string; fallback?: boolean } = {},
): Promise<ImageAsset> {
  if (options.apiKey && !options.fallback) {
    return {
      kind: 'remote',
      prompt: kit.logoPrompt,
      url: `/api/images/generate?project=${encodeURIComponent(kit.tokenName)}`,
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" role="img" aria-label="${escapeSvg(kit.tokenName)} logo preview">
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#111827"/><stop offset="1" stop-color="#22c55e"/></linearGradient>
    <filter id="glow"><feGaussianBlur stdDeviation="8" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <circle cx="600" cy="265" r="150" fill="#f8fafc" filter="url(#glow)"/>
  <path d="M490 185 L535 95 L575 190 M710 185 L665 95 L625 190" fill="#f8fafc"/>
  <circle cx="545" cy="255" r="20" fill="#111827"/><circle cx="655" cy="255" r="20" fill="#111827"/>
  <path d="M550 335 Q600 380 650 335" fill="none" stroke="#111827" stroke-width="18" stroke-linecap="round"/>
  <text x="600" y="500" text-anchor="middle" font-family="Inter, Arial" font-size="74" font-weight="900" fill="#ffffff">${escapeSvg(kit.tokenName)}</text>
  <text x="600" y="562" text-anchor="middle" font-family="Inter, Arial" font-size="40" font-weight="800" fill="#bbf7d0">${escapeSvg(kit.primaryTicker)} · AI LAUNCH KIT</text>
</svg>`

  return {
    kind: 'svg',
    prompt: kit.logoPrompt,
    url: `data:image/svg+xml;base64,${btoa(svg)}`,
  }
}

export async function createCheckoutSession(options: {
  stripeSecretKey?: string
  baseUrl: string
  userId: string
  priceId: string
  fallback?: boolean
}): Promise<CheckoutSession> {
  const sessionId = randomId('checkout')
  if (options.stripeSecretKey && !options.fallback) {
    return {
      id: sessionId,
      mode: 'subscription',
      priceId: options.priceId,
      url: `${options.baseUrl.replace(/\/$/, '')}/checkout/session/${sessionId}`,
    }
  }

  return {
    id: sessionId,
    mode: 'subscription',
    priceId: options.priceId,
    url: `${options.baseUrl.replace(/\/$/, '')}/checkout/demo?session=${sessionId}&user=${encodeURIComponent(options.userId)}`,
  }
}

const contractIdentifier = (tokenName: string) => `${tokenName.replace(/[^A-Za-z0-9]/g, '') || 'Meme'}Token`

export function createTokenDeploymentPlan(
  kit: LaunchKit,
  network: { chainId: number; rpcUrl: string; deployerAddress: string },
): TokenDeploymentPlan {
  const contractName = contractIdentifier(kit.tokenName)
  const symbol = kit.primaryTicker.replace('$', '')
  const supply = kit.tokenomics.supply.replace(/,/g, '')
  const solidity = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract ${contractName} is ERC20, Ownable {
    constructor(address initialOwner)
        ERC20("${kit.tokenName}", "${symbol}")
        Ownable(initialOwner)
    {
        _mint(initialOwner, ${supply} * 10 ** decimals());
    }
}`

  return {
    contractName,
    network,
    constructorArgs: [kit.tokenName, symbol, network.deployerAddress],
    solidity,
    checklist: [
      'Verify token name, symbol, supply, ownership, and chain before signing.',
      'Use a dedicated deployer wallet with limited funds.',
      'Run a testnet deployment and contract verification first.',
      'Never expose private keys in the app, repo, logs, or chat.',
    ],
  }
}

export function saveLaunchProject(db: InMemoryDatabase, ownerId: string, kit: LaunchKit) {
  return db.saveProject(ownerId, kit)
}
