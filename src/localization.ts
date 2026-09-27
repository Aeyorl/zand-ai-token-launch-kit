import type { LaunchKit } from './brandGenerator'

export interface LanguageManifesto {
  languageCode: 'en' | 'zh' | 'kr' | 'jp' | 'es'
  languageName: string
  flag: string
  title: string
  tagline: string
  lore: string
  tokenomicsSummary: string
  raidMessages: string[]
  markdown: string
}

export function generateLocalizedManifestos(kit: LaunchKit): Record<string, LanguageManifesto> {
  const symbol = kit.primaryTicker
  const cleanSymbol = symbol.replace('$', '')
  const supply = kit.tokenomics?.supply || '1,000,000,000'

  // 1. Chinese (Simplified)
  const zhRaidMessages = [
    `🔥 $${cleanSymbol} 强势起飞！0预售，0税率，100%流动性永久销毁/锁定！加入社区冲锋：`,
    `🚀 华尔街退散，$${cleanSymbol} 属于每一个散户！由AI生成、由社区推动的真正Meme王者！#MemeSeason #加密货币`,
    `💎 钻石手集合！$${cleanSymbol} 现已在 Robinhood 链、Base 和以太坊同步上线，拒绝割韭菜，共同见证千倍神话！`,
  ]

  const zhMarkdown = `# ${kit.tokenName} ($${cleanSymbol}) — 官方中文宣言与冲锋指南

### 1. 核心理念与故事
${kit.tokenName} 诞生于去中心化互联网精神。无风投预留、无团队隐藏代币、无拉地毯风险。
"${kit.character?.catchphrase || kit.tokenName}"

### 2. 经济模型 (Tokenomics)
- **代币总量:** ${supply}
- **交易税率:** 0% 买入 / 0% 卖出 (无摩擦零售交易)
- **流动性状态:** 100% 锁仓 / 销毁 (支持 Robinhood Chain、Base 和以太坊)

### 3. 社群推广话术 (微信 / Telegram / BTOK)
${zhRaidMessages.map((msg, i) => `${i + 1}. ${msg}`).join('\n')}
`

  // 2. Korean
  const krRaidMessages = [
    `🔥 $${cleanSymbol} 공식 론칭! 사전판매 0%, 세금 0%, LP 100% 영구 락업 완료! 지금 커뮤니티 합류하세요:`,
    `🚀 기관과 세력에 맞서는 진정한 커뮤니티 밈코인 $${cleanSymbol}! AI 기반 브랜딩과 강력한 결속력!`,
    `💎 다이아몬드 손 홀더 집결! Robinhood Chain 및 Base 메인넷에서 검증 완료! #가상자산 #밈코인 #100배`,
  ]

  const krMarkdown = `# ${kit.tokenName} ($${cleanSymbol}) — 공식 한국어 매니페스토 및 화력 지원 가이드

### 1. 프로젝트 비전 및 세계관
${kit.tokenName}은(는) 탈중앙화 인터넷 문화에서 탄생했습니다. VC 덤핑 없음, 개발자 덤핑 없음, 100% 공정 배분.
"${kit.character?.catchphrase || kit.tokenName}"

### 2. 토크노믹스 (Tokenomics)
- **총 발행량:** ${supply}
- **매수/매도 세금:** 0% / 0% (완전한 거래 자유)
- **유동성 상태:** 100% 락업 및 소각 (Robinhood Chain, Base, Ethereum)

### 3. 커뮤니티 레이드 스크립트 (텔레그램 / 카카오톡)
${krRaidMessages.map((msg, i) => `${i + 1}. ${msg}`).join('\n')}
`

  // 3. Japanese
  const jpRaidMessages = [
    `🔥 $${cleanSymbol} 公式ローンチ！プレセールなし、税率0%、LP100%永久ロック！コミュニティに参加しよう：`,
    `🚀 ウォール街に立ち向かう真のミームトークン $${cleanSymbol}！AIが創り出した最強のブランドと仲間たち！`,
    `💎 ガチホ勢集結！Robinhood ChainおよびBaseで検証済み！月まで突撃！🚀 #暗号資産 #ミームコイン`,
  ]

  const jpMarkdown = `# ${kit.tokenName} ($${cleanSymbol}) — 公式日本語マニフェスト＆レイドガイド

### 1. プロジェクトの理念とストーリー
${kit.tokenName}は、分散型インターネットの情熱から生まれました。VCなし、不透明なロックなし、100%フェアローンチ。
「${kit.character?.catchphrase || kit.tokenName}」

### 2. トークノミクス
- **総供給量:** ${supply}
- **取引税:** 0% 購入 / 0% 売却
- **流動性:** 100% ロック/バーン完了 (Robinhood Mainnet, Base, Ethereum)

### 3. コミュニティ拡散用メッセージ (X / LINE / Discord)
${jpRaidMessages.map((msg, i) => `${i + 1}. ${msg}`).join('\n')}
`

  // 4. Spanish
  const esRaidMessages = [
    `🔥 ¡$${cleanSymbol} está dominando el mercado! Sin preventa, 0% impuestos, 100% liquidez bloqueada para siempre. ¡Únete a la comunidad!`,
    `🚀 ¡Abajo Wall Street, arriba la comunidad! $${cleanSymbol} es el token definitivo impulsado por IA. ¡A la luna! 🚀`,
    `💎 ¡Manos de diamante activadas! Verificado en Robinhood Chain, Base y Ethereum. ¡Cero alfombras, 100% poder comunitario!`,
  ]

  const esMarkdown = `# ${kit.tokenName} ($${cleanSymbol}) — Manifiesto Oficial en Español y Guía de Invasión

### 1. Narrativa y Filosofía
${kit.tokenName} nació del espíritu salvaje del internet. Sin fondos de capital de riesgo, sin manipulación de ballenas, 100% distribución justa.
"${kit.character?.catchphrase || kit.tokenName}"

### 2. Tokenomics
- **Suministro Total:** ${supply}
- **Impuesto (Tax):** 0% Compra / 0% Venta
- **Liquidez:** 100% Bloqueada / Quemada (Robinhood Chain, Base, Ethereum)

### 3. Mensajes de Asalto Comunitario (Telegram / Twitter / Discord)
${esRaidMessages.map((msg, i) => `${i + 1}. ${msg}`).join('\n')}
`

  // 5. English (Original)
  const enRaidMessages = [
    `🔥 $${cleanSymbol} is taking over! 0% presale, 0% tax, 100% liquidity locked forever. Raid with us!`,
    `🚀 Community-powered meme engine. Built by AI, owned by the people. #MemeSeason #${cleanSymbol}`,
    `💎 Diamond hands only. Verified on Robinhood Chain, Base, and Ethereum. To the moon! 🚀`,
  ]

  const enMarkdown = `# ${kit.tokenName} ($${cleanSymbol}) — Official Manifesto & Community Raid Kit

### 1. Narrative & Lore
${kit.lore}
"${kit.character?.catchphrase || kit.tokenName}"

### 2. Tokenomics
- **Total Supply:** ${supply}
- **Tax:** 0% / 0%
- **Liquidity Status:** 100% Locked / Burned

### 3. Viral Raid Scripts
${enRaidMessages.map((msg, i) => `${i + 1}. ${msg}`).join('\n')}
`

  return {
    en: {
      languageCode: 'en',
      languageName: 'English',
      flag: '🇺🇸',
      title: `${kit.tokenName} Manifesto (EN)`,
      tagline: kit.character?.catchphrase || kit.tokenName,
      lore: kit.lore,
      tokenomicsSummary: `Supply: ${supply} | Tax: 0% / 0% | 100% LP Locked`,
      raidMessages: enRaidMessages,
      markdown: enMarkdown,
    },
    zh: {
      languageCode: 'zh',
      languageName: '中文 (Chinese)',
      flag: '🇨🇳',
      title: `${kit.tokenName} 中文白皮书宣言`,
      tagline: `华尔街退散，散户永存 — $${cleanSymbol}`,
      lore: `${kit.tokenName} 诞生于去中心化互联网精神。无风投预留、无团队隐藏代币。`,
      tokenomicsSummary: `总量: ${supply} | 税率: 0% / 0% | 100% LP锁定`,
      raidMessages: zhRaidMessages,
      markdown: zhMarkdown,
    },
    kr: {
      languageCode: 'kr',
      languageName: '한국어 (Korean)',
      flag: '🇰🇷',
      title: `${kit.tokenName} 한국어 공식 매니페스토`,
      tagline: `세력에 맞서는 진정한 커뮤니티 밈코인 — $${cleanSymbol}`,
      lore: `${kit.tokenName}은(는) 탈중앙화 인터넷 문화에서 탄생했습니다. 100% 공정 배분.`,
      tokenomicsSummary: `발행량: ${supply} | 세금: 0% / 0% | 100% LP락업`,
      raidMessages: krRaidMessages,
      markdown: krMarkdown,
    },
    jp: {
      languageCode: 'jp',
      languageName: '日本語 (Japanese)',
      flag: '🇯🇵',
      title: `${kit.tokenName} 公式日本語マニフェスト`,
      tagline: `中央集権に挑む最強のミーム — $${cleanSymbol}`,
      lore: `${kit.tokenName}は、分散型インターネットの情熱から生まれました。100%フェアローンチ。`,
      tokenomicsSummary: `供給量: ${supply} | 取引税: 0% / 0% | 100% LPロック`,
      raidMessages: jpRaidMessages,
      markdown: jpMarkdown,
    },
    es: {
      languageCode: 'es',
      languageName: 'Español (Spanish)',
      flag: '🇪🇸',
      title: `${kit.tokenName} Manifiesto en Español`,
      tagline: `¡Poder comunitario sin límites! — $${cleanSymbol}`,
      lore: `${kit.tokenName} nació del espíritu salvaje del internet. 100% distribución justa.`,
      tokenomicsSummary: `Suministro: ${supply} | Impuesto: 0% / 0% | 100% LP Bloqueado`,
      raidMessages: esRaidMessages,
      markdown: esMarkdown,
    },
  }
}
