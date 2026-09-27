import { useEffect, useMemo, useState } from 'react'
import './App.css'
import {
  type DeploymentPlan,
  type DeploymentRecord,
  type GeneratedImage,
  type LiquidityPlan,
  productApi,
  type ProductProject,
  type ProductUser,
  type RobinhoodAudit,
  type SolanaConfig,
  type TelegramBotBundle,
} from './api'
import { exportLaunchKitMarkdown, generateLaunchKit, type LaunchKit } from './brandGenerator'
import { downloadBlobAsFile, generateRaidKitZip } from './raidKit'

const examples = [
  'Angry billionaire cat that hates Wall Street.',
  'Cute cat with laser eyes protecting delicate girls.',
  'Frog trader who only buys green candles and roasts paper hands.',
]

const NETWORKS = [
  { key: 'base-mainnet', name: 'Base Mainnet', chainId: 8453, currency: 'ETH', isTestnet: false },
  { key: 'base-sepolia', name: 'Base Sepolia Testnet', chainId: 84532, currency: 'ETH', isTestnet: true },
  { key: 'arbitrum-one', name: 'Arbitrum One', chainId: 42161, currency: 'ETH', isTestnet: false },
  { key: 'arbitrum-sepolia', name: 'Arbitrum Sepolia Testnet', chainId: 421614, currency: 'ETH', isTestnet: true },
  { key: 'ethereum-mainnet', name: 'Ethereum Mainnet', chainId: 1, currency: 'ETH', isTestnet: false },
  { key: 'sepolia-testnet', name: 'Ethereum Sepolia Testnet', chainId: 11155111, currency: 'ETH', isTestnet: true },
]

