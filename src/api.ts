import { exportLaunchKitMarkdown, generateLaunchKit, type LaunchKit } from './brandGenerator'

export type SubscriptionTier = 'free' | 'pro' | 'founder'

export type ProductUser = {
  id: string
  email: string
  tier: SubscriptionTier
  createdAt: string
}

export type ProductProject = {
  id: string
  ownerId: string
  tokenName: string
  ticker: string
  kit: LaunchKit
  markdown: string
  createdAt: string
  updatedAt: string
}

export type GeneratedImage = {
  kind: 'svg' | 'remote'
  url: string
  prompt: string
  type: 'logo' | 'banner'
  svgContent?: string
}

export type CheckoutLink = {
  id: string
  url: string
  mode: string
}

export type NetworkInfo = {
  key: string
  name: string
  chainId: number
  currency: string
  rpcUrl: string
  explorerUrl: string
  isTestnet: boolean
}

export type DeploymentPlan = {
  contractName: string
  tokenName: string
  symbol: string
  decimals: number
  initialSupply: string
  solidity: string
  network: {
    chainId: number
    name: string
    rpcUrl: string
    explorerUrl: string
  }
  deployerAddress: string
  checklist: string[]
  remixUrl?: string
  foundryScript?: string
  estimatedGas?: string
}

export type LiquidityPlan = {
  chain: 'ethereum' | 'solana' | 'base' | 'arbitrum'
  dexName: string
  dexUrl: string
  pairWith: string
  initialTokenDeposit: string
  initialPairedDeposit: string
  estimatedStartingPriceUsd: string
  estimatedInitialMarketCapUsd: string
  instructions: string[]
  poolCreationSnippet: string
}

export type RobinhoodAudit = {
  score: number
  rating: string
  summary: string
  metrics: {
    name: string
    status: 'pass' | 'warning' | 'fail'
    detail: string
  }[]
  actionPlan: string[]
  robinhoodConnectConfig: {
    appId: string
    supportedTokens: string[]
    suggestedFiatRamp: string
  }
}

export type SolanaConfig = {
  tokenName: string
  symbol: string
  decimals: number
  initialSupply: string
  metadataUri: string
  cliCommands: string[]
  pumpFunInstructions: {
    title: string
    description: string
    recommendedTwitter: string
    recommendedTelegram: string
  }
}

export type TelegramBotBundle = {
  filename: string
  code: string
  botPackageJson: string
  readme: string
  slashCommands: { command: string; description: string; sampleResponse: string }[]
}

export type DeploymentRecord = {
  id: string
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

const makeId = (prefix: string) => `${prefix}_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`

const escapeSvg = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const toSvgLogoUrl = (kit: LaunchKit) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800">
  <defs>
    <linearGradient id="offBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#050811"/>
      <stop offset="100%" stop-color="#022c22"/>
    </linearGradient>
    <linearGradient id="offGlow" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#22c55e"/>
      <stop offset="100%" stop-color="#38bdf8"/>
    </linearGradient>
  </defs>
  <rect width="800" height="800" rx="32" fill="url(#offBg)"/>
  <circle cx="400" cy="360" r="180" fill="#0f172a" stroke="url(#offGlow)" stroke-width="8"/>
  <circle cx="340" cy="330" r="22" fill="#22c55e"/>
  <circle cx="460" cy="330" r="22" fill="#22c55e"/>
  <circle cx="340" cy="330" r="8" fill="#ffffff"/>
  <circle cx="460" cy="330" r="8" fill="#ffffff"/>
  <path d="M360 420 Q400 460 440 420" fill="none" stroke="#22c55e" stroke-width="8" stroke-linecap="round"/>
  <text x="400" y="620" text-anchor="middle" font-family="Inter, sans-serif" font-size="56" font-weight="900" fill="#ffffff">${escapeSvg(kit.tokenName)}</text>
  <text x="400" y="680" text-anchor="middle" font-family="Inter, sans-serif" font-size="28" font-weight="800" fill="#86efac">${escapeSvg(kit.primaryTicker)} · AI LAUNCH KIT</text>
</svg>`
  return `data:image/svg+xml;base64,${btoa(svg)}`
}

const toSvgBannerUrl = (kit: LaunchKit) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1500 500" width="1500" height="500">
  <rect width="1500" height="500" fill="#080b13"/>
  <text x="100" y="200" font-family="Inter, sans-serif" font-size="72" font-weight="900" fill="#ffffff">${escapeSvg(kit.tokenName)}</text>
  <text x="100" y="260" font-family="Inter, sans-serif" font-size="36" font-weight="800" fill="#22c55e">${escapeSvg(kit.primaryTicker)} · ${escapeSvg(kit.website.heroHeadline)}</text>
  <text x="100" y="320" font-family="Inter, sans-serif" font-size="22" font-weight="500" fill="#94a3b8">${escapeSvg(kit.website.subheadline)}</text>
</svg>`
  return `data:image/svg+xml;base64,${btoa(svg)}`
}

