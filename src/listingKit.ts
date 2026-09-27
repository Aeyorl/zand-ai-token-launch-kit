import type { LaunchKit } from './brandGenerator'

export interface ListingPackage {
  dexScreenerJson: string
  coinGeckoMarkdown: string
  coinMarketCapMarkdown: string
}

export function generateListingPackage(
  kit: LaunchKit,
  contractAddress = '0x42170bA5E8C9472DaE419Fa432170DEAdbeef123',
  networkName = 'Robinhood Chain Mainnet',
): ListingPackage {
  const symbol = kit.primaryTicker.replace('$', '')
  const supply = kit.tokenomics?.supply || '1,000,000,000'

  const dexScreener = {
    type: 'tokenProfile',
    chainId: networkName.toLowerCase().includes('robinhood')
      ? 'robinhood'
      : networkName.toLowerCase().includes('base')
        ? 'base'
        : 'ethereum',
    tokenAddress: contractAddress,
    url: 'https://dexscreener.com',
    icon: 'assets/logo.svg',
    header: 'assets/banner.svg',
    description: kit.communityDescription || kit.lore,
    links: [
      {
        type: 'website',
        label: 'Official Website',
        url: 'https://token.portal',
      },
      {
        type: 'twitter',
        label: 'Twitter / X',
        url: 'https://x.com',
      },
      {
        type: 'telegram',
        label: 'Telegram Community',
        url: 'https://t.me/portal',
      },
    ],
  }

  const coinGecko = `# CoinGecko Listing Application: ${kit.tokenName} (${kit.primaryTicker})

### 1. General Token Information
- **Project Name:** ${kit.tokenName}
- **Token Symbol:** ${symbol}
- **Blockchain Platform:** ${networkName}
- **Smart Contract Address:** \`${contractAddress}\`
- **Official Website:** https://token.portal (Generated Landing Page included)
- **Explorer Link:** https://explorer.robinhood.com/address/${contractAddress}

### 2. Tokenomics & Circulating Supply
- **Total Supply:** ${supply}
- **Max Supply:** ${supply}
- **Circulating Supply at TGE:** ${supply} (100% fair decentralized distribution)
- **Buy / Sell Tax:** 0% / 0%
- **Decimals:** 18

### 3. Lore & Project Description
${kit.lore}

### 4. Official Community Channels
- **Twitter / X:** https://x.com
- **Telegram Channel:** https://t.me/portal
- **Source Code Verification:** Verified on Explorer via Standard JSON Input

### 5. Liquidity & Trading Pairs
- **Primary DEX:** Uniswap V3 / Robinhood DEX
- **Pair:** ${symbol} / ETH
- **Liquidity Lock Status:** 100% Locked / Burned for 12 months on UNCX Network
`

  const coinMarketCap = `# CoinMarketCap Listing Application: ${kit.tokenName} (${kit.primaryTicker})

### Basic Metadata
- **Token Name:** ${kit.tokenName}
- **Symbol / Ticker:** ${kit.primaryTicker}
- **Project Type:** Meme & Community Utility Token
- **Network / Chain:** ${networkName}
- **Contract Address:** \`${contractAddress}\`

### Project Description & Narrative
${kit.communityDescription}

### Mascot & Lore
- **Mascot Name:** ${kit.character?.name || 'Mascot'}
- **Archetype:** ${kit.character?.archetype || 'Hero'}
- **Catchphrase:** "${kit.character?.catchphrase || kit.tokenName}"

### Proof of Liquidity & Lock
- **Initial Market Cap:** Estimated starting pool at fair launch pricing.
- **Order Book / DEX Pairing:** Direct LP Pool with ETH.
- **Auditor / Safety:** 0% tax, no mint function, renounceable ownership.
`

  return {
    dexScreenerJson: JSON.stringify(dexScreener, null, 2),
    coinGeckoMarkdown: coinGecko,
    coinMarketCapMarkdown: coinMarketCap,
  }
}
