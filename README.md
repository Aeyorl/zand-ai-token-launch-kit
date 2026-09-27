# ZAND AI — Meme Generator + Token Launch Kit (Full SaaS Edition)

**Describe a meme. AI builds the brand.**

ZAND AI is an end-to-end Web3 & Crypto SaaS platform for automated meme-token brand generation, creative asset production, smart contract deployment, and community storytelling.

A founder enters a concept like:
> Angry billionaire cat that hates Wall Street.

ZAND AI generates the complete launch package:
- **Token Name & Ticker Suggestions** ($CLAW, $FATCAT, $ROAR)
- **1:1 Mascot Logo & 3:1 Social Header Banner Generation**
- **Character Persona, Archetype, & Catchphrase**
- **Conversion-Optimized Website Hero & CTAs**
- **Viral Origin Story, Lore, & Manifesto**
- **Ready-to-Post Launch Tweets & Meme Templates**
- **Standardized Tokenomics Blueprint**
- **Production ERC20 Solidity Contract Code & Multi-Chain Deployment Wizard**
- **Founder-Ready Markdown & JSON Export**

---

## Production SaaS Architecture

### 1. Real Backend API (`server/`)
- **Express Backend**: Full REST API server (`server/app.ts`, `server/index.ts`) with request validation, health checks, error handling, CORS, and raw webhook handling.
- **API Endpoints**:
  - `GET /api/health` — Service health and active AI/Stripe/Image feature status
  - `POST /api/auth/register` — Create user account with hashed password and JWT
  - `POST /api/auth/login` — Authenticate and issue Bearer JWT
  - `GET /api/auth/me` — Authenticated session lookup & tier validation
  - `POST /api/auth/logout` — Invalidate session
  - `POST /api/generate` — Generate full launch kit via configured AI provider
  - `POST /api/images/generate` — Generate 1:1 Logo or 3:1 Banner (AI or vector SVG)
  - `GET /api/projects` — List user's saved launch kits
  - `POST /api/projects` — Save current kit to user's account
  - `GET /api/projects/:id` — Get single saved project
  - `PUT /api/projects/:id` — Update saved project
  - `DELETE /api/projects/:id` — Delete saved project
  - `POST /api/checkout/create-session` — Create Stripe checkout session for Pro/Founder tiers
  - `POST /api/checkout/portal` — Create Stripe customer billing portal session
  - `POST /api/webhooks/stripe` — Real-time webhook handler for subscription lifecycle
  - `GET /api/deploy/networks` — List supported EVM networks
  - `POST /api/deploy/prepare` — Build production ERC20 Solidity contract, ABI, and plan
  - `POST /api/deploy/simulate` — Validate deployer address, network, and preflight checks
  - `POST /api/deploy/record` — Record deployed contract, tx hash, and explorer links
  - `GET /api/deploy/history` — Get deployment history for authenticated user

### 2. Database & Persistence Layer (`server/db.ts`)
- Zero-dependency, portable persistence engine with atomic file writes to `./data/db.json` (configurable via `DATABASE_FILE`).
- Safe in-memory mode for unit and integration testing without disk side effects.
- Clean models with strong scoping: `User`, `SavedProject`, `DeploymentRecord`.

### 3. Authentication & Security (`server/auth.ts`)
- PBKDF2/SHA-256 password hashing with unique 16-byte random salts.
- Native crypto HMAC-SHA256 JWT tokens with expiration handling.
- Express `requireAuth` and `optionalAuth` middlewares.
- No hardcoded secrets: configured purely through `JWT_SECRET`.

### 4. AI Provider Integration (`server/aiProvider.ts`)
- Multi-provider support via environment variables:
  - **OpenAI** (`gpt-4o-mini`, `gpt-4o`)
  - **Anthropic** (`claude-3-5-haiku`, `claude-3-5-sonnet`)
  - **Groq** (`llama-3.3-70b-versatile`)
  - **Google Gemini** (`gemini-1.5-flash`)
  - **OpenRouter** / Custom OpenAI-compatible endpoints (`AI_BASE_URL`)
- Resilient fallback: If provider keys are absent or an API error occurs, automatically falls back to the deterministic local brand engine without crashing.

