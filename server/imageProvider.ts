import type { LaunchKit } from '../src/brandGenerator'

export type ImageAssetType = 'logo' | 'banner'

export interface GeneratedImageResult {
  kind: 'svg' | 'remote'
  url: string
  prompt: string
  type: ImageAssetType
  svgContent?: string
}

export function getImageConfig(): {
  provider: 'openai' | 'fallback'
  apiKey?: string
} {
  const provider = (process.env.IMAGE_PROVIDER || 'fallback').toLowerCase() as 'openai' | 'fallback'
  const apiKey = process.env.IMAGE_API_KEY || process.env.OPENAI_API_KEY || ''
  return {
    provider,
    apiKey,
  }
}

const escapeXml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')

function generateLogoSvg(kit: LaunchKit): string {
  const name = escapeXml(kit.tokenName)
  const ticker = escapeXml(kit.primaryTicker)
  const catchphrase = escapeXml(kit.character.catchphrase || 'TO THE MOON')

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#050811"/>
      <stop offset="50%" stop-color="#0b1329"/>
      <stop offset="100%" stop-color="#020408"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#22c55e"/>
      <stop offset="50%" stop-color="#10b981"/>
      <stop offset="100%" stop-color="#065f46"/>
    </linearGradient>
    <linearGradient id="glow" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#4ade80" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="#38bdf8" stop-opacity="0.8"/>
    </linearGradient>
    <filter id="neon" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="16" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <radialGradient id="ring" cx="50%" cy="50%" r="50%">
      <stop offset="70%" stop-color="#22c55e" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="#22c55e" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Background -->
  <rect width="800" height="800" rx="40" fill="url(#bg)"/>
  <circle cx="400" cy="400" r="360" fill="url(#ring)"/>
  <circle cx="400" cy="400" r="320" fill="none" stroke="#1e293b" stroke-width="3" stroke-dasharray="10 8"/>
  <circle cx="400" cy="400" r="280" fill="none" stroke="url(#glow)" stroke-width="4" filter="url(#neon)"/>

  <!-- Center Emblem -->
  <circle cx="400" cy="340" r="170" fill="#0f172a" stroke="url(#accent)" stroke-width="8"/>
  
  <!-- Mascot Graphic -->
  <g transform="translate(400, 330)">
    <!-- Ears / Horns -->
    <path d="M-80 -80 L-120 -180 L-20 -110 Z" fill="#22c55e"/>
    <path d="M80 -80 L120 -180 L20 -110 Z" fill="#22c55e"/>
    <path d="M-70 -85 L-105 -165 L-30 -115 Z" fill="#86efac"/>
    <path d="M70 -85 L105 -165 L30 -115 Z" fill="#86efac"/>

    <!-- Face Silhouette -->
    <ellipse cx="0" cy="0" rx="125" ry="110" fill="#111827"/>
    <circle cx="0" cy="20" r="70" fill="#1e293b"/>

    <!-- Eyes (Laser Glow) -->
    <ellipse cx="-45" cy="-15" rx="24" ry="14" fill="#22c55e" filter="url(#neon)"/>
    <ellipse cx="45" cy="-15" rx="24" ry="14" fill="#22c55e" filter="url(#neon)"/>
    <ellipse cx="-45" cy="-15" rx="10" ry="10" fill="#ffffff"/>
    <ellipse cx="45" cy="-15" rx="10" ry="10" fill="#ffffff"/>

    <!-- Snout & Mouth -->
    <polygon points="0,15 -14,2 -14,24" fill="#22c55e"/>
    <path d="M-25,35 Q0,55 25,35" fill="none" stroke="#f8fafc" stroke-width="5" stroke-linecap="round"/>
    
    <!-- Cheeks & Whiskers -->
    <line x1="-80" y1="15" x2="-140" y2="5" stroke="#4ade80" stroke-width="4" stroke-linecap="round"/>
    <line x1="-80" y1="35" x2="-145" y2="40" stroke="#4ade80" stroke-width="4" stroke-linecap="round"/>
    <line x1="80" y1="15" x2="140" y2="5" stroke="#4ade80" stroke-width="4" stroke-linecap="round"/>
    <line x1="80" y1="35" x2="145" y2="40" stroke="#4ade80" stroke-width="4" stroke-linecap="round"/>
  </g>

  <!-- Typography -->
  <text x="400" y="580" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="52" font-weight="900" fill="#ffffff" letter-spacing="2">${name}</text>
  <rect x="250" y="615" width="300" height="42" rx="21" fill="#22c55e"/>
  <text x="400" y="644" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="24" font-weight="900" fill="#050811" letter-spacing="3">${ticker}</text>
  <text x="400" y="700" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="16" font-weight="700" fill="#94a3b8" letter-spacing="1">"${catchphrase}"</text>
</svg>`
}

function generateBannerSvg(kit: LaunchKit): string {
  const name = escapeXml(kit.tokenName)
  const ticker = escapeXml(kit.primaryTicker)
  const headline = escapeXml(kit.website.heroHeadline)
  const subheadline = escapeXml(kit.website.subheadline)
  const chain = escapeXml(kit.tokenomics.chain || 'BASE')
  const supply = escapeXml(kit.tokenomics.supply || '1,000,000,000')

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1500 500" width="1500" height="500">
  <defs>
    <linearGradient id="bannerBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#030712"/>
      <stop offset="60%" stop-color="#091424"/>
      <stop offset="100%" stop-color="#022c22"/>
    </linearGradient>
    <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#22c55e"/>
      <stop offset="100%" stop-color="#38bdf8"/>
    </linearGradient>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" stroke-width="1" stroke-opacity="0.3"/>
    </pattern>
    <filter id="bannerGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="24" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- Background with Cyber Grid -->
  <rect width="1500" height="500" fill="url(#bannerBg)"/>
  <rect width="1500" height="500" fill="url(#grid)"/>

  <!-- Ambient light blobs -->
  <circle cx="200" cy="100" r="280" fill="#22c55e" opacity="0.08" filter="url(#bannerGlow)"/>
  <circle cx="1300" cy="300" r="320" fill="#38bdf8" opacity="0.08" filter="url(#bannerGlow)"/>

  <!-- Left Hero Copy -->
  <g transform="translate(100, 100)">
    <!-- Badge -->
    <rect x="0" y="0" width="220" height="36" rx="18" fill="#14532d" stroke="#22c55e" stroke-width="1.5"/>
    <circle cx="18" cy="18" r="6" fill="#4ade80"/>
    <text x="34" y="24" font-family="Inter, system-ui, sans-serif" font-size="14" font-weight="800" fill="#86efac" letter-spacing="2">DEPLOYED ON ${chain.toUpperCase()}</text>

    <!-- Main Title -->
    <text x="0" y="105" font-family="Inter, system-ui, sans-serif" font-size="68" font-weight="900" fill="#ffffff" letter-spacing="-1">${name}</text>
    <text x="0" y="165" font-family="Inter, system-ui, sans-serif" font-size="34" font-weight="800" fill="url(#accentGrad)" letter-spacing="1">${ticker} · ${headline}</text>
    <text x="0" y="215" font-family="Inter, system-ui, sans-serif" font-size="18" font-weight="500" fill="#94a3b8" width="700">${subheadline}</text>

    <!-- Stat Pill Boxes -->
    <g transform="translate(0, 260)">
      <rect x="0" y="0" width="160" height="56" rx="12" fill="#0f172a" stroke="#334155" stroke-width="1"/>
      <text x="16" y="24" font-family="Inter, sans-serif" font-size="11" font-weight="700" fill="#64748b" letter-spacing="1">TOTAL SUPPLY</text>
      <text x="16" y="44" font-family="Inter, sans-serif" font-size="16" font-weight="900" fill="#ffffff">${supply}</text>

      <rect x="180" y="0" width="140" height="56" rx="12" fill="#0f172a" stroke="#334155" stroke-width="1"/>
      <text x="196" y="24" font-family="Inter, sans-serif" font-size="11" font-weight="700" fill="#64748b" letter-spacing="1">TAX (BUY/SELL)</text>
      <text x="196" y="44" font-family="Inter, sans-serif" font-size="16" font-weight="900" fill="#4ade80">0% / 0%</text>

      <rect x="340" y="0" width="170" height="56" rx="12" fill="#0f172a" stroke="#334155" stroke-width="1"/>
      <text x="356" y="24" font-family="Inter, sans-serif" font-size="11" font-weight="700" fill="#64748b" letter-spacing="1">LIQUIDITY STATUS</text>
      <text x="356" y="44" font-family="Inter, sans-serif" font-size="16" font-weight="900" fill="#38bdf8">100% LOCKED</text>
    </g>
  </g>

  <!-- Right Mascot Showcase -->
  <g transform="translate(1220, 250)">
    <circle cx="0" cy="0" r="160" fill="#0f172a" stroke="url(#accentGrad)" stroke-width="6" filter="url(#bannerGlow)"/>
    <circle cx="0" cy="0" r="140" fill="#020617"/>
    <g transform="translate(0, -10) scale(0.75)">
      <path d="M-60 -60 L-90 -140 L-15 -80 Z" fill="#22c55e"/>
      <path d="M60 -60 L90 -140 L15 -80 Z" fill="#22c55e"/>
      <ellipse cx="0" cy="10" rx="90" ry="75" fill="#1e293b"/>
      <ellipse cx="-35" cy="-5" rx="18" ry="10" fill="#22c55e"/>
      <ellipse cx="35" cy="-5" rx="18" ry="10" fill="#22c55e"/>
      <circle cx="-35" cy="-5" r="5" fill="#ffffff"/>
      <circle cx="35" cy="-5" r="5" fill="#ffffff"/>
      <path d="M-15,30 Q0,45 15,30" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round"/>
    </g>
    <rect x="-80" y="100" width="160" height="34" rx="17" fill="#22c55e"/>
    <text x="0" y="123" text-anchor="middle" font-family="Inter, sans-serif" font-size="16" font-weight="900" fill="#050811" letter-spacing="2">${ticker}</text>
  </g>
</svg>`
}

