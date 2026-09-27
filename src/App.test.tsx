import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  it('renders a visible meme token launch kit from the default prompt', () => {
    const html = renderToStaticMarkup(<App />)

    expect(html).toContain('Describe a meme. AI builds the brand.')
    expect(html).toContain('WallStreet Claw launch kit')
    expect(html).toContain('Ticker suggestions')
    expect(html).toContain('Logo prompt')
    expect(html).toContain('Wall Street')
    expect(html).toContain('Copy brand markdown')
  })
})
