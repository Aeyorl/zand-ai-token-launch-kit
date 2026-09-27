import { describe, expect, it } from 'vitest'
import { generateLaunchKit, exportLaunchKitMarkdown } from './brandGenerator'

describe('generateLaunchKit', () => {
  it('turns an angry billionaire cat prompt into a complete token launch kit', () => {
    const kit = generateLaunchKit('Angry billionaire cat that hates Wall Street.')

    expect(kit.tokenName).toMatch(/cat|claw|wall/i)
    expect(kit.tickers).toHaveLength(5)
    expect(kit.logoPrompt).toContain('Angry billionaire cat')
    expect(kit.character.name).toBeTruthy()
    expect(kit.website.heroHeadline).toContain(kit.tokenName)
    expect(kit.lore).toContain('Wall Street')
    expect(kit.socialPosts).toHaveLength(4)
    expect(kit.memeTemplates).toHaveLength(4)
    expect(kit.bannerPrompt).toContain(kit.primaryTicker)
    expect(kit.communityDescription).toContain(kit.primaryTicker)
  })

  it('exports a markdown launch kit founders can copy', () => {
    const kit = generateLaunchKit('Cute cat with laser eyes protecting delicate girls')
    const markdown = exportLaunchKitMarkdown(kit)

    expect(markdown).toContain(`# ${kit.tokenName}`)
    expect(markdown).toContain('## Lore')
    expect(markdown).toContain('## Social Posts')
    expect(markdown).toContain('## Meme Templates')
  })
})
