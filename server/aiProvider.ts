import { generateLaunchKit, type LaunchKit } from '../src/brandGenerator'

export interface AiProviderConfig {
  provider: 'openai' | 'anthropic' | 'groq' | 'gemini' | 'openrouter' | 'fallback'
  apiKey?: string
  model?: string
  baseUrl?: string
}

export function getAiConfig(): AiProviderConfig {
  const provider = (process.env.AI_PROVIDER || 'fallback').toLowerCase() as AiProviderConfig['provider']
  const apiKey = process.env.AI_API_KEY || process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY || process.env.GROQ_API_KEY || ''
  const baseUrl = process.env.AI_BASE_URL || ''

  let defaultModel = 'gpt-4o-mini'
  if (provider === 'anthropic') defaultModel = 'claude-3-5-haiku-latest'
  if (provider === 'groq') defaultModel = 'llama-3.3-70b-versatile'
  if (provider === 'gemini') defaultModel = 'gemini-1.5-flash'
  if (provider === 'openrouter') defaultModel = 'meta-llama/llama-3.3-70b-instruct'

  const model = process.env.AI_MODEL || defaultModel

  return {
    provider,
    apiKey,
    model,
    baseUrl,
  }
}

export function getAiProviderStatus(): {
  configured: boolean
  provider: string
  model: string
} {
  const config = getAiConfig()
  const isConfigured = Boolean(config.apiKey && config.provider !== 'fallback')
  return {
    configured: isConfigured,
    provider: config.provider,
    model: config.model || 'deterministic-fallback',
  }
}

const SYSTEM_PROMPT = `You are ZAND AI, an elite crypto meme-coin branding engine and narrative strategist.
Given a user prompt describing a meme or token idea, return a JSON object with this exact structure:
{
  "tokenName": string (e.g. "WallStreet Claw"),
  "tickers": string[] (3-4 tickers, e.g. ["$CLAW", "$FATCAT", "$ROAR"]),
  "primaryTicker": string (e.g. "$CLAW"),
  "logoPrompt": string (detailed image prompt for 1:1 token logo),
  "character": {
    "name": string,
    "archetype": string,
    "visualDirection": string,
    "catchphrase": string
  },
  "website": {
    "heroHeadline": string,
    "subheadline": string,
    "ctas": string[] (e.g. ["Buy on Base", "Join Telegram", "Read Lore"])
  },
  "lore": string (compelling 2-3 paragraph origin story and meme manifesto),
  "communityDescription": string (culture, Telegram voice, vibe),
  "socialPosts": string[] (3 punchy X / Twitter launch posts),
  "memeTemplates": [
    { "title": string, "top": string, "bottom": string }
  ],
  "bannerPrompt": string (detailed banner art prompt for 3:1 Twitter / Telegram header),
  "tokenomics": {
    "supply": string (e.g. "1,000,000,000"),
    "tax": string (e.g. "0/0"),
    "liquidity": string (e.g. "100% burned / locked on Uniswap"),
    "chain": string (e.g. "Base")
  }
}
Return ONLY valid JSON with no markdown wrapping or extra comments.`

