export type LaunchKit = {
  prompt: string
  tokenName: string
  primaryTicker: string
  tickers: string[]
  logoPrompt: string
  character: {
    name: string
    archetype: string
    visualDirection: string
    catchphrase: string
  }
  website: {
    heroHeadline: string
    subheadline: string
    ctas: string[]
    features: string[]
  }
  lore: string
  manifesto: string[]
  socialPosts: string[]
  memeTemplates: Array<{
    title: string
    top: string
    bottom: string
  }>
  bannerPrompt: string
  communityDescription: string
  tokenomics: {
    supply: string
    tax: string
    liquidity: string
    chain: string
  }
}

const stopWords = new Set([
  'a', 'an', 'the', 'that', 'with', 'and', 'or', 'to', 'of', 'for', 'in', 'on', 'at',
  'is', 'are', 'be', 'it', 'this', 'any', 'hates', 'hate', 'angry', 'cute', 'meme',
])

const titleCase = (word: string) =>
  word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()

const wordsFromPrompt = (prompt: string) =>
  prompt
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)

const pickThemeWords = (prompt: string) => {
  const words = wordsFromPrompt(prompt)
  const important = words.filter((word) => !stopWords.has(word.toLowerCase()))
  return important.length ? important : ['Meme', 'Launch']
}

const includes = (prompt: string, needle: string) => prompt.toLowerCase().includes(needle)

const clampTicker = (value: string) => `$${value.replace(/[^A-Z0-9]/g, '').slice(0, 8) || 'MEME'}`

