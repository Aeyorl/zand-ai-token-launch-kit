import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  it('renders a visible meme token launch kit from the default prompt', () => {
    const html = renderToStaticMarkup(<App />)

    expect(html).toContain('Describe a meme. AI builds the brand.')
    expect(html).toContain('WallStreet Claw launch kit')
    expect(html).toContain('Ticker suggestions')
    expect(html).toContain('Logo prompt')
    expect(html).toContain('Wall Street')
    expect(html).toContain('Copy brand markdown')
  })

  it('renders full SaaS navigation and actions for auth, studio, and deployment', () => {
    const html = renderToStaticMarkup(<App />)

    // SaaS Navbar actions
    expect(html).toContain('Sign In')
    expect(html).toContain('Pricing')
    expect(html).toContain('Deploy Token')

    // Creative studio controls
    expect(html).toContain('Creative Studio')
    expect(html).toContain('Logo &amp; Banner Generator')
    expect(html).toContain('Logo (1:1)')
    expect(html).toContain('Banner (3:1)')
    expect(html).toContain('Generate with AI')
    expect(html).toContain('Download SVG')

    // Cloud and deploy action buttons
    expect(html).toContain('Save to Cloud')
    expect(html).toContain('Deploy Contract')
    expect(html).toContain('Deploy on Base')
  })

  it('renders 1-Click ZIP Raid Kit export and multi-chain ecosystem actions for Ethereum, Solana, and Robinhood', () => {
    const html = renderToStaticMarkup(<App />)

    expect(html).toContain('Raid Kit (.ZIP)')
    expect(html).toContain('Download Raid Kit (.ZIP)')
    expect(html).toContain('Robinhood &amp; Solana')
    expect(html).toContain('Ecosystems &amp; DEX')
    expect(html).toContain('Robinhood Readiness')
    expect(html).toContain('Download Full Raid Package (.ZIP)')
  })

  it('renders Meme Studio, Landing Page generator, and Web3 connection controls', () => {
    const html = renderToStaticMarkup(<App />)

    expect(html).toContain('Meme Studio')
    expect(html).toContain('Landing Page')
    expect(html).toContain('Connect Web3')
    expect(html).toContain('Open Interactive Meme Studio 🎨')
  })

  it('renders contract verification, vesting engine, and exchange listing package triggers', () => {
    const html = renderToStaticMarkup(<App />)

    expect(html).toContain('Ecosystems &amp; DEX')
    expect(html).toContain('Raid Kit (.ZIP)')
  })
})