export async function generateImageAsset(
  kit: LaunchKit,
  type: ImageAssetType = 'logo',
  options: { forceSvg?: boolean } = {},
): Promise<GeneratedImageResult> {
  const config = getImageConfig()
  const prompt = type === 'logo' ? kit.logoPrompt : kit.bannerPrompt

  if (!options.forceSvg && config.provider === 'openai' && config.apiKey) {
    try {
      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: `${prompt}. High resolution cryptocurrency token ${type}, crypto branding aesthetic, vivid cinematic neon lighting, transparent/clean background, vector style.`,
          n: 1,
          size: type === 'logo' ? '1024x1024' : '1792x1024',
        }),
      })

      if (response.ok) {
        const data = (await response.json()) as { data?: Array<{ url?: string }> }
        const remoteUrl = data.data?.[0]?.url
        if (remoteUrl) {
          return {
            kind: 'remote',
            url: remoteUrl,
            prompt,
            type,
          }
        }
      }
    } catch (err) {
      console.warn('OpenAI Image API generation failed, falling back to dynamic vector SVG:', err)
    }
  }

  // Vector SVG generation fallback
  const svg = type === 'logo' ? generateLogoSvg(kit) : generateBannerSvg(kit)
  const base64 = Buffer.from(svg).toString('base64')
  return {
    kind: 'svg',
    url: `data:image/svg+xml;base64,${base64}`,
    prompt,
    type,
    svgContent: svg,
  }
}