export function generateLaunchKit(prompt: string): LaunchKit {
  const cleanPrompt = prompt.trim() || 'Angry billionaire cat that hates Wall Street.'
  const themeWords = pickThemeWords(cleanPrompt)
  const subject = titleCase(themeWords.at(-1) ?? 'Meme')
  const antagonist = includes(cleanPrompt, 'wall street') ? 'Wall Street' : 'the timeline'
  const animal = includes(cleanPrompt, 'cat') ? 'Cat' : includes(cleanPrompt, 'dog') ? 'Dog' : 'Meme'
  const energy = includes(cleanPrompt, 'angry') ? 'Angry' : includes(cleanPrompt, 'cute') ? 'Cute' : 'Viral'
  const action = animal === 'Cat' ? 'Claw' : animal === 'Dog' ? 'Bark' : 'Spark'
  const tokenName = includes(cleanPrompt, 'wall street')
    ? `${animal === 'Cat' ? 'WallStreet Claw' : `${subject} Revolt`}`
    : `${energy}${subject}`.replace(/\s/g, '')
  const tickerRoot = tokenName
    .replace(/WallStreet/i, 'WS')
    .replace(/[^A-Za-z0-9]/g, '')
    .toUpperCase()
  const primaryTicker = clampTicker(tickerRoot.includes('CLAW') ? 'CLAW' : tickerRoot)
  const tickers = Array.from(
    new Set([
      primaryTicker,
      clampTicker(`${energy}${animal}`),
      clampTicker(`${subject}${action}`),
      clampTicker(`ANTI${animal}`),
      clampTicker('MEMEKIT'),
    ]),
  ).slice(0, 5)

  const characterName = `${energy} ${animal === 'Cat' ? 'Mr. Mittens' : `${subject} Commander`}`
  const rebelLine = includes(cleanPrompt, 'wall street')
    ? 'the first feline syndicate built to short the suits and claw liquidity back to the people'
    : 'a community-born mascot built to convert internet chaos into culture'

  return {
    prompt: cleanPrompt,
    tokenName,
    primaryTicker,
    tickers,
    logoPrompt: `${cleanPrompt} — bold vector crypto logo, mascot-first, high contrast, coin emblem, expressive eyes, sticker-ready, transparent background`,
    character: {
      name: characterName,
      archetype: includes(cleanPrompt, 'billionaire')
        ? 'unhinged billionaire mascot turned anti-Wall-Street folk hero'
        : 'viral community mascot with main-character energy',
      visualDirection: `${energy.toLowerCase()} ${animal.toLowerCase()} mascot, luxury suit, neon chart candles, clenched paws, degen terminal glow`,
      catchphrase: `${animal === 'Cat' ? 'Claws out' : 'Community on'} — ${antagonist} gets no mercy.`,
    },
    website: {
      heroHeadline: `${tokenName} is the AI-born meme brand for people done playing nice.`,
      subheadline: `Generated from one prompt, packaged with lore, memes, banners, posts, and community copy so ${primaryTicker} launches with a story on day one.`,
      ctas: [`Buy ${primaryTicker}`, 'Join Telegram', 'Generate your launch kit'],
      features: [
        'Prompt-to-brand generation',
        'Meme templates for X and Telegram',
        'Launch-ready website copy',
        'Mascot, lore, banner, and social content',
      ],
    },
    lore: `${characterName} was minted when ${antagonist} tried to turn internet culture into another spreadsheet. The community answered with ${primaryTicker}: ${rebelLine}. Every meme is a receipt, every post is a raid, and every holder becomes part of the launch engine.`,
    manifesto: [
      'No empty launches — every chart deserves a story.',
      'Memes are distribution, not decoration.',
      'Communities move faster when the brand kit is ready first.',
      `${primaryTicker} exists to make the suits react to the timeline.`,
    ],
    socialPosts: [
      `Introducing ${tokenName} ${primaryTicker}: ${cleanPrompt} Now packaged into a full meme-token launch kit.`,
      `Every launch needs content. ${primaryTicker} ships the mascot, lore, memes, banners, socials, and website copy before the first raid.`,
      `${characterName} has entered the chat. ${antagonist} is about to learn what community distribution looks like.`,
      `Describe a meme. AI builds the brand. ${primaryTicker} is the launch engine for the next thousand meme coins.`,
    ],
    memeTemplates: [
      { title: 'Market Revenge', top: 'WHEN WALL STREET SHORTS', bottom: `${characterName.toUpperCase()} CLAWS BACK` },
      { title: 'Launch Night', top: 'DEV SAID JUST A MEME', bottom: 'AI DROPPED THE WHOLE BRAND KIT' },
      { title: 'Community Raid', top: 'NO LOGO NO LORE NO POSTS?', bottom: `${primaryTicker} FIXES THAT IN ONE CLICK` },
      { title: 'Degen Builder', top: 'DESCRIBE THE MEME', bottom: 'SHIP THE CULTURE' },
    ],
    bannerPrompt: `X/Twitter banner for ${tokenName} ${primaryTicker}: ${cleanPrompt}, cinematic degen trading desk, broken Wall Street skyline, neon green candles, mascot centered, room for Telegram and Dex links`,
    communityDescription: `${tokenName} ${primaryTicker} is the community around an AI meme launch kit: describe a meme and generate the name, ticker, mascot, lore, website copy, socials, memes, banners, and community positioning in seconds.`,
    tokenomics: {
      supply: '1,000,000,000',
      tax: '0% buy / 0% sell',
      liquidity: '100% LP burned forever',
      chain: 'Base / Solana-ready narrative',
    },
  }
}

export function exportLaunchKitMarkdown(kit: LaunchKit) {
  return `# ${kit.tokenName} ${kit.primaryTicker}

**Prompt:** ${kit.prompt}

## Ticker Suggestions
${kit.tickers.map((ticker) => `- ${ticker}`).join('\n')}

## Logo Prompt
${kit.logoPrompt}

## Character
- **Name:** ${kit.character.name}
- **Archetype:** ${kit.character.archetype}
- **Visual Direction:** ${kit.character.visualDirection}
- **Catchphrase:** ${kit.character.catchphrase}

## Website Copy
**Hero:** ${kit.website.heroHeadline}

${kit.website.subheadline}

**CTAs:** ${kit.website.ctas.join(' · ')}

## Lore
${kit.lore}

## Manifesto
${kit.manifesto.map((line) => `- ${line}`).join('\n')}

## Social Posts
${kit.socialPosts.map((post, index) => `${index + 1}. ${post}`).join('\n')}

## Meme Templates
${kit.memeTemplates.map((meme) => `### ${meme.title}\nTOP: ${meme.top}\nBOTTOM: ${meme.bottom}`).join('\n\n')}

## Banner Prompt
${kit.bannerPrompt}

## Community Description
${kit.communityDescription}

## Tokenomics
- Supply: ${kit.tokenomics.supply}
- Tax: ${kit.tokenomics.tax}
- Liquidity: ${kit.tokenomics.liquidity}
- Chain: ${kit.tokenomics.chain}
`
}
