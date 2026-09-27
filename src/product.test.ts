import { describe, expect, it } from 'vitest'
import { createOfflineApi } from './api'

describe('offline product API fallback', () => {
  it('supports auth, AI generation, image generation, saved projects, checkout, and deployment plan', async () => {
    const api = createOfflineApi()
    const user = await api.signUp('aeyo@example.com', 'strong-password')
    const kit = await api.generateKit('Angry billionaire cat that hates Wall Street.')
    const image = await api.generateImage(kit)
    const project = await api.saveProject(kit)
    const checkout = await api.createCheckout()
    const deployment = await api.prepareTokenDeployment(kit)

    expect(user.email).toBe('aeyo@example.com')
    expect(kit.tokenName).toBe('WallStreet Claw')
    expect(image.url).toMatch(/^data:image\/svg\+xml/)
    expect(project.id).toBeTruthy()
    expect(api.listProjects()).toHaveLength(1)
    expect(checkout.url).toContain('checkout')
    expect(deployment.solidity).toContain('ERC20')
  })
})
