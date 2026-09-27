import { describe, expect, it } from 'vitest'
import { generateLaunchKit } from './brandGenerator'
import { generateVerificationPackage } from './verification'

describe('generateVerificationPackage', () => {
  it('generates standard json input and verification commands for Etherscan/Basescan/Robinhood Explorer', () => {
    const kit = generateLaunchKit('Angry billionaire cat that hates Wall Street.')
    const pkg = generateVerificationPackage(
      kit,
      '0x42170bA5E8C9472DaE419Fa432170DEAdbeef123',
      '// Solidity Code',
      'robinhood-mainnet',
    )

    expect(pkg.contractName).toBe('WallStreetClaw')
    expect(pkg.compilerVersion).toContain('v0.8.20')
    expect(pkg.optimizationRuns).toBe(200)
    expect(pkg.standardJsonInput).toContain('"language": "Solidity"')
    expect(pkg.standardJsonInput).toContain('optimizer')
    expect(pkg.foundryVerifyCommand).toContain('forge verify-contract 0x42170bA5E8C9472DaE419Fa432170DEAdbeef123')
    expect(pkg.foundryVerifyCommand).toContain('--chain-id 42170')
    expect(pkg.hardhatVerifyCommand).toContain('npx hardhat verify')
  })
})