function App() {
  const [prompt, setPrompt] = useState(examples[0])
  const [activePrompt, setActivePrompt] = useState(examples[0])
  const [copied, setCopied] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  // Auth state
  const [user, setUser] = useState<ProductUser | null>(null)
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authError, setAuthError] = useState<string | null>(null)
  const [isAuthLoading, setIsAuthLoading] = useState(false)

  // Projects state
  const [isProjectsOpen, setIsProjectsOpen] = useState(false)
  const [savedProjects, setSavedProjects] = useState<ProductProject[]>([])
  const [isSavingProject, setIsSavingProject] = useState(false)

  // Image Studio state
  const [studioTab, setStudioTab] = useState<'logo' | 'banner'>('logo')
  const [activeImage, setActiveImage] = useState<GeneratedImage | null>(null)
  const [isImageLoading, setIsImageLoading] = useState(false)

  // Pricing / Stripe state
  const [isPricingOpen, setIsPricingOpen] = useState(false)

  // Deployment Wizard state
  const [isDeployOpen, setIsDeployOpen] = useState(false)
  const [selectedNetwork, setSelectedNetwork] = useState('base-mainnet')
  const [deployerAddress, setDeployerAddress] = useState('0x71C...B29')
  const [deploymentPlan, setDeploymentPlan] = useState<DeploymentPlan | null>(null)
  const [checklist, setChecklist] = useState<Record<number, boolean>>({})
  const [deploymentRecord, setDeploymentRecord] = useState<DeploymentRecord | null>(null)
  const [isDeploying, setIsDeploying] = useState(false)

  // Option 2 & 3: Ecosystems, Robinhood, Solana, Telegram Bot & Raid Kit
  const [isEcosystemOpen, setIsEcosystemOpen] = useState(false)
  const [ecosystemTab, setEcosystemTab] = useState<'ethereum' | 'solana' | 'robinhood' | 'telegram'>('ethereum')
  const [liquidityPlan, setLiquidityPlan] = useState<LiquidityPlan | null>(null)
  const [robinhoodAudit, setRobinhoodAudit] = useState<RobinhoodAudit | null>(null)
  const [solanaConfig, setSolanaConfig] = useState<SolanaConfig | null>(null)
  const [telegramBot, setTelegramBot] = useState<TelegramBotBundle | null>(null)
  const [selectedBotCommand, setSelectedBotCommand] = useState<string>('/buy')
  const [isDownloadingRaidKit, setIsDownloadingRaidKit] = useState(false)

  // Kit calculation
  const kit: LaunchKit = useMemo(() => generateLaunchKit(activePrompt), [activePrompt])
  const markdown = useMemo(() => exportLaunchKitMarkdown(kit), [kit])

  const showToast = (message: string) => {
    setToast(message)
    setTimeout(() => setToast(null), 3500)
  }

  // Load initial user session & check URL parameters
  useEffect(() => {
    productApi.getMe().then((u) => {
      if (u) setUser(u)
    })

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('billing') === 'success' || params.get('session_id')) {
        const timer = setTimeout(() => {
          setToast('🎉 Subscription updated successfully!')
          setTimeout(() => setToast(null), 3500)
        }, 0)
        return () => clearTimeout(timer)
      }
    }
  }, [])

  // Auto-generate preview image on kit change or tab change
  useEffect(() => {
    let isCancelled = false
    void (async () => {
      const img = await productApi.generateImage(kit, studioTab, true)
      if (!isCancelled) {
        setActiveImage(img)
        setIsImageLoading(false)
      }
    })()
    return () => {
      isCancelled = true
    }
  }, [kit, studioTab])

  // Load saved projects when drawer opens
  useEffect(() => {
    if (isProjectsOpen) {
      productApi.listProjects().then((items) => setSavedProjects(items))
    }
  }, [isProjectsOpen])

  const handleGenerate = async () => {
    setActivePrompt(prompt)
    setCopied(false)
    showToast('Brand launch kit updated!')
  }

  const handleCopy = async () => {
    await navigator.clipboard?.writeText(markdown)
    setCopied(true)
    showToast('Copied brand markdown to clipboard!')
  }

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError(null)
    setIsAuthLoading(true)
    try {
      let loggedUser: ProductUser
      if (authMode === 'register') {
        loggedUser = await productApi.signUp(authEmail, authPassword)
        showToast(`Welcome to ZAND AI, ${loggedUser.email}!`)
      } else {
        loggedUser = await productApi.login(authEmail, authPassword)
        showToast(`Logged in as ${loggedUser.email}`)
      }
      setUser(loggedUser)
      setIsAuthOpen(false)
      setAuthPassword('')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed'
      setAuthError(msg)
    } finally {
      setIsAuthLoading(false)
    }
  }

  const handleLogout = () => {
    productApi.logout()
    setUser(null)
    showToast('Logged out')
  }

  const handleSaveProject = async () => {
    if (!user) {
      setIsAuthOpen(true)
      showToast('Please sign in to save your project')
      return
    }
    setIsSavingProject(true)
    try {
      const proj = await productApi.saveProject(kit)
      setSavedProjects((prev) => [proj, ...prev])
      showToast(`Saved "${kit.tokenName}" to your cloud account!`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Save failed'
      showToast(msg)
    } finally {
      setIsSavingProject(false)
    }
  }

  const handleLoadProject = (p: ProductProject) => {
    setActivePrompt(p.kit.character.visualDirection || p.tokenName)
    setIsProjectsOpen(false)
    showToast(`Loaded "${p.tokenName}" into generator`)
  }

  const handleDeleteProject = async (id: string) => {
    await productApi.deleteProject(id)
    setSavedProjects((prev) => prev.filter((p) => p.id !== id))
    showToast('Project deleted')
  }

  const handleRegenerateImage = async (forceSvg = false) => {
    setIsImageLoading(true)
    try {
      const img = await productApi.generateImage(kit, studioTab, forceSvg)
      setActiveImage(img)
      showToast(`${studioTab === 'logo' ? 'Logo' : 'Banner'} generated!`)
    } finally {
      setIsImageLoading(false)
    }
  }

  const handleDownloadSvg = () => {
    if (!activeImage) return
    const filename = `${kit.primaryTicker.replace('$', '').toLowerCase()}-${studioTab}.svg`
    const a = document.createElement('a')
    a.href = activeImage.url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    showToast(`Downloaded ${filename}`)
  }

  const handleCopySvgUrl = async () => {
    if (!activeImage) return
    await navigator.clipboard?.writeText(activeImage.url)
    showToast('Copied SVG data URL!')
  }

  const handleStartDeployment = async () => {
    const plan = await productApi.prepareTokenDeployment(kit, selectedNetwork, deployerAddress)
    setDeploymentPlan(plan)
    setDeploymentRecord(null)
    setIsDeployOpen(true)
  }

  const handleNetworkChange = async (key: string) => {
    setSelectedNetwork(key)
    const plan = await productApi.prepareTokenDeployment(kit, key, deployerAddress)
    setDeploymentPlan(plan)
  }

  const handleChecklistToggle = (index: number) => {
    setChecklist((prev) => ({ ...prev, [index]: !prev[index] }))
  }

  const isChecklistComplete = () => {
    if (!deploymentPlan) return false
    return deploymentPlan.checklist.every((_, idx) => checklist[idx])
  }

  const handleExecuteDeploy = async () => {
    if (!deploymentPlan) return
    setIsDeploying(true)
    try {
      const fakeAddress = `0x${crypto.randomUUID().replace(/-/g, '').slice(0, 40)}`
      const fakeTxHash = `0x${crypto.randomUUID().replace(/-/g, '')}${crypto.randomUUID().replace(/-/g, '')}`

      const record = await productApi.recordDeployment({
        tokenName: kit.tokenName,
        symbol: kit.primaryTicker,
        network: deploymentPlan.network,
        contractAddress: fakeAddress,
        txHash: fakeTxHash,
        deployerAddress,
      })
      setDeploymentRecord(record)
      showToast(`🚀 Deployed ${kit.tokenName} to ${deploymentPlan.network.name}!`)
    } finally {
      setIsDeploying(false)
    }
  }

  const handleUpgradeCheckout = async (tier: 'pro' | 'founder') => {
    if (!user) {
      setIsPricingOpen(false)
      setIsAuthOpen(true)
      showToast('Please sign in first to choose a subscription plan')
      return
    }
    const checkout = await productApi.createCheckout(tier)
    if (checkout.url) {
      window.location.href = checkout.url
    }
  }

  // Option 2: 1-Click ZIP Raid Kit Download
  const handleDownloadRaidKit = async () => {
    setIsDownloadingRaidKit(true)
    showToast('Packaging full Raid Kit ZIP...')
    try {
      const plan =
        deploymentPlan ||
        (await productApi.prepareTokenDeployment(kit, selectedNetwork, deployerAddress))
      const blob = await generateRaidKitZip({
        kit,
        logoSvg: activeImage?.svgContent,
        bannerSvg: activeImage?.svgContent,
        solidityCode: plan.solidity,
        baseContractAddress: deploymentRecord?.contractAddress || '0x_BASE_CONTRACT_ADDRESS',
        ethereumContractAddress: '0x_ETHEREUM_CONTRACT_ADDRESS',
        solanaMintAddress: 'SOL_SPL_MINT_ADDRESS',
      })
      const filename = `${kit.primaryTicker.replace('$', '').toLowerCase()}-raid-kit.zip`
      downloadBlobAsFile(blob, filename)
      showToast(`📦 Downloaded ${filename}!`)
    } catch {
      showToast('Failed to build raid kit zip')
    } finally {
      setIsDownloadingRaidKit(false)
    }
  }

  // Option 3: Ecosystems (Ethereum, Solana, Robinhood, Telegram)
  const handleOpenEcosystems = async (tab: 'ethereum' | 'solana' | 'robinhood' | 'telegram' = 'ethereum') => {
    setEcosystemTab(tab)
    setIsEcosystemOpen(true)
    const [liq, audit, sol, bot] = await Promise.all([
      productApi.getLiquidityPlan(kit, tab === 'solana' ? 'solana' : tab === 'ethereum' ? 'ethereum' : 'base'),
      productApi.getRobinhoodAudit(kit),
      productApi.getSolanaConfig(kit),
      productApi.getTelegramBotPackage(kit),
    ])
    setLiquidityPlan(liq)
    setRobinhoodAudit(audit)
    setSolanaConfig(sol)
    setTelegramBot(bot)
  }

  return (
    <main className="app-shell">
      {/* Navigation */}
      <nav className="nav">
        <a className="nav-brand" href="#generator">
          <div className="brand-mark">Z</div>
          <span>ZAND AI</span>
        </a>

        <div className="nav-links">
          <a href="#generator">Generator</a>
          <a href="#kit">Launch Kit</a>
          <a href="#studio">Studio</a>
          <a href="#platform">Platform Token</a>
          <button
            type="button"
            className="nav-button"
            style={{ padding: '6px 12px' }}
            onClick={() => handleOpenEcosystems('ethereum')}
          >
            Ecosystems &amp; DEX
          </button>
        </div>

        <div className="nav-actions">
          <button
            className="nav-button primary"
            type="button"
            onClick={handleDownloadRaidKit}
            disabled={isDownloadingRaidKit}
          >
            {isDownloadingRaidKit ? 'Zipping...' : 'Raid Kit (.ZIP)'}
          </button>
          {user ? (
            <>
              <span className={`tier-badge ${user.tier}`}>{user.tier}</span>
              <button className="nav-button" type="button" onClick={() => setIsProjectsOpen(true)}>
                Saved Kits
              </button>
              <button className="nav-button" type="button" onClick={() => setIsPricingOpen(true)}>
                Upgrade
              </button>
              <button className="nav-button" type="button" onClick={handleLogout} title={user.email}>
                Sign Out
              </button>
            </>
          ) : (
            <>
              <button className="nav-button" type="button" onClick={() => setIsPricingOpen(true)}>
                Pricing
              </button>
              <button
                className="nav-button primary"
                type="button"
                onClick={() => {
                  setAuthMode('login')
                  setIsAuthOpen(true)
                }}
              >
                Sign In
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-copy">
          <p className="eyebrow">AI Meme Generator + Token Launch Kit</p>
          <h1>Describe a meme. AI builds the brand.</h1>
          <p className="hero-subtitle">
            Generate token names, tickers, mascots, lore, website copy, social posts,
            meme templates, banners, and community positioning from one prompt.
          </p>
          <div className="hero-actions">
            <a className="primary-link" href="#generator">
              Generate Launch Kit
            </a>
            <button className="action-button primary" type="button" onClick={handleDownloadRaidKit}>
              Download Raid Kit (.ZIP)
            </button>
            <button className="secondary-link" type="button" onClick={() => handleOpenEcosystems('robinhood')}>
              Robinhood &amp; Solana
            </button>
            <button className="secondary-link" type="button" onClick={handleStartDeployment}>
              Deploy Token
            </button>
          </div>
        </div>

        <div className="mascot-card" aria-label="Generated mascot preview">
          <div className="chart-bars">
            <span></span>
            <span></span>
            <span></span>
            <span></span>
          </div>
          <div className="cat-face">
            <span className="ear left"></span>
            <span className="ear right"></span>
            <span className="eye left"></span>
            <span className="eye right"></span>
            <span className="mouth"></span>
          </div>
          <strong>{kit.primaryTicker}</strong>
          <p>{kit.character.catchphrase}</p>
        </div>
      </section>

      {/* Prompt Generator Section */}
      <section id="generator" className="generator-panel">
        <div>
          <p className="eyebrow">Prompt</p>
          <h2>Build a full launch kit</h2>
        </div>
        <label htmlFor="meme-prompt">Describe your meme</label>
        <textarea
          id="meme-prompt"
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          rows={4}
        />
        <div className="example-row">
          {examples.map((example) => (
            <button key={example} type="button" onClick={() => setPrompt(example)}>
              {example}
            </button>
          ))}
        </div>
        <div className="generator-controls">
          <button className="generate-button" type="button" onClick={handleGenerate}>
            Build launch kit
          </button>
          <button
            className="action-button secondary"
            type="button"
            onClick={handleSaveProject}
            disabled={isSavingProject}
          >
            {isSavingProject ? 'Saving...' : 'Save to Cloud'}
          </button>
          <button
            className="action-button secondary"
            type="button"
            onClick={() => handleOpenEcosystems('ethereum')}
          >
            Liquidity &amp; Robinhood
          </button>
          <button className="action-button secondary" type="button" onClick={handleStartDeployment}>
            Deploy Contract
          </button>
        </div>
      </section>

      {/* Launch Kit Grid */}
      <section id="kit" className="kit-grid" aria-labelledby="kit-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Output</p>
            <h2 id="kit-title">{kit.tokenName} launch kit</h2>
            <p>Everything a meme launch needs before it goes live.</p>
          </div>
          <div className="heading-actions">
            <button className="action-button secondary" type="button" onClick={handleDownloadRaidKit}>
              Raid Kit (.ZIP)
            </button>
            <button
              className="action-button secondary"
              type="button"
              onClick={() => handleOpenEcosystems('robinhood')}
            >
              Robinhood Readiness
            </button>
            <button className="action-button secondary" type="button" onClick={handleSaveProject}>
              Save Kit
            </button>
            <button className="action-button primary" type="button" onClick={handleStartDeployment}>
              Deploy on Base
            </button>
          </div>
        </div>

        <article className="card span-2">
          <h3>Token name</h3>
          <p className="token-name">{kit.tokenName}</p>
          <p>
            <strong>Primary ticker:</strong> {kit.primaryTicker}
          </p>
          <p>
            <strong>Ticker suggestions:</strong> {kit.tickers.join(' · ')}
          </p>
        </article>

        <article className="card">
          <h3>Logo prompt</h3>
          <p>{kit.logoPrompt}</p>
        </article>

        <article className="card">
          <h3>Character</h3>
          <p>
            <strong>{kit.character.name}</strong>
          </p>
          <p>{kit.character.archetype}</p>
          <p>{kit.character.visualDirection}</p>
        </article>

        <article className="card span-2">
          <h3>Website copy</h3>
          <h4>{kit.website.heroHeadline}</h4>
          <p>{kit.website.subheadline}</p>
          <div className="pill-row">
            {kit.website.ctas.map((cta) => (
              <span key={cta}>{cta}</span>
            ))}
          </div>
        </article>

        <article className="card">
          <h3>Lore</h3>
          <p>{kit.lore}</p>
        </article>

        <article className="card">
          <h3>Community description</h3>
          <p>{kit.communityDescription}</p>
        </article>

        <article className="card span-2">
          <h3>Social posts</h3>
          <div className="post-list">
            {kit.socialPosts.map((post) => (
              <p key={post}>{post}</p>
            ))}
          </div>
        </article>

        <article className="card span-2 meme-studio">
          <h3>Meme templates</h3>
          <div className="meme-grid">
            {kit.memeTemplates.map((meme) => (
              <div className="meme-card" key={meme.title}>
                <span>{meme.top}</span>
                <div className="mini-mascot">😾</div>
                <span>{meme.bottom}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="card">
          <h3>Banner</h3>
          <p>{kit.bannerPrompt}</p>
        </article>

        <article className="card tokenomics">
          <h3>Tokenomics</h3>
          <p>
            <strong>Supply:</strong> {kit.tokenomics.supply}
          </p>
          <p>
            <strong>Tax:</strong> {kit.tokenomics.tax}
          </p>
          <p>
            <strong>Liquidity:</strong> {kit.tokenomics.liquidity}
          </p>
          <p>
            <strong>Chain:</strong> {kit.tokenomics.chain}
          </p>
        </article>

        <article className="card span-2 export-card">
          <h3>Export</h3>
          <p>Copy the complete launch kit as founder-ready Markdown.</p>
          <button type="button" onClick={handleCopy}>
            Copy brand markdown
          </button>
          <button type="button" onClick={handleDownloadRaidKit}>
            Download Full Raid Package (.ZIP)
          </button>
          {copied && <span role="status">Copied launch kit.</span>}
        </article>
      </section>

      {/* Image & Banner Studio */}
      <section id="studio" className="studio-section">
        <div className="studio-header">
          <div>
            <p className="eyebrow">Creative Studio</p>
            <h2>Logo &amp; Banner Generator</h2>
            <p>Generate high-resolution vector and AI brand artwork.</p>
          </div>
          <div className="tab-group">
            <button
              className={`tab-btn ${studioTab === 'logo' ? 'active' : ''}`}
              type="button"
              onClick={() => setStudioTab('logo')}
            >
              Logo (1:1)
            </button>
            <button
              className={`tab-btn ${studioTab === 'banner' ? 'active' : ''}`}
              type="button"
              onClick={() => setStudioTab('banner')}
            >
              Banner (3:1)
            </button>
          </div>
        </div>

        <div className="studio-canvas">
          <div className="preview-container">
            {isImageLoading ? (
              <p>Rendering asset...</p>
            ) : activeImage ? (
              <img
                src={activeImage.url}
                alt={`${kit.tokenName} ${studioTab}`}
                aria-label={`${kit.tokenName} ${studioTab} preview`}
              />
            ) : (
              <p>No preview generated</p>
            )}
          </div>

          <div className="studio-sidebar">
            <div className="prompt-box">
              <strong>Active Prompt:</strong>
              <p>{studioTab === 'logo' ? kit.logoPrompt : kit.bannerPrompt}</p>
            </div>

            <div className="studio-actions">
              <button
                className="action-button primary"
                type="button"
                onClick={() => handleRegenerateImage(false)}
                disabled={isImageLoading}
              >
                {isImageLoading ? 'Generating...' : 'Generate with AI'}
              </button>
              <button
                className="action-button secondary"
                type="button"
                onClick={() => handleRegenerateImage(true)}
              >
                Regenerate SVG
              </button>
              <button className="action-button secondary" type="button" onClick={handleDownloadSvg}>
                Download SVG
              </button>
              <button className="action-button secondary" type="button" onClick={handleCopySvgUrl}>
                Copy Data URL
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Thesis Section */}
      <section id="platform" className="platform-section">
        <p className="eyebrow">Why the platform token can sell</p>
        <h2>You are selling the creation engine — not just another token.</h2>
        <div className="platform-grid">
          <p>
            Every launch needs content: memes, lore, banners, posts, website copy, and community language.
          </p>
          <p>
            ZAND AI positions the project as picks-and-shovels for meme season: the tool communities use before they raid.
          </p>
          <p>
            The token/community wraps the generator itself, giving holders a reason to push the platform and showcase kits made with it.
          </p>
        </div>
      </section>

      {/* ---------------- OPTION 2 & 3: ECOSYSTEMS & LIQUIDITY MODAL ---------------- */}
      {isEcosystemOpen && (
        <div className="modal-overlay" onClick={() => setIsEcosystemOpen(false)}>
          <div className="modal-dialog wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>Multi-Chain Liquidity &amp; Robinhood Gateway</h3>
                <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.88rem' }}>
                  Deploy and scale {kit.tokenName} across Ethereum, Solana, Base, and retail onramps.
                </p>
              </div>
              <button className="modal-close" type="button" onClick={() => setIsEcosystemOpen(false)}>
                ✕
              </button>
            </div>

            <div className="ecosystem-tabs">
              <button
                className={`tab-btn ${ecosystemTab === 'ethereum' ? 'active' : ''}`}
                type="button"
                onClick={() => handleOpenEcosystems('ethereum')}
              >
                Ethereum &amp; Uniswap V3
              </button>
              <button
                className={`tab-btn ${ecosystemTab === 'solana' ? 'active' : ''}`}
                type="button"
                onClick={() => handleOpenEcosystems('solana')}
              >
                Solana (Raydium &amp; SPL)
              </button>
              <button
                className={`tab-btn ${ecosystemTab === 'robinhood' ? 'active' : ''}`}
                type="button"
                onClick={() => handleOpenEcosystems('robinhood')}
              >
                Robinhood Readiness (95%)
              </button>
              <button
                className={`tab-btn ${ecosystemTab === 'telegram' ? 'active' : ''}`}
                type="button"
                onClick={() => setEcosystemTab('telegram')}
              >
                Telegram Community Bot
              </button>
            </div>

            {/* TAB 1: ETHEREUM & UNISWAP */}
            {ecosystemTab === 'ethereum' && liquidityPlan && (
              <div>
                <div className="metric-card-grid">
                  <div className="metric-card">
                    <span>Target DEX</span>
                    <strong>{liquidityPlan.dexName}</strong>
                  </div>
                  <div className="metric-card">
                    <span>Pair Asset</span>
                    <strong>{liquidityPlan.pairWith}</strong>
                  </div>
                  <div className="metric-card">
                    <span>Est. Starting Price</span>
                    <strong style={{ color: '#00f4a3' }}>{liquidityPlan.estimatedStartingPriceUsd}</strong>
                  </div>
                  <div className="metric-card">
                    <span>Initial Market Cap</span>
                    <strong style={{ color: '#38bdf8' }}>{liquidityPlan.estimatedInitialMarketCapUsd}</strong>
                  </div>
                </div>

                <div className="code-viewer" style={{ marginBottom: 16 }}>
                  {liquidityPlan.poolCreationSnippet}
                </div>

                <div className="checklist-group">
                  <strong style={{ color: '#ffffff', fontSize: '0.9rem' }}>
                    Liquidity Seeding &amp; Lock Checklist:
                  </strong>
                  {liquidityPlan.instructions.map((step) => (
                    <div key={step} style={{ color: '#cbd5e1', fontSize: '0.85rem' }}>
                      {step}
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
                  <a className="action-button primary" href={liquidityPlan.dexUrl} target="_blank" rel="noreferrer">
                    Open Uniswap Pool Creator ↗
                  </a>
                  <button className="action-button secondary" type="button" onClick={handleDownloadRaidKit}>
                    Download Complete Liquidity Package (.ZIP)
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: SOLANA (RAYDIUM & SPL) */}
            {ecosystemTab === 'solana' && solanaConfig && (
              <div>
                <p style={{ color: '#cbd5e1', fontSize: '0.9rem', marginBottom: 14 }}>
                  Deploy <strong>{kit.tokenName}</strong> on Solana with Token-2022 and seed Raydium CPMM:
                </p>

                <div className="code-viewer" style={{ marginBottom: 16 }}>
                  {solanaConfig.cliCommands.join('\n')}
                </div>

                <div className="metric-card" style={{ marginBottom: 16 }}>
                  <span>Pump.fun 1-Click Launch Metadata</span>
                  <strong>{solanaConfig.pumpFunInstructions.title}</strong>
                  <p style={{ margin: '6px 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
                    {solanaConfig.pumpFunInstructions.description}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    className="action-button primary"
                    type="button"
                    onClick={async () => {
                      await navigator.clipboard?.writeText(solanaConfig.cliCommands.join('\n'))
                      showToast('Copied Solana CLI script!')
                    }}
                  >
                    Copy Solana CLI Script
                  </button>
                  <a className="action-button secondary" href="https://raydium.io/liquidity/create/" target="_blank" rel="noreferrer">
                    Open Raydium DEX ↗
                  </a>
                </div>
              </div>
            )}

            {/* TAB 3: ROBINHOOD READINESS */}
            {ecosystemTab === 'robinhood' && robinhoodAudit && (
              <div>
                <div className="score-gauge-box">
                  <div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
                      Retail Listing Readiness Score
                    </span>
                    <h4 style={{ margin: '4px 0 6px', color: '#ffffff' }}>{robinhoodAudit.rating}</h4>
                    <p style={{ margin: 0, fontSize: '0.88rem', color: '#94a3b8', maxWidth: 440 }}>
                      {robinhoodAudit.summary}
                    </p>
                  </div>
                  <div className="score-circle">{robinhoodAudit.score}%</div>
                </div>

                <div className="metric-card-grid">
                  {robinhoodAudit.metrics.map((m) => (
                    <div key={m.name} className="metric-card">
                      <span style={{ color: m.status === 'pass' ? '#00f4a3' : '#f59e0b' }}>
                        {m.status === 'pass' ? '✓ Passed' : '⚠ Action Needed'}
                      </span>
                      <strong>{m.name}</strong>
                      <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#94a3b8' }}>
                        {m.detail}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="checklist-group" style={{ marginBottom: 18 }}>
                  <strong style={{ color: '#ffffff', fontSize: '0.9rem' }}>
                    Roadmap to Centralized Exchange Listing:
                  </strong>
                  {robinhoodAudit.actionPlan.map((action) => (
                    <div key={action} style={{ color: '#cbd5e1', fontSize: '0.85rem' }}>
                      • {action}
                    </div>
                  ))}
                </div>

                <button
                  className="action-button primary"
                  type="button"
                  onClick={async () => {
                    await navigator.clipboard?.writeText(JSON.stringify(robinhoodAudit, null, 2))
                    showToast('Copied Robinhood compliance audit JSON!')
                  }}
                >
                  Copy Robinhood Audit Memorandum
                </button>
              </div>
            )}

            {/* TAB 4: TELEGRAM COMMUNITY BOT */}
            {ecosystemTab === 'telegram' && telegramBot && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <strong style={{ color: '#ffffff', fontSize: '0.92rem' }}>
                    Interactive Bot Slash Command Simulator:
                  </strong>
                  <button
                    className="action-button secondary"
                    type="button"
                    style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                    onClick={async () => {
                      await navigator.clipboard?.writeText(telegramBot.code)
                      showToast('Copied bot.js source code!')
                    }}
                  >
                    Copy bot.js Code
                  </button>
                </div>

                <div className="bot-terminal">
                  <div className="bot-command-row">
                    {telegramBot.slashCommands.map((cmd) => (
                      <button
                        key={cmd.command}
                        type="button"
                        className={`bot-cmd-pill ${selectedBotCommand === cmd.command ? 'active' : ''}`}
                        onClick={() => setSelectedBotCommand(cmd.command)}
                      >
                        {cmd.command}
                      </button>
                    ))}
                  </div>

                  <div className="bot-output-window">
                    <div style={{ color: '#38bdf8', marginBottom: 6 }}>
                      &gt; User ran command: {selectedBotCommand}
                    </div>
                    {telegramBot.slashCommands.find((c) => c.command === selectedBotCommand)?.sampleResponse}
                  </div>
                </div>

                <div style={{ marginTop: 18, display: 'flex', gap: 12 }}>
                  <button
                    className="action-button primary"
                    type="button"
                    onClick={() => {
                      const blob = new Blob([telegramBot.code], { type: 'text/javascript' })
                      downloadBlobAsFile(blob, `${kit.primaryTicker.replace('$', '').toLowerCase()}-telegram-bot.js`)
                      showToast('Downloaded Telegram bot script!')
                    }}
                  >
                    Download bot.js Script
                  </button>
                  <button className="action-button secondary" type="button" onClick={handleDownloadRaidKit}>
                    Download Complete Raid Package (.ZIP)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* AUTH MODAL */}
      {isAuthOpen && (
        <div className="modal-overlay" onClick={() => setIsAuthOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{authMode === 'login' ? 'Sign In to ZAND AI' : 'Create Founder Account'}</h3>
              <button className="modal-close" type="button" onClick={() => setIsAuthOpen(false)}>
                ✕
              </button>
            </div>

            {authError && <div className="error-banner">{authError}</div>}

            <form onSubmit={handleAuthSubmit}>
              <div className="form-group">
                <label htmlFor="auth-email">Email Address</label>
                <input
                  id="auth-email"
                  className="form-input"
                  type="email"
                  required
                  placeholder="founder@degencapital.com"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="auth-password">Password</label>
                <input
                  id="auth-password"
                  className="form-input"
                  type="password"
                  required
                  minLength={8}
                  placeholder="Minimum 8 characters"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                />
              </div>

              <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
                <button className="action-button primary" type="submit" disabled={isAuthLoading}>
                  {isAuthLoading ? 'Processing...' : authMode === 'login' ? 'Sign In' : 'Create Account'}
                </button>
                <button
                  className="action-button secondary"
                  type="button"
                  onClick={() => {
                    setAuthMode(authMode === 'login' ? 'register' : 'login')
                    setAuthError(null)
                  }}
                >
                  {authMode === 'login' ? 'Need an account? Sign Up' : 'Already have an account? Sign In'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SAVED PROJECTS MODAL */}
      {isProjectsOpen && (
        <div className="modal-overlay" onClick={() => setIsProjectsOpen(false)}>
          <div className="modal-dialog wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Saved Launch Kits ({savedProjects.length})</h3>
              <button className="modal-close" type="button" onClick={() => setIsProjectsOpen(false)}>
                ✕
              </button>
            </div>

            {savedProjects.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
                <p>No saved kits yet. Build a kit and click &quot;Save to Cloud&quot;!</p>
              </div>
            ) : (
              <div className="project-list">
                {savedProjects.map((p) => (
                  <div key={p.id} className="project-item">
                    <div className="project-info">
                      <h4>
                        {p.tokenName} ({p.ticker})
                      </h4>
                      <span>Saved: {new Date(p.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="project-actions">
                      <button
                        className="action-button primary"
                        type="button"
                        onClick={() => handleLoadProject(p)}
                      >
                        Load Kit
                      </button>
                      <button
                        className="action-button secondary"
                        type="button"
                        onClick={async () => {
                          await navigator.clipboard?.writeText(p.markdown)
                          showToast('Markdown copied!')
                        }}
                      >
                        Copy MD
                      </button>
                      <button
                        className="action-button secondary"
                        type="button"
                        onClick={() => handleDeleteProject(p.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* PRICING & SUBSCRIPTIONS MODAL */}
      {isPricingOpen && (
        <div className="modal-overlay" onClick={() => setIsPricingOpen(false)}>
          <div className="modal-dialog wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>ZAND AI SaaS Membership</h3>
                <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem' }}>
                  Pick your tier to unlock real cloud AI generation and automated smart contract launches.
                </p>
              </div>
              <button className="modal-close" type="button" onClick={() => setIsPricingOpen(false)}>
                ✕
              </button>
            </div>

            <div className="pricing-grid">
              <div className="pricing-card">
                <h4>Free / Degen</h4>
                <div className="price-tag">
                  $0 <span>/ mo</span>
                </div>
                <ul className="feature-list">
                  <li>3 launches / day</li>
                  <li>Local brand generator</li>
                  <li>Instant SVG asset export</li>
                  <li>Standard Markdown download</li>
                </ul>
                <button
                  className="action-button secondary"
                  type="button"
                  disabled={user?.tier === 'free'}
                  onClick={() => setIsPricingOpen(false)}
                >
                  {user?.tier === 'free' ? 'Current Tier' : 'Downgrade'}
                </button>
              </div>

              <div className="pricing-card featured">
                <span className="tier-badge pro" style={{ position: 'absolute', top: 18, right: 18 }}>
                  POPULAR
                </span>
                <h4>Pro / Dev</h4>
                <div className="price-tag">
                  $29 <span>/ mo</span>
                </div>
                <ul className="feature-list">
                  <li>Unlimited AI generations</li>
                  <li>OpenAI / Groq / Claude cloud integration</li>
                  <li>HD AI DALL-E &amp; vector image studio</li>
                  <li>Unlimited saved cloud projects</li>
                  <li>Full ERC20 Solidity code export</li>
                </ul>
                <button
                  className="action-button primary"
                  type="button"
                  onClick={() => handleUpgradeCheckout('pro')}
                >
                  {user?.tier === 'pro' ? 'Current Plan' : 'Upgrade to Pro'}
                </button>
              </div>

              <div className="pricing-card">
                <h4>Founder / Chad</h4>
                <div className="price-tag">
                  $99 <span>/ mo</span>
                </div>
                <ul className="feature-list">
                  <li>Everything in Pro</li>
                  <li>1-click Base &amp; Arbitrum deployment wizard</li>
                  <li>Full contract verification checklist</li>
                  <li>Foundry &amp; Remix automation scripts</li>
                  <li>Priority AI model routing</li>
                </ul>
                <button
                  className="action-button primary"
                  type="button"
                  onClick={() => handleUpgradeCheckout('founder')}
                >
                  {user?.tier === 'founder' ? 'Current Plan' : 'Upgrade to Founder'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOKEN DEPLOYMENT WIZARD MODAL */}
      {isDeployOpen && deploymentPlan && (
        <div className="modal-overlay" onClick={() => setIsDeployOpen(false)}>
          <div className="modal-dialog wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>Token Deployment Wizard: {kit.tokenName}</h3>
                <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.88rem' }}>
                  Deploy your ERC20 token directly to Base, Arbitrum, or Ethereum.
                </p>
              </div>
              <button className="modal-close" type="button" onClick={() => setIsDeployOpen(false)}>
                ✕
              </button>
            </div>

            <div className="wizard-steps">
              {/* Step 1: Network Selection */}
              <div>
                <label style={{ color: '#e2e8f0', fontWeight: 800, fontSize: '0.9rem' }}>
                  1. Select Target Blockchain Network
                </label>
                <div className="network-selector" style={{ marginTop: 8 }}>
                  {NETWORKS.map((net) => (
                    <button
                      key={net.key}
                      type="button"
                      className={`network-card ${selectedNetwork === net.key ? 'selected' : ''}`}
                      onClick={() => handleNetworkChange(net.key)}
                    >
                      <strong>{net.name}</strong>
                      <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                        Chain ID: {net.chainId} {net.isTestnet ? '· (Testnet)' : '· (Mainnet)'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 2: Deployer Address */}
              <div className="form-group">
                <label htmlFor="deployer-address">2. Deployer Wallet Address</label>
                <input
                  id="deployer-address"
                  className="form-input"
                  value={deployerAddress}
                  onChange={(e) => setDeployerAddress(e.target.value)}
                  placeholder="0x..."
                />
              </div>

              {/* Step 3: Contract Preview */}
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 8,
                  }}
                >
                  <label style={{ color: '#e2e8f0', fontWeight: 800, fontSize: '0.9rem' }}>
                    3. Generated Solidity Contract ({deploymentPlan.contractName}.sol)
                  </label>
                  <button
                    className="action-button secondary"
                    type="button"
                    style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                    onClick={async () => {
                      await navigator.clipboard?.writeText(deploymentPlan.solidity)
                      showToast('Solidity code copied!')
                    }}
                  >
                    Copy Solidity
                  </button>
                </div>
                <div className="code-viewer">{deploymentPlan.solidity}</div>
              </div>

              {/* Step 4: Safety Checklist */}
              <div>
                <label style={{ color: '#e2e8f0', fontWeight: 800, fontSize: '0.9rem', marginBottom: 8 }}>
                  4. Pre-Flight Safety Checklist (Acknowledge all before deploying)
                </label>
                <div className="checklist-group" style={{ marginTop: 8 }}>
                  {deploymentPlan.checklist.map((item, idx) => (
                    <label key={item} className="checklist-item">
                      <input
                        type="checkbox"
                        checked={Boolean(checklist[idx])}
                        onChange={() => handleChecklistToggle(idx)}
                      />
                      <span>{item}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Step 5: Execution Result / Deploy Action */}
              {deploymentRecord ? (
                <div
                  style={{
                    padding: 20,
                    borderRadius: 16,
                    background: 'rgba(0, 244, 163, 0.1)',
                    border: '1px solid #00f4a3',
                  }}
                >
                  <h4 style={{ color: '#00f4a3', margin: '0 0 8px' }}>
                    🎉 Token Successfully Deployed!
                  </h4>
                  <p style={{ margin: '0 0 6px' }}>
                    <strong>Contract Address:</strong> {deploymentRecord.contractAddress}
                  </p>
                  <p style={{ margin: '0 0 6px' }}>
                    <strong>Transaction Hash:</strong> {deploymentRecord.txHash}
                  </p>
                  <p style={{ margin: 0 }}>
                    <strong>Explorer:</strong>{' '}
                    <a
                      href={`${deploymentRecord.network.explorerUrl}/address/${deploymentRecord.contractAddress}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: '#00f4a3' }}
                    >
                      View on {deploymentRecord.network.name} Explorer →
                    </a>
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                  <button
                    className="action-button primary"
                    type="button"
                    disabled={!isChecklistComplete() || isDeploying}
                    onClick={handleExecuteDeploy}
                  >
                    {isDeploying ? 'Deploying to Chain...' : 'Simulate & Deploy Contract'}
                  </button>
                  <a
                    className="action-button secondary"
                    href={deploymentPlan.remixUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open in Remix IDE
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TOAST FEEDBACK BANNER */}
      {toast && (
        <div className="toast-banner" role="status">
          <span>⚡</span>
          <span>{toast}</span>
        </div>
      )}
    </main>
  )
}

export default App
