import { generateLaunchKit, type LaunchKit } from './brandGenerator'

export type ProductUser = {
  id: string
  email: string
}

export type ProductProject = {
  id: string
  ownerId: string
  kit: LaunchKit
  createdAt: string
}

export type GeneratedImage = {
  kind: 'svg'
  url: string
  prompt: string
}

export type CheckoutLink = {
  id: string
  url: string
}

export type DeploymentPlan = {
  contractName: string
  solidity: string
  network: {
    chainId: number
    rpcUrl: string
    deployerAddress: string
  }
}

const makeId = (prefix: string) => `${prefix}_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`

const escapeSvg = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const toSvgDataUrl = (kit: LaunchKit) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#080b13"/>
  <circle cx="600" cy="260" r="156" fill="#22c55e"/>
  <circle cx="548" cy="242" r="24" fill="#020617"/><circle cx="652" cy="242" r="24" fill="#020617"/>
  <path d="M520 164 L560 76 L604 170 L646 76 L684 164" fill="#22c55e"/>
  <path d="M540 330 Q600 386 660 330" fill="none" stroke="#020617" stroke-width="20" stroke-linecap="round"/>
  <text x="600" y="505" text-anchor="middle" font-family="Inter, Arial" font-size="78" font-weight="900" fill="#f8fafc">${escapeSvg(kit.tokenName)}</text>
  <text x="600" y="566" text-anchor="middle" font-family="Inter, Arial" font-size="40" font-weight="800" fill="#86efac">${escapeSvg(kit.primaryTicker)} launch asset</text>
</svg>`
  return `data:image/svg+xml;base64,${btoa(svg)}`
}

export function createOfflineApi() {
  let currentUser: ProductUser | null = null
  const projects: ProductProject[] = []

  return {
    async signUp(email: string, password: string) {
      if (!email.includes('@')) throw new Error('Valid email required')
      if (password.length < 8) throw new Error('Password must be at least 8 characters')
      currentUser = { id: makeId('user'), email: email.trim().toLowerCase() }
      return currentUser
    },

    async generateKit(prompt: string) {
      return generateLaunchKit(prompt)
    },

    async generateImage(kit: LaunchKit): Promise<GeneratedImage> {
      return {
        kind: 'svg',
        prompt: kit.logoPrompt,
        url: toSvgDataUrl(kit),
      }
    },

    async saveProject(kit: LaunchKit) {
      if (!currentUser) throw new Error('Sign in before saving projects')
      const project: ProductProject = {
        id: makeId('project'),
        ownerId: currentUser.id,
        kit,
        createdAt: new Date().toISOString(),
      }
      projects.unshift(project)
      return project
    },

    listProjects() {
      if (!currentUser) return []
      return projects.filter((project) => project.ownerId === currentUser?.id)
    },

    async createCheckout(): Promise<CheckoutLink> {
      return {
        id: makeId('checkout'),
        url: '/checkout/demo?plan=founder',
      }
    },

    async prepareTokenDeployment(kit: LaunchKit): Promise<DeploymentPlan> {
      const contractName = `${kit.tokenName.replace(/[^A-Za-z0-9]/g, '')}Token`
      const symbol = kit.primaryTicker.replace('$', '')
      return {
        contractName,
        network: {
          chainId: 8453,
          rpcUrl: 'https://mainnet.base.org',
          deployerAddress: 'connect-wallet-to-fill',
        },
        solidity: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ${contractName} is ERC20 {
    constructor(address owner) ERC20("${kit.tokenName}", "${symbol}") {
        _mint(owner, 1000000000 * 10 ** decimals());
    }
}`,
      }
    },
  }
}

export const productApi = createOfflineApi()