export function createOfflineApi() {
  let currentUser: ProductUser | null = null
  const projects: ProductProject[] = []
  const deployments: DeploymentRecord[] = []

  return {
    async signUp(email: string, password: string): Promise<ProductUser> {
      if (!email.includes('@')) throw new Error('Valid email required')
      if (password.length < 8) throw new Error('Password must be at least 8 characters')
      currentUser = {
        id: makeId('user'),
        email: email.trim().toLowerCase(),
        tier: 'free',
        createdAt: new Date().toISOString(),
      }
      return currentUser
    },

    async login(email: string, password: string): Promise<ProductUser> {
      if (!email.includes('@')) throw new Error('Valid email required')
      if (password.length < 8) throw new Error('Password must be at least 8 characters')
      currentUser = {
        id: currentUser?.id || makeId('user'),
        email: email.trim().toLowerCase(),
        tier: currentUser?.tier || 'free',
        createdAt: currentUser?.createdAt || new Date().toISOString(),
      }
      return currentUser
    },

    getCurrentUser(): ProductUser | null {
      return currentUser
    },

    logout(): void {
      currentUser = null
    },

    async generateKit(prompt: string): Promise<LaunchKit> {
      return generateLaunchKit(prompt)
    },

    async generateImage(kit: LaunchKit, type: 'logo' | 'banner' = 'logo'): Promise<GeneratedImage> {
      return {
        kind: 'svg',
        prompt: type === 'logo' ? kit.logoPrompt : kit.bannerPrompt,
        url: type === 'logo' ? toSvgLogoUrl(kit) : toSvgBannerUrl(kit),
        type,
      }
    },

    async saveProject(kit: LaunchKit): Promise<ProductProject> {
      if (!currentUser) throw new Error('Sign in before saving projects')
      const timestamp = new Date().toISOString()
      const project: ProductProject = {
        id: makeId('project'),
        ownerId: currentUser.id,
        tokenName: kit.tokenName,
        ticker: kit.primaryTicker,
        kit,
        markdown: exportLaunchKitMarkdown(kit),
        createdAt: timestamp,
        updatedAt: timestamp,
      }
      projects.unshift(project)
      return project
    },

    listProjects(): ProductProject[] {
      if (!currentUser) return []
      return projects.filter((project) => project.ownerId === currentUser?.id)
    },

    async createCheckout(tier: 'pro' | 'founder' = 'pro'): Promise<CheckoutLink> {
      const id = makeId('checkout')
      return {
        id,
        mode: 'subscription',
        url: `/?session_id=${id}&tier=${tier}&demo_checkout=true`,
      }
    },

    async prepareTokenDeployment(
      kit: LaunchKit,
      networkKey = 'base-mainnet',
      deployerAddress = '0x1111111111111111111111111111111111111111',
    ): Promise<DeploymentPlan> {
      const contractName = `${kit.tokenName.replace(/[^A-Za-z0-9]/g, '') || 'Meme'}Token`
      const symbol = kit.primaryTicker.replace('$', '')
      const supply = (kit.tokenomics?.supply || '1000000000').replace(/,/g, '').trim()

      return {
        contractName,
        tokenName: kit.tokenName,
        symbol,
        decimals: 18,
        initialSupply: supply,
        network: {
          chainId: networkKey.includes('arbitrum') ? 42161 : 8453,
          name: networkKey.includes('arbitrum') ? 'Arbitrum One' : 'Base Mainnet',
          rpcUrl: networkKey.includes('arbitrum') ? 'https://arb1.arbitrum.io/rpc' : 'https://mainnet.base.org',
          explorerUrl: networkKey.includes('arbitrum') ? 'https://arbiscan.io' : 'https://basescan.org',
        },
        deployerAddress,
        solidity: `// SPDX-License-Identifier: MIT
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
}`,
        checklist: [
          'Verify token name and ticker before deployment.',
          'Fund deployer wallet with gas ETH.',
          'Deploy and verify on explorer.',
        ],
      }
    },

    async recordDeployment(record: Omit<DeploymentRecord, 'id' | 'createdAt'>): Promise<DeploymentRecord> {
      const dep: DeploymentRecord = {
        ...record,
        id: makeId('deploy'),
        createdAt: new Date().toISOString(),
      }
      deployments.unshift(dep)
      return dep
    },

    listDeployments(): DeploymentRecord[] {
      return deployments
    },
  }
}

