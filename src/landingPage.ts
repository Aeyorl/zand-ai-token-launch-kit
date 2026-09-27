import type { LaunchKit } from './brandGenerator'

export interface LandingPageOptions {
  contractAddress?: string
  networkName?: string
  bannerSvg?: string
  logoSvg?: string
  explorerUrl?: string
  telegramUrl?: string
  twitterUrl?: string
}

export function generateLandingPageHtml(kit: LaunchKit, options?: LandingPageOptions): string {
  const contract = options?.contractAddress || '0x42170bA5E8C9472DaE419Fa432170DEAdbeef123'
  const network = options?.networkName || 'Robinhood Chain Mainnet (42170)'
  const explorerUrl = options?.explorerUrl || 'https://explorer.robinhood.com'
  const telegramUrl = options?.telegramUrl || 'https://t.me/portal'
  const twitterUrl = options?.twitterUrl || 'https://x.com'
  const supply = kit.tokenomics?.supply || '1,000,000,000'
  const tax = kit.tokenomics?.tax || '0% Buy / 0% Sell'
  const liquidity = kit.tokenomics?.liquidity || '100% LP Burned / Locked'

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${kit.tokenName} (${kit.primaryTicker}) — Official Token Portal</title>
  <meta name="description" content="${kit.website?.subheadline || kit.character?.catchphrase || kit.tokenName}" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #090b10;
      --card-bg: rgba(18, 23, 35, 0.75);
      --card-border: rgba(0, 240, 255, 0.2);
      --card-border-hover: rgba(0, 240, 255, 0.6);
      --primary: #00f0ff;
      --secondary: #7928ca;
      --accent: #ff007a;
      --success: #00e676;
      --text: #f0f4f8;
      --text-muted: #8899ac;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      background: var(--bg);
      background-image: 
        radial-gradient(circle at 15% 20%, rgba(0, 240, 255, 0.08) 0%, transparent 40%),
        radial-gradient(circle at 85% 80%, rgba(121, 40, 202, 0.12) 0%, transparent 45%);
      color: var(--text);
      font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif;
      line-height: 1.6;
      min-height: 100vh;
      overflow-x: hidden;
    }
    .mono {
      font-family: 'JetBrains Mono', monospace;
    }
    .container {
      max-width: 1100px;
      margin: 0 auto;
      padding: 0 24px;
    }
    header {
      padding: 24px 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }
    .brand-logo {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 20px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }
    .brand-badge {
      background: linear-gradient(135deg, var(--primary), var(--secondary));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .nav-links {
      display: flex;
      gap: 16px;
      align-items: center;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 10px 20px;
      border-radius: 9999px;
      font-weight: 700;
      font-size: 14px;
      text-decoration: none;
      cursor: pointer;
      transition: all 0.2s ease;
      border: none;
    }
    .btn-primary {
      background: linear-gradient(135deg, #00f0ff, #0070f3);
      color: #040810;
      box-shadow: 0 0 20px rgba(0, 240, 255, 0.4);
    }
    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 0 30px rgba(0, 240, 255, 0.7);
    }
    .btn-outline {
      background: rgba(255, 255, 255, 0.05);
      color: var(--text);
      border: 1px solid rgba(255, 255, 255, 0.15);
    }
    .btn-outline:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: var(--primary);
    }
    .hero {
      padding: 80px 0 60px;
      text-align: center;
    }
    .pill {
      display: inline-block;
      padding: 6px 16px;
      background: rgba(0, 240, 255, 0.1);
      border: 1px solid rgba(0, 240, 255, 0.3);
      border-radius: 9999px;
      color: var(--primary);
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 20px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    h1 {
      font-size: clamp(36px, 6vw, 64px);
      font-weight: 700;
      line-height: 1.1;
      margin-bottom: 20px;
      background: linear-gradient(180deg, #ffffff 30%, #94a3b8 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .hero p {
      font-size: 18px;
      color: var(--text-muted);
      max-width: 650px;
      margin: 0 auto 36px;
    }
    .ca-box {
      max-width: 680px;
      margin: 0 auto 40px;
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 12px 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      backdrop-filter: blur(10px);
    }
    .ca-text {
      color: var(--primary);
      font-size: 14px;
      word-break: break-all;
    }
    .tokenomics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 20px;
      margin: 50px 0;
    }
    .stat-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      padding: 24px;
      border-radius: 16px;
      backdrop-filter: blur(8px);
      transition: all 0.2s ease;
    }
    .stat-card:hover {
      border-color: var(--card-border-hover);
      transform: translateY(-4px);
    }
    .stat-label {
      color: var(--text-muted);
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 8px;
    }
    .stat-val {
      font-size: 24px;
      font-weight: 700;
      color: #ffffff;
    }
    .section-title {
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 24px;
      text-align: center;
    }
    .lore-box {
      background: var(--card-bg);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      padding: 36px;
      margin-bottom: 60px;
      position: relative;
      overflow: hidden;
    }
    .lore-box::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0; height: 3px;
      background: linear-gradient(90deg, var(--primary), var(--secondary), var(--accent));
    }
    .raid-actions {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 16px;
      margin-top: 30px;
    }
    footer {
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      padding: 40px 0;
      text-align: center;
      color: var(--text-muted);
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="brand-logo">
        <span class="brand-badge">${kit.primaryTicker}</span>
        <span>${kit.tokenName}</span>
      </div>
      <div class="nav-links">
        <a href="${telegramUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-outline">Telegram</a>
        <a href="${twitterUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-outline">X / Twitter</a>
        <a href="#swap" class="btn btn-primary">Trade ${kit.primaryTicker}</a>
      </div>
    </header>

    <main>
      <section class="hero">
        <div class="pill">Verified on ${network}</div>
        <h1>The Next Generation of ${kit.tokenName}</h1>
        <p>${kit.website?.subheadline || kit.character?.catchphrase || kit.communityDescription || 'Community-powered token built for viral momentum and decentralized liquidity.'}</p>
        
        <div class="ca-box">
          <span style="font-size: 13px; color: var(--text-muted);">CONTRACT:</span>
          <span id="caText" class="ca-text mono">${contract}</span>
          <button id="copyBtn" class="btn btn-outline" style="padding: 6px 14px; font-size: 12px;" onclick="copyCA()">Copy</button>
        </div>

        <div class="raid-actions">
          <a href="${explorerUrl}/address/${contract}" target="_blank" rel="noopener noreferrer" class="btn btn-outline">View on Explorer</a>
          <a href="${telegramUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-primary">Join Community Raid</a>
        </div>
      </section>

      <section class="tokenomics-grid">
        <div class="stat-card">
          <div class="stat-label">Total Supply</div>
          <div class="stat-val mono">${supply}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Tax / Slippage</div>
          <div class="stat-val" style="color: var(--success);">${tax}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Liquidity Status</div>
          <div class="stat-val" style="color: var(--primary);">${liquidity}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Network / Chain</div>
          <div class="stat-val" style="font-size: 18px; line-height: 1.4;">${network}</div>
        </div>
      </section>

      <section class="lore-box">
        <h2 style="font-size: 22px; margin-bottom: 16px; color: var(--primary);">Official Manifesto &amp; Lore</h2>
        <p style="font-size: 16px; line-height: 1.8; color: #cbd5e1; margin-bottom: 20px;">
          ${kit.lore || 'Born from the internet ethos, driven by relentless collective energy. Zero venture capitalists. 100% fair decentralized distribution.'}
        </p>
        <div style="background: rgba(0, 0, 0, 0.4); border-left: 3px solid var(--accent); padding: 14px 18px; border-radius: 4px; font-style: italic; color: #e2e8f0;">
          "${kit.character?.catchphrase || kit.website?.heroHeadline || kit.tokenName}"
        </div>
      </section>
    </main>

    <footer>
      <p>© ${new Date().getFullYear()} ${kit.tokenName} (${kit.primaryTicker}). All rights reserved. Community governed token.</p>
    </footer>
  </div>

  <script>
    function copyCA() {
      const text = document.getElementById('caText').innerText;
      navigator.clipboard.writeText(text).then(() => {
        const btn = document.getElementById('copyBtn');
        btn.innerText = 'Copied!';
        btn.style.borderColor = '#00e676';
        setTimeout(() => {
          btn.innerText = 'Copy';
          btn.style.borderColor = 'rgba(255, 255, 255, 0.15)';
        }, 2000);
      });
    }
  </script>
</body>
</html>`
}
