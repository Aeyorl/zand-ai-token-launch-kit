import { describe, expect, it } from 'vitest'
import { generateLaunchKit } from './brandGenerator'
import { generateLandingPageHtml } from './landingPage'

describe('generateLandingPageHtml', () => {
  it('generates complete self-contained HTML with token parameters and styling', () => {
    const kit = generateLaunchKit('Angry billionaire cat that hates Wall Street.')
    const html = generateLandingPageHtml(kit, {
      contractAddress: '0x42170bA5E8C9472DaE419Fa432170DEAdbeef123',
      networkName: 'Robinhood Chain Mainnet (42170)',
    })

    expect(html).toContain('<!DOCTYPE html>')
    expect(html).toContain(kit.tokenName)
    expect(html).toContain(kit.primaryTicker)
    expect(html).toContain('0x42170bA5E8C9472DaE419Fa432170DEAdbeef123')
    expect(html).toContain('Robinhood Chain Mainnet (42170)')
    expect(html).toContain('Total Supply')
    expect(html).toContain('Tax / Slippage')
    expect(html).toContain('Official Manifesto &amp; Lore')
    expect(html).toContain('copyCA()')
  })

  it('uses default fallback values when options are not provided', () => {
    const kit = generateLaunchKit('Cute puppy on solana.')
    const html = generateLandingPageHtml(kit)

    expect(html).toContain('Robinhood Chain Mainnet (42170)')
    expect(html).toContain('0x42170bA5E8C9472DaE419Fa432170DEAdbeef123')
  })
})