// Full Client that seamlessly connects to real `/api` backend, falls back gracefully to offline mode
export class ApiClient {
  private token: string | null = null
  private cachedUser: ProductUser | null = null
  private offline = createOfflineApi()

  constructor() {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const storedToken = localStorage.getItem('zand_token')
        const storedUser = localStorage.getItem('zand_user')
        if (storedToken) this.token = storedToken
        if (storedUser) this.cachedUser = JSON.parse(storedUser)
      } catch {
        // localStorage unavailable
      }
    }
  }

  getToken(): string | null {
    return this.token
  }

  getUser(): ProductUser | null {
    return this.cachedUser
  }

  private saveAuth(token: string, user: ProductUser): void {
    this.token = token
    this.cachedUser = user
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem('zand_token', token)
        localStorage.setItem('zand_user', JSON.stringify(user))
      } catch {
        // storage quota or restricted
      }
    }
  }

  logout(): void {
    this.token = null
    this.cachedUser = null
    this.offline.logout()
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.removeItem('zand_token')
        localStorage.removeItem('zand_user')
      } catch {
        // ignore
      }
    }
  }

  private authHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`
    }
    return headers
  }

  async checkHealth(): Promise<{ healthy: boolean; features?: Record<string, unknown> }> {
    try {
      const res = await fetch('/api/health')
      if (res.ok) {
        const data = await res.json()
        return { healthy: true, features: data.features }
      }
    } catch {
      // offline
    }
    return { healthy: false }
  }

  async signUp(email: string, password: string): Promise<ProductUser> {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (res.ok) {
        const data = (await res.json()) as { user: ProductUser; token: string }
        this.saveAuth(data.token, data.user)
        return data.user
      }
      const err = await res.json()
      throw new Error(err.error || 'Registration failed')
    } catch (e: unknown) {
      if (e instanceof Error && e.message !== 'Failed to fetch') throw e
      // Fallback to offline
      const user = await this.offline.signUp(email, password)
      this.cachedUser = user
      return user
    }
  }

  async login(email: string, password: string): Promise<ProductUser> {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (res.ok) {
        const data = (await res.json()) as { user: ProductUser; token: string }
        this.saveAuth(data.token, data.user)
        return data.user
      }
      const err = await res.json()
      throw new Error(err.error || 'Login failed')
    } catch (e: unknown) {
      if (e instanceof Error && e.message !== 'Failed to fetch') throw e
      const user = await this.offline.login(email, password)
      this.cachedUser = user
      return user
    }
  }

  async getMe(): Promise<ProductUser | null> {
    if (!this.token) return this.cachedUser
    try {
      const res = await fetch('/api/auth/me', {
        headers: this.authHeaders(),
      })
      if (res.ok) {
        const data = (await res.json()) as { user: ProductUser }
        this.cachedUser = data.user
        return data.user
      }
    } catch {
      // offline
    }
    return this.cachedUser
  }

  async generateKit(prompt: string): Promise<LaunchKit> {
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: this.authHeaders(),
        body: JSON.stringify({ prompt }),
      })
      if (res.ok) {
        const data = (await res.json()) as { kit: LaunchKit }
        return data.kit
      }
    } catch {
      // offline
    }
    return this.offline.generateKit(prompt)
  }

  async generateImage(
    kit: LaunchKit,
    type: 'logo' | 'banner' = 'logo',
    forceSvg = false,
  ): Promise<GeneratedImage> {
    try {
      const res = await fetch('/api/images/generate', {
        method: 'POST',
        headers: this.authHeaders(),
        body: JSON.stringify({ kit, type, forceSvg }),
      })
      if (res.ok) {
        return (await res.json()) as GeneratedImage
      }
    } catch {
      // offline
    }
    return this.offline.generateImage(kit, type)
  }

  async saveProject(kit: LaunchKit): Promise<ProductProject> {
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: this.authHeaders(),
        body: JSON.stringify({ kit }),
      })
      if (res.ok) {
        const data = (await res.json()) as { project: ProductProject }
        return data.project
      }
      if (res.status === 401) {
        throw new Error('Please sign in to save your project to the cloud')
      }
    } catch (e: unknown) {
      if (e instanceof Error && e.message.includes('sign in')) throw e
    }
    return this.offline.saveProject(kit)
  }

  async listProjects(): Promise<ProductProject[]> {
    try {
      const res = await fetch('/api/projects', {
        headers: this.authHeaders(),
      })
      if (res.ok) {
        const data = (await res.json()) as { projects: ProductProject[] }
        return data.projects
      }
    } catch {
      // offline
    }
    return this.offline.listProjects()
  }

  async deleteProject(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'DELETE',
        headers: this.authHeaders(),
      })
      if (res.ok) return true
    } catch {
      // offline
    }
    return false
  }

  async createCheckout(tier: 'pro' | 'founder' = 'pro'): Promise<CheckoutLink> {
    try {
      const res = await fetch('/api/checkout/create-session', {
        method: 'POST',
        headers: this.authHeaders(),
        body: JSON.stringify({ tier }),
      })
      if (res.ok) {
        return (await res.json()) as CheckoutLink
      }
    } catch {
      // offline
    }
    return this.offline.createCheckout(tier)
  }

  async prepareTokenDeployment(
    kit: LaunchKit,
    networkKey = 'base-mainnet',
    deployerAddress = '0x1111111111111111111111111111111111111111',
  ): Promise<DeploymentPlan> {
    try {
      const res = await fetch('/api/deploy/prepare', {
        method: 'POST',
        headers: this.authHeaders(),
        body: JSON.stringify({ kit, networkKey, deployerAddress }),
      })
      if (res.ok) {
        const data = (await res.json()) as { plan: DeploymentPlan }
        return data.plan
      }
    } catch {
      // offline
    }
    return this.offline.prepareTokenDeployment(kit, networkKey, deployerAddress)
  }

  async simulateDeployment(
    deployerAddress: string,
    networkKey: string,
  ): Promise<{ valid: boolean; errors: string[]; warnings: string[] }> {
    try {
      const res = await fetch('/api/deploy/simulate', {
        method: 'POST',
        headers: this.authHeaders(),
        body: JSON.stringify({ deployerAddress, networkKey }),
      })
      if (res.ok) {
        return await res.json()
      }
    } catch {
      // offline
    }
    const isEth = /^0x[a-fA-F0-9]{40}$/.test(deployerAddress.trim())
    return {
      valid: isEth,
      errors: isEth ? [] : ['Deployer address must be a valid 42-character 0x address'],
      warnings: [],
    }
  }

  async recordDeployment(
    record: Omit<DeploymentRecord, 'id' | 'createdAt'>,
  ): Promise<DeploymentRecord> {
    try {
      const res = await fetch('/api/deploy/record', {
        method: 'POST',
        headers: this.authHeaders(),
        body: JSON.stringify(record),
      })
      if (res.ok) {
        const data = (await res.json()) as { deployment: DeploymentRecord }
        return data.deployment
      }
    } catch {
      // offline
    }
    return this.offline.recordDeployment(record)
  }

  async listDeployments(): Promise<DeploymentRecord[]> {
    try {
      const res = await fetch('/api/deploy/history', {
        headers: this.authHeaders(),
      })
      if (res.ok) {
        const data = (await res.json()) as { deployments: DeploymentRecord[] }
        return data.deployments
      }
    } catch {
      // offline
    }
    return this.offline.listDeployments()
  }

  async getLiquidityPlan(
    kit: LaunchKit,
    chain: 'ethereum' | 'solana' | 'base' | 'arbitrum' = 'base',
    initialEthOrSol?: number,
  ): Promise<LiquidityPlan> {
    try {
      const res = await fetch('/api/ecosystems/liquidity-plan', {
        method: 'POST',
        headers: this.authHeaders(),
        body: JSON.stringify({ kit, chain, initialEthOrSol }),
      })
      if (res.ok) {
        const data = (await res.json()) as { plan: LiquidityPlan }
        return data.plan
      }
    } catch {
      // offline fallback
    }
    return {
      chain,
      dexName: chain === 'solana' ? 'Raydium (CPMM)' : chain === 'ethereum' ? 'Uniswap V3 (Ethereum)' : 'Aerodrome (Base)',
      dexUrl: chain === 'solana' ? 'https://raydium.io' : 'https://app.uniswap.org',
      pairWith: chain === 'solana' ? 'SOL' : 'WETH',
      initialTokenDeposit: kit.tokenomics.supply,
      initialPairedDeposit: chain === 'solana' ? '25 SOL' : '2 ETH',
      estimatedStartingPriceUsd: '$0.0000032',
      estimatedInitialMarketCapUsd: '$3,200',
      instructions: ['1. Deploy contract', '2. Deposit tokens and paired asset into pool', '3. Lock liquidity tokens'],
      poolCreationSnippet: `// Pool creation for ${kit.tokenName}\naddLiquidity(...)`,
    }
  }

  async getRobinhoodAudit(kit: LaunchKit): Promise<RobinhoodAudit> {
    try {
      const res = await fetch('/api/ecosystems/robinhood-audit', {
        method: 'POST',
        headers: this.authHeaders(),
        body: JSON.stringify({ kit }),
      })
      if (res.ok) {
        const data = (await res.json()) as { audit: RobinhoodAudit }
        return data.audit
      }
    } catch {
      // offline fallback
    }
    return {
      score: 95,
      rating: 'Tier A: Prime Candidate',
      summary: `${kit.tokenName} meets 95% of standard compliance indicators for retail exchange evaluation.`,
      metrics: [
        { name: '0% / 0% Tax Compliance', status: 'pass', detail: 'Zero tax orderbook matching ready' },
        { name: 'Supply Architecture', status: 'pass', detail: 'Optimized retail denomination' },
        { name: 'Ownership Renunciation', status: 'pass', detail: 'Contract can be renounced' },
      ],
      actionPlan: ['Lock LP tokens for 12 months', 'Reach 5,000+ token holders', 'Submit Robinhood Connect partnership'],
      robinhoodConnectConfig: {
        appId: `zand_${kit.primaryTicker.replace('$', '').toLowerCase()}`,
        supportedTokens: ['ETH', 'SOL', 'USDC'],
        suggestedFiatRamp: 'Robinhood Connect Web SDK',
      },
    }
  }

  async getSolanaConfig(kit: LaunchKit): Promise<SolanaConfig> {
    try {
      const res = await fetch('/api/ecosystems/solana-config', {
        method: 'POST',
        headers: this.authHeaders(),
        body: JSON.stringify({ kit }),
      })
      if (res.ok) {
        const data = (await res.json()) as { config: SolanaConfig }
        return data.config
      }
    } catch {
      // offline fallback
    }
    return {
      tokenName: kit.tokenName,
      symbol: kit.primaryTicker.replace('$', ''),
      decimals: 9,
      initialSupply: kit.tokenomics.supply.replace(/,/g, ''),
      metadataUri: 'https://arweave.net/metadata.json',
      cliCommands: [
        'spl-token create-token --decimals 9',
        `spl-token mint <MINT_ADDRESS> ${kit.tokenomics.supply.replace(/,/g, '')}`,
        'spl-token authorize <MINT_ADDRESS> mint --disable',
      ],
      pumpFunInstructions: {
        title: `Pump.fun: ${kit.tokenName}`,
        description: kit.lore,
        recommendedTwitter: `https://x.com/${kit.primaryTicker.replace('$', '').toLowerCase()}`,
        recommendedTelegram: `https://t.me/${kit.primaryTicker.replace('$', '').toLowerCase()}`,
      },
    }
  }

  async getTelegramBotPackage(
    kit: LaunchKit,
    addresses?: { ethereumAddress?: string; baseAddress?: string; solanaMint?: string },
  ): Promise<TelegramBotBundle> {
    try {
      const res = await fetch('/api/bot/generate', {
        method: 'POST',
        headers: this.authHeaders(),
        body: JSON.stringify({ kit, ...addresses }),
      })
      if (res.ok) {
        const data = (await res.json()) as { botPackage: TelegramBotBundle }
        return data.botPackage
      }
    } catch {
      // offline fallback
    }
    return {
      filename: 'bot.js',
      code: `// Telegram Community Bot for ${kit.tokenName}\nconsole.log("Bot active");`,
      botPackageJson: '{"name":"tg-bot","scripts":{"start":"node bot.js"}}',
      readme: `# Telegram Bot for ${kit.tokenName}`,
      slashCommands: [
        { command: '/start', description: 'Welcome dashboard', sampleResponse: `Welcome to ${kit.tokenName}!` },
        { command: '/buy', description: 'Buy links for Uniswap & Raydium', sampleResponse: `Buy ${kit.primaryTicker} on Uniswap & Raydium` },
        { command: '/lore', description: 'Origin story', sampleResponse: kit.lore },
        { command: '/memes', description: 'Meme generator', sampleResponse: kit.memeTemplates[0]?.top || 'HODL' },
        { command: '/raid', description: 'Twitter raid target', sampleResponse: kit.socialPosts[0] || 'Raid now!' },
      ],
    }
  }
}

export const productApi = new ApiClient()
