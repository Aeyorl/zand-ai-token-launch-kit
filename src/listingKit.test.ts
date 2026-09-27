import { describe, expect, it } from 'vitest'
import { generateLaunchKit } from './brandGenerator'
import { generateListingPackage } from './listingKit'

describe('generateListingPackage', () => {
  it('generates complete listing applications for DexScreener, CoinGecko, and CoinMarketCap', () => {
    const kit = generateLaunchKit('Angry billionaire cat that hates Wall Street.')
    const pkg = generateListingPackage(
      kit,
      '0x42170bA5E8C9472DaE419Fa432170DEAdbeef123',
      'Robinhood Chain Mainnet',
    )

    expect(pkg.dexScreenerJson).toContain('"tokenAddress": "0x42170bA5E8C9472DaE419Fa432170DEAdbeef123"')
    expect(pkg.dexScreenerJson).toContain('"chainId": "robinhood"')
    expect(pkg.coinGeckoMarkdown).toContain('CoinGecko Listing Application')
    expect(pkg.coinGeckoMarkdown).toContain('0x42170bA5E8C9472DaE419Fa432170DEAdbeef123')
    expect(pkg.coinGeckoMarkdown).toContain('Robinhood Chain Mainnet')
    expect(pkg.coinMarketCapMarkdown).toContain('CoinMarketCap Listing Application')
    expect(pkg.coinMarketCapMarkdown).toContain(kit.tokenName)
  })
})
