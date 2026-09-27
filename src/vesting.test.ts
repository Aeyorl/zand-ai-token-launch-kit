import { describe, expect, it } from 'vitest'
import { generateLaunchKit } from './brandGenerator'
import {
  DEFAULT_ALLOCATIONS,
  generateVestingScheduleSvg,
  generateVestingSolidityContract,
} from './vesting'

describe('Vesting Engine', () => {
  it('contains 100% total allocation across allocations', () => {
    const total = DEFAULT_ALLOCATIONS.reduce((sum, item) => sum + item.percentage, 0)
    expect(total).toBe(100)
  })

  it('generates production-grade TokenVesting.sol contract', () => {
    const kit = generateLaunchKit('Angry billionaire cat that hates Wall Street.')
    const contract = generateVestingSolidityContract(kit)

    expect(contract).toContain('contract WallStreetClawVesting')
    expect(contract).toContain('createVestingSchedule')
    expect(contract).toContain('computeReleasableAmount')
    expect(contract).toContain('release(')
    expect(contract).toContain('IERC20')
  })

  it('generates valid visual vesting schedule SVG', () => {
    const svg = generateVestingScheduleSvg(DEFAULT_ALLOCATIONS)
    expect(svg).toContain('<svg')
    expect(svg).toContain('TOKENOMICS VESTING SCHEDULE')
    expect(svg).toContain('Fair Launch & DEX Liquidity')
  })
})