### 5. Creative Studio: Image, Logo & Banner Generation (`server/imageProvider.ts`)
- **Dual Format Studio**:
  - `Logo (1:1)`: Square mascot emblem for Uniswap/DEXScreener/CoinGecko.
  - `Banner (3:1)`: 1500x500 panoramic header for X / Telegram.
- **OpenAI DALL-E Integration** via `IMAGE_PROVIDER=openai`.
- **Dynamic Vector SVG Renderer Fallback**: Generates crisp, lightweight vector graphics customized with token typography, ticker, theme colors, and glow filters.
- 1-click Download SVG and Copy SVG Data URL in the browser.

### 6. Stripe Subscriptions & Billing (`server/stripe.ts`)
- 3-tier membership model:
  - **Free / Degen ($0)**: 3 launches/day, SVG asset export, local storage.
  - **Pro / Dev ($29/mo)**: Unlimited AI generations, cloud AI integration, HD image studio, unlimited saved projects, contract export.
  - **Founder / Chad ($99/mo)**: 1-click Base & Arbitrum deployment wizard, verification checklist, priority model routing, telegram exports.
- Real Stripe Checkout Session creation and Customer Portal management.
- Webhook signature verification (`STRIPE_WEBHOOK_SECRET`) for `checkout.session.completed` and subscription events.

### 7. Token Deployment Flow (`server/deployment.ts`)
- Multi-chain support for **Base Mainnet**, **Base Sepolia Testnet**, **Arbitrum One**, **Arbitrum Sepolia**, **Ethereum Mainnet**, and **Ethereum Sepolia**.
- Standard compliant OpenZeppelin ERC20 implementation with Ownable and Burnable extensions.
- Deployment simulation, constructor argument encoding, and 7-point safety checklist.
- Generates 1-click Remix IDE links and Foundry deploy scripts.
- On-chain deployment recording and block explorer linking.

### 8. Frontend SaaS Screens (`src/`)
- **Navbar**: User profile, active tier badge (`FREE`, `PRO`, `FOUNDER`), Saved Kits drawer button, Upgrade button.
- **Auth Modal**: Tabbed Sign In / Register dialog with validation and error reporting.
- **Saved Projects Drawer**: Browse, load, copy markdown, and delete saved kits.
- **Image & Banner Studio Section**: Switch between Logo and Banner tabs with live vector preview and export controls.
- **Pricing & Upgrade Modal**: Plan comparison with 1-click Stripe checkout.
- **Token Deployment Wizard**: Network selector, contract preview, pre-flight safety checklist, and simulated/live deployment execution.

---

## Deployment & Configuration

### Environment Variables (`.env`)
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

| Variable | Description | Default |
|---|---|---|
| `PORT` | Backend server port | `3001` |
| `NODE_ENV` | Environment mode (`development` or `production`) | `development` |
| `DATABASE_FILE` | Path to persistent database file | `./data/db.json` |
| `JWT_SECRET` | Secret key for signing auth tokens | (required in prod) |
| `AI_PROVIDER` | `openai` \| `anthropic` \| `groq` \| `gemini` \| `openrouter` \| `fallback` | `fallback` |
| `AI_API_KEY` | API key for the chosen AI provider | - |
| `AI_MODEL` | AI model name (e.g. `gpt-4o-mini`, `claude-3-5-haiku-latest`) | - |
| `IMAGE_PROVIDER` | `openai` \| `fallback` | `fallback` |
| `IMAGE_API_KEY` | API key for image provider | - |
| `STRIPE_SECRET_KEY` | Stripe secret key (`sk_live_...` or `sk_test_...`) | - |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret (`whsec_...`) | - |
| `STRIPE_PRICE_PRO` | Stripe Price ID for Pro tier | `price_pro_monthly` |
| `STRIPE_PRICE_FOUNDER` | Stripe Price ID for Founder tier | `price_founder_monthly` |

### Running Locally
```bash
# 1. Install dependencies
npm install

# 2. Start Vite frontend (with proxy to :3001)
npm run dev

# 3. Start Express backend API (in a separate terminal)
npm run server
```

### Docker & Docker Compose
```bash
# Run full production stack with containerized persistent storage
docker-compose up --build
```

---

## Quality & Test Verification

All tests, linting, and production builds pass without errors:

```bash
# Run unit & integration tests
npm test

# Run Oxlint
npm run lint

# Run TypeScript check & Vite production build
npm run build
```
