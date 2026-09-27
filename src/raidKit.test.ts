import JSZip from 'jszip'
import { describe, expect, it } from 'vitest'
import { generateLaunchKit } from './brandGenerator'
import { generateRaidKitZip } from './raidKit'

describe('1-Click ZIP Raid Kit Generation', () => {
  it('generates a complete valid ZIP archive with all brand, contract, and exchange assets', async () => {
    const kit = generateLaunchKit('Angry billionaire cat that hates Wall Street.')
    const zipBlob = await generateRaidKitZip({
      kit,
      logoSvg: '<svg>logo</svg>',
      bannerSvg: '<svg>banner</svg>',
      solidityCode: 'contract WallStreetClawToken {}',
      baseContractAddress: '0x1234567890123456789012345678901234567890',
      ethereumContractAddress: '0x0987654321098765432109876543210987654321',
      solanaMintAddress: 'SoL1111111111111111111111111111111111111111',
    })

    expect(zipBlob).toBeTruthy()
    expect(zipBlob.size).toBeGreaterThan(100)

    // Unpack with JSZip to verify file contents
    const zip = await JSZip.loadAsync(zipBlob)
    expect(zip.file('README.md')).not.toBeNull()
    expect(zip.file('MANIFESTO.md')).not.toBeNull()
    expect(zip.file('TOKENOMICS.json')).not.toBeNull()
    expect(zip.file('TWEETS.txt')).not.toBeNull()
    expect(zip.file('assets/logo.svg')).not.toBeNull()
    expect(zip.file('assets/banner.svg')).not.toBeNull()
    expect(zip.file('assets/memes.json')).not.toBeNull()
    expect(zip.file('contracts/solana/create_spl_token.sh')).not.toBeNull()
    expect(zip.file('bot/bot.js')).not.toBeNull()
    expect(zip.file('exchanges/robinhood_readiness.md')).not.toBeNull()
    expect(zip.file('exchanges/liquidity_guide.md')).not.toBeNull()

    const readmeText = await zip.file('README.md')?.async('string')
    expect(readmeText).toContain(kit.tokenName)

    const manifestoText = await zip.file('MANIFESTO.md')?.async('string')
    expect(manifestoText).toContain(kit.tokenName)

    const tokenomicsJson = await zip.file('TOKENOMICS.json')?.async('string')
    const parsedTokenomics = JSON.parse(tokenomicsJson || '{}')
    expect(parsedTokenomics.chains).toContain('Solana')
    expect(parsedTokenomics.chains).toContain('Ethereum')
    expect(parsedTokenomics.chains).toContain('Base')
  })
})
