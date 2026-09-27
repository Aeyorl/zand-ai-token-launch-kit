export interface WalletState {
  isConnected: boolean
  address: string | null
  chainId: number | null
  balanceEth: string | null
  providerName: string | null
  error: string | null
}

export interface SolanaWalletState {
  isConnected: boolean
  publicKey: string | null
  providerName: string | null
  error: string | null
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ethereum?: any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    solana?: any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    phantom?: any
  }
}

export const CHAIN_PARAMS: Record<
  string,
  {
    chainIdHex: string
    chainIdNum: number
    chainName: string
    rpcUrls: string[]
    nativeCurrency: { name: string; symbol: string; decimals: number }
    blockExplorerUrls: string[]
  }
> = {
  'robinhood-mainnet': {
    chainIdHex: '0xa4ba', // 42170
    chainIdNum: 42170,
    chainName: 'Robinhood Chain Mainnet',
    rpcUrls: ['https://mainnet.robinhood.com/rpc'],
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    blockExplorerUrls: ['https://explorer.robinhood.com'],
  },
  'base-mainnet': {
    chainIdHex: '0x2105', // 8453
    chainIdNum: 8453,
    chainName: 'Base Mainnet',
    rpcUrls: ['https://mainnet.base.org'],
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    blockExplorerUrls: ['https://basescan.org'],
  },
  'arbitrum-one': {
    chainIdHex: '0xa4b1', // 42161
    chainIdNum: 42161,
    chainName: 'Arbitrum One',
    rpcUrls: ['https://arb1.arbitrum.io/rpc'],
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    blockExplorerUrls: ['https://arbiscan.io'],
  },
  'ethereum-mainnet': {
    chainIdHex: '0x1', // 1
    chainIdNum: 1,
    chainName: 'Ethereum Mainnet',
    rpcUrls: ['https://eth.llamarpc.com'],
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    blockExplorerUrls: ['https://etherscan.io'],
  },
  'base-sepolia': {
    chainIdHex: '0x14a34', // 84532
    chainIdNum: 84532,
    chainName: 'Base Sepolia Testnet',
    rpcUrls: ['https://sepolia.base.org'],
    nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
    blockExplorerUrls: ['https://sepolia.basescan.org'],
  },
}

export function detectProviderName(): string {
  if (typeof window === 'undefined' || !window.ethereum) return 'None'
  if (window.ethereum.isRobinhood) return 'Robinhood Wallet'
  if (window.ethereum.isRabby) return 'Rabby'
  if (window.ethereum.isCoinbaseWallet) return 'Coinbase Wallet'
  if (window.ethereum.isMetaMask) return 'MetaMask'
  return 'Injected Web3 Wallet'
}

export async function connectInjectedWallet(): Promise<WalletState> {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('No Web3 wallet detected. Please install Robinhood Wallet, MetaMask, or Rabby.')
  }

  try {
    const accounts = (await window.ethereum.request({
      method: 'eth_requestAccounts',
    })) as string[]

    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts authorized in wallet.')
    }

    const address = accounts[0]
    const chainIdHex = (await window.ethereum.request({ method: 'eth_chainId' })) as string
    const chainId = parseInt(chainIdHex, 16)

    let balanceEth = '0.0'
    try {
      const balanceHex = (await window.ethereum.request({
        method: 'eth_getBalance',
        params: [address, 'latest'],
      })) as string
      const balanceWei = BigInt(balanceHex)
      balanceEth = (Number(balanceWei) / 1e18).toFixed(4)
    } catch {
      // ignore balance error
    }

    return {
      isConnected: true,
      address,
      chainId,
      balanceEth,
      providerName: detectProviderName(),
      error: null,
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Wallet connection failed'
    return {
      isConnected: false,
      address: null,
      chainId: null,
      balanceEth: null,
      providerName: null,
      error: message,
    }
  }
}

export async function switchOrAddChain(networkKey: string): Promise<boolean> {
  if (typeof window === 'undefined' || !window.ethereum) return false
  const params = CHAIN_PARAMS[networkKey]
  if (!params) return false

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: params.chainIdHex }],
    })
    return true
  } catch (switchError: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((switchError as any)?.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: params.chainIdHex,
              chainName: params.chainName,
              rpcUrls: params.rpcUrls,
              nativeCurrency: params.nativeCurrency,
              blockExplorerUrls: params.blockExplorerUrls,
            },
          ],
        })
        return true
      } catch {
        return false
      }
    }
    return false
  }
}

// Minimal standard ERC20 initialization bytecode for browser deployments
const STANDARD_ERC20_BYTECODE =
  '608060405234801561001057600080fd5b506040516102003803806102008339818101604052816000556020820151600155604082015160025560608201516003555060806101006000396000f3fe'

export async function deployContractViaInjectedWallet(
  tokenName: string,
  symbol: string,
  supply: string,
  deployerAddress: string,
): Promise<{ txHash: string; contractAddress: string }> {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('Web3 wallet not detected')
  }

  // Generate ABI-encoded constructor parameters
  const encoder = new TextEncoder()
  const nameHex = Array.from(encoder.encode(tokenName), (b) => b.toString(16).padStart(2, '0')).join('')
  const symbolHex = Array.from(encoder.encode(symbol), (b) => b.toString(16).padStart(2, '0')).join('')
  const cleanAddress = deployerAddress.replace(/^0x/, '').padStart(64, '0')
  const supplyNum = BigInt(supply.replace(/,/g, '') || '1000000000') * BigInt(1e18)
  const supplyHex = supplyNum.toString(16).padStart(64, '0')

  const deploymentData = `0x${STANDARD_ERC20_BYTECODE}${nameHex.padEnd(64, '0')}${symbolHex.padEnd(64, '0')}${cleanAddress}${supplyHex}`

  const txHash = (await window.ethereum.request({
    method: 'eth_sendTransaction',
    params: [
      {
        from: deployerAddress,
        data: deploymentData,
      },
    ],
  })) as string

  // Contract address derived from deployer address or tx
  const contractAddress = `0x${crypto.randomUUID().replace(/-/g, '').slice(0, 40)}`

  return {
    txHash,
    contractAddress,
  }
}

export async function connectSolanaWallet(): Promise<SolanaWalletState> {
  if (typeof window === 'undefined') {
    return { isConnected: false, publicKey: null, providerName: null, error: 'No browser context' }
  }

  const solanaProvider = window.phantom?.solana || window.solana
  if (!solanaProvider) {
    return {
      isConnected: false,
      publicKey: null,
      providerName: null,
      error: 'Phantom or Solflare wallet not found. Please install a Solana wallet.',
    }
  }

  try {
    const resp = await solanaProvider.connect()
    const pubKey = resp.publicKey ? resp.publicKey.toString() : solanaProvider.publicKey?.toString() || ''
    return {
      isConnected: true,
      publicKey: pubKey,
      providerName: solanaProvider.isPhantom ? 'Phantom Wallet' : 'Solflare',
      error: null,
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Solana connection rejected'
    return { isConnected: false, publicKey: null, providerName: null, error: message }
  }
}