export async function generateBrandWithAi(
  prompt: string,
  overrideConfig?: Partial<AiProviderConfig>,
): Promise<LaunchKit> {
  const config: AiProviderConfig = {
    ...getAiConfig(),
    ...overrideConfig,
  }

  if (!config.apiKey || config.provider === 'fallback') {
    return generateLaunchKit(prompt)
  }

  try {
    if (config.provider === 'anthropic') {
      const url = config.baseUrl || 'https://api.anthropic.com/v1/messages'
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: config.model || 'claude-3-5-haiku-latest',
          max_tokens: 2000,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: `Build a full meme token launch kit for: ${prompt}` }],
        }),
      })

      if (!response.ok) {
        throw new Error(`Anthropic API returned status ${response.status}`)
      }

      const data = (await response.json()) as { content?: Array<{ text?: string }> }
      const text = data.content?.[0]?.text || ''
      const cleaned = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim()
      const parsed = JSON.parse(cleaned) as LaunchKit
      if (parsed.tokenName && parsed.primaryTicker && parsed.character) {
        return sanitizeLaunchKit(parsed, prompt)
      }
    } else if (config.provider === 'gemini') {
      const model = config.model || 'gemini-1.5-flash'
      const url =
        config.baseUrl ||
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.apiKey}`
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `${SYSTEM_PROMPT}\n\nUser request: Build a full meme token launch kit for: ${prompt}`,
                },
              ],
            },
          ],
        }),
      })

      if (!response.ok) {
        throw new Error(`Gemini API returned status ${response.status}`)
      }

      const data = (await response.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
      }
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
      const cleaned = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim()
      const parsed = JSON.parse(cleaned) as LaunchKit
      if (parsed.tokenName && parsed.primaryTicker && parsed.character) {
        return sanitizeLaunchKit(parsed, prompt)
      }
    } else {
      // Default: OpenAI / Groq / OpenRouter / Custom compatible API
      let endpoint = 'https://api.openai.com/v1/chat/completions'
      if (config.provider === 'groq') {
        endpoint = 'https://api.groq.com/openai/v1/chat/completions'
      } else if (config.provider === 'openrouter') {
        endpoint = 'https://openrouter.ai/api/v1/chat/completions'
      }
      if (config.baseUrl) {
        endpoint = `${config.baseUrl.replace(/\/$/, '')}/chat/completions`
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model || 'gpt-4o-mini',
          temperature: 0.8,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: `Build a full meme token launch kit for: ${prompt}` },
          ],
          response_format: { type: 'json_object' },
        }),
      })

      if (!response.ok) {
        throw new Error(`${config.provider} API returned status ${response.status}`)
      }

      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>
      }
      const content = data.choices?.[0]?.message?.content || ''
      const parsed = JSON.parse(content) as LaunchKit
      if (parsed.tokenName && parsed.primaryTicker && parsed.character) {
        return sanitizeLaunchKit(parsed, prompt)
      }
    }
  } catch (err) {
    console.warn(`AI generation with provider "${config.provider}" failed, using fallback:`, err)
  }

  return generateLaunchKit(prompt)
}

function sanitizeLaunchKit(kit: LaunchKit, fallbackPrompt: string): LaunchKit {
  const fallback = generateLaunchKit(fallbackPrompt)
  return {
    tokenName: kit.tokenName || fallback.tokenName,
    tickers: Array.isArray(kit.tickers) && kit.tickers.length > 0 ? kit.tickers : fallback.tickers,
    primaryTicker: kit.primaryTicker || fallback.primaryTicker,
    logoPrompt: kit.logoPrompt || fallback.logoPrompt,
    character: {
      name: kit.character?.name || fallback.character.name,
      archetype: kit.character?.archetype || fallback.character.archetype,
      visualDirection: kit.character?.visualDirection || fallback.character.visualDirection,
      catchphrase: kit.character?.catchphrase || fallback.character.catchphrase,
    },
    website: {
      heroHeadline: kit.website?.heroHeadline || fallback.website.heroHeadline,
      subheadline: kit.website?.subheadline || fallback.website.subheadline,
      ctas: Array.isArray(kit.website?.ctas) && kit.website.ctas.length > 0 ? kit.website.ctas : fallback.website.ctas,
    },
    lore: kit.lore || fallback.lore,
    communityDescription: kit.communityDescription || fallback.communityDescription,
    socialPosts: Array.isArray(kit.socialPosts) && kit.socialPosts.length > 0 ? kit.socialPosts : fallback.socialPosts,
    memeTemplates:
      Array.isArray(kit.memeTemplates) && kit.memeTemplates.length > 0 ? kit.memeTemplates : fallback.memeTemplates,
    bannerPrompt: kit.bannerPrompt || fallback.bannerPrompt,
    tokenomics: {
      supply: kit.tokenomics?.supply || fallback.tokenomics.supply,
      tax: kit.tokenomics?.tax || fallback.tokenomics.tax,
      liquidity: kit.tokenomics?.liquidity || fallback.tokenomics.liquidity,
      chain: kit.tokenomics?.chain || fallback.tokenomics.chain,
    },
  }
}
