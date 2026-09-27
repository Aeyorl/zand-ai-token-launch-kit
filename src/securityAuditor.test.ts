import { describe, expect, it } from 'vitest'
import { generateLaunchKit } from './brandGenerator'
import { auditSmartContract } from './securityAuditor'

describe('auditSmartContract', () => {
  it('passes standard fair-launch contract with 100/100 score and SAFE rating', () => {
    const kit = generateLaunchKit('Fair launch community dog token')
    const safeSolidity = `
      // SPDX-License-Identifier: MIT
      pragma solidity ^0.8.20;
      import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
      contract SafeToken is ERC20 {
        constructor() ERC20("Safe", "SAFE") {
          _mint(msg.sender, 1000000000 * 10 ** 18);
        }
      }
    `
    const report = auditSmartContract(kit, safeSolidity, '0x1234567890123456789012345678901234567890')

    expect(report.score).toBe(100)
    expect(report.rating).toBe('SAFE / AUDITED')
    expect(report.badgeColor).toBe('#00f4a3')
    expect(report.checks.every((c) => c.passed)).toBe(true)
    expect(report.auditMarkdown).toContain('# Smart Contract Security & Anti-Rug Audit Report')
    expect(report.auditMarkdown).toContain(kit.tokenName)
    expect(report.auditMarkdown).toContain('0x1234567890123456789012345678901234567890')
    expect(report.auditMarkdown).toContain('100/100')
  })

  it('detects honeypot traps and hidden mint functions as critical risks', () => {
    const kit = generateLaunchKit('Shady rug pull token')
    const maliciousSolidity = `
      pragma solidity ^0.8.20;
      contract ShadyToken {
        mapping(address => bool) public isBlacklisted;
        function mint(address to, uint256 amount) public {
          // hidden mint
        }
        function transfer(address to, uint256 amt) public returns (bool) {
          if (isBlacklisted[msg.sender]) revert("cannot sell");
          if (fee > 10) revert();
          return true;
        }
      }
    `
    const report = auditSmartContract(kit, maliciousSolidity, '0xBadContract')

    expect(report.score).toBeLessThan(70)
    expect(report.rating).toBe('HIGH RISK')
    expect(report.badgeColor).toBe('#ef4444')

    const honeypotCheck = report.checks.find((c) => c.id === 'honeypot')
    expect(honeypotCheck?.passed).toBe(false)

    const mintCheck = report.checks.find((c) => c.id === 'mint')
    expect(mintCheck?.passed).toBe(false)

    const blacklistCheck = report.checks.find((c) => c.id === 'blacklist')
    expect(blacklistCheck?.passed).toBe(false)

    expect(report.auditMarkdown).toContain('HIGH RISK')
    expect(report.auditMarkdown).toContain('❌ FAILED')
  })
})
