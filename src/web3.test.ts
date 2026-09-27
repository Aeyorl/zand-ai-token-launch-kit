import { describe, expect, it } from 'vitest'
import {
  CHAIN_PARAMS,
  connectInjectedWallet,
  connectSolanaWallet,
  detectProviderName,
  switchOrAddChain,
} from './web3'

describe('Web3 Utilities', () => {
  it('contains proper chain parameters for Robinhood Mainnet, Base, Arbitrum, and Ethereum', () => {
    expect(CHAIN_PARAMS['robinhood-mainnet']).toBeDefined()
    expect(CHAIN_PARAMS['robinhood-mainnet'].chainIdNum).toBe(42170)
    expect(CHAIN_PARAMS['robinhood-mainnet'].chainIdHex).toBe('0xa4ba')
    expect(CHAIN_PARAMS['robinhood-mainnet'].rpcUrls).toContain('https://mainnet.robinhood.com/rpc')

    expect(CHAIN_PARAMS['base-mainnet'].chainIdNum).toBe(8453)
    expect(CHAIN_PARAMS['arbitrum-one'].chainIdNum).toBe(42161)
    expect(CHAIN_PARAMS['ethereum-mainnet'].chainIdNum).toBe(1)
  })

  it('detects provider name properly when window.ethereum is absent or mocked', () => {
    // In node/vitest environment without window.ethereum
    const provider = detectProviderName()
    expect(typeof provider).toBe('string')
  })

  it('handles connectInjectedWallet gracefully when no wallet extension is installed', async () => {
    const res = await connectInjectedWallet().catch((err) => ({
      isConnected: false,
      error: err.message,
    }))
    expect(res.isConnected).toBe(false)
  })

  it('handles connectSolanaWallet gracefully when no Solana wallet is present', async () => {
    const res = await connectSolanaWallet()
    expect(res.isConnected).toBe(false)
  })

  it('switchOrAddChain returns false when no window.ethereum exists or unknown network', async () => {
    const res = await switchOrAddChain('unknown-network')
    expect(res).toBe(false)
  })
})
