import { useMemo, useState } from 'react'
import './App.css'
import { exportLaunchKitMarkdown, generateLaunchKit } from './brandGenerator'

const examples = [
  'Angry billionaire cat that hates Wall Street.',
  'Cute cat with laser eyes protecting delicate girls.',
  'Frog trader who only buys green candles and roasts paper hands.',
]

function App() {
  const [prompt, setPrompt] = useState(examples[0])
  const [activePrompt, setActivePrompt] = useState(examples[0])
  const [copied, setCopied] = useState(false)
  const kit = useMemo(() => generateLaunchKit(activePrompt), [activePrompt])
  const markdown = useMemo(() => exportLaunchKitMarkdown(kit), [kit])

  const handleGenerate = () => {
    setActivePrompt(prompt)
    setCopied(false)
  }

  const handleCopy = async () => {
    await navigator.clipboard?.writeText(markdown)
    setCopied(true)
  }

  return (
    <main className="app-shell">
      <nav className="nav">
        <div className="brand-mark">Z</div>
        <span>ZAND AI</span>
        <a href="#generator">Generator</a>
        <a href="#kit">Launch Kit</a>
        <a href="#platform">Platform Token</a>
      </nav>

      <section className="hero-section">
        <div className="hero-copy">
          <p className="eyebrow">AI Meme Generator + Token Launch Kit</p>
          <h1>Describe a meme. AI builds the brand.</h1>
          <p className="hero-subtitle">
            Generate token names, tickers, mascots, lore, website copy, social posts,
            meme templates, banners, and community positioning from one prompt.
          </p>
          <div className="hero-actions">
            <a className="primary-link" href="#generator">Generate Launch Kit</a>
            <a className="secondary-link" href="#platform">See platform thesis</a>
          </div>
        </div>
        <div className="mascot-card" aria-label="Generated mascot preview">
          <div className="chart-bars"><span></span><span></span><span></span><span></span></div>
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
        <button className="generate-button" type="button" onClick={handleGenerate}>
          Build launch kit
        </button>
      </section>

      <section id="kit" className="kit-grid" aria-labelledby="kit-title">
        <div className="section-heading">
          <p className="eyebrow">Output</p>
          <h2 id="kit-title">{kit.tokenName} launch kit</h2>
          <p>Everything a meme launch needs before it goes live.</p>
        </div>

        <article className="card span-2">
          <h3>Token name</h3>
          <p className="token-name">{kit.tokenName}</p>
          <p><strong>Primary ticker:</strong> {kit.primaryTicker}</p>
          <p><strong>Ticker suggestions:</strong> {kit.tickers.join(' · ')}</p>
        </article>

        <article className="card">
          <h3>Logo prompt</h3>
          <p>{kit.logoPrompt}</p>
        </article>

        <article className="card">
          <h3>Character</h3>
          <p><strong>{kit.character.name}</strong></p>
          <p>{kit.character.archetype}</p>
          <p>{kit.character.visualDirection}</p>
        </article>

        <article className="card span-2">
          <h3>Website copy</h3>
          <h4>{kit.website.heroHeadline}</h4>
          <p>{kit.website.subheadline}</p>
          <div className="pill-row">{kit.website.ctas.map((cta) => <span key={cta}>{cta}</span>)}</div>
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
            {kit.socialPosts.map((post) => <p key={post}>{post}</p>)}
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
          <p><strong>Supply:</strong> {kit.tokenomics.supply}</p>
          <p><strong>Tax:</strong> {kit.tokenomics.tax}</p>
          <p><strong>Liquidity:</strong> {kit.tokenomics.liquidity}</p>
          <p><strong>Chain:</strong> {kit.tokenomics.chain}</p>
        </article>

        <article className="card span-2 export-card">
          <h3>Export</h3>
          <p>Copy the complete launch kit as founder-ready Markdown.</p>
          <button type="button" onClick={handleCopy}>Copy brand markdown</button>
          {copied && <span role="status">Copied launch kit.</span>}
        </article>
      </section>

      <section id="platform" className="platform-section">
        <p className="eyebrow">Why the platform token can sell</p>
        <h2>You are selling the creation engine — not just another token.</h2>
        <div className="platform-grid">
          <p>Every launch needs content: memes, lore, banners, posts, website copy, and community language.</p>
          <p>ZAND AI positions the project as picks-and-shovels for meme season: the tool communities use before they raid.</p>
          <p>The token/community wraps the generator itself, giving holders a reason to push the platform and showcase kits made with it.</p>
        </div>
      </section>
    </main>
  )
}

export default App
