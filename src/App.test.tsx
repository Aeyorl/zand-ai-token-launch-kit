import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  it('generates a visible meme token launch kit from a prompt', () => {
    render(<App />)

    const prompt = screen.getByLabelText(/describe your meme/i)
    fireEvent.change(prompt, { target: { value: 'Angry billionaire cat that hates Wall Street.' } })
    fireEvent.click(screen.getByRole('button', { name: /build launch kit/i }))

    expect(screen.getByRole('heading', { name: /WallStreet Claw launch kit/i })).toBeInTheDocument()
    expect(screen.getByText(/Ticker suggestions/i)).toBeInTheDocument()
    expect(screen.getByText(/Logo prompt/i)).toBeInTheDocument()
    expect(screen.getAllByText(/Wall Street/i).length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: /copy brand markdown/i })).toBeInTheDocument()
  })
})
