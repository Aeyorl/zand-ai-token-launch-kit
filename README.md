# ZAND AI — Meme Generator + Token Launch Kit

**Describe a meme. AI builds the brand.**

ZAND AI is a polished React + TypeScript product prototype for an AI-powered meme-token launch kit generator. It now includes the first production-layer backend core and offline API contracts for auth, saved projects, AI generation fallback, image assets, checkout links, and token deployment planning. A user enters a concept like:

> Angry billionaire cat that hates Wall Street.

The app generates a complete launch package:

- Token name
- Ticker suggestions
- Logo prompt
- Character / mascot direction
- Website copy
- Lore and manifesto
- Social posts
- Meme templates
- Banner prompt
- Community description
- Tokenomics placeholder copy
- Founder-ready Markdown export

## Why this exists

Most meme launches fail because they ship with an empty Telegram, weak lore, stolen memes, and no coherent narrative. ZAND AI sells the creation engine — the picks-and-shovels tool every token launch needs.

## Tech stack

- React
- TypeScript
- Vite
- Vitest
- Express-ready backend core
- Offline API fallback for demos without provider keys
- Stripe checkout payload scaffolding
- Token deployment plan generator
- Pure CSS, no UI framework

## Latest production-layer update

This repo includes test-covered scaffolding for the next SaaS layer:

- `server/core.ts` — user sessions, in-memory project storage, AI fallback generation, SVG image asset generation, checkout session payloads, and ERC20 deployment plan generation.
- `src/api.ts` — frontend-safe offline product API for auth, generated kits, saved projects, checkout, and deployment preparation.
- Contract tests covering backend and frontend product flows.

Real provider keys are intentionally not committed. Production deployments should connect AI/image/payment/token-deployment providers through environment variables and server-side secrets.

## Local development

```bash
npm install
npm run dev
```

## Quality checks

```bash
npm run lint
npm test
npm run build
```

## Product thesis

The platform can have its own token/community because the token is wrapped around the generator itself: a tool for creating the brand assets every meme coin needs before launch.
