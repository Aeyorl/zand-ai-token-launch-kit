import type { LaunchKit } from './brandGenerator'

export interface VestingAllocation {
  id: string
  name: string
  percentage: number
  tgeUnlockPercent: number
  cliffMonths: number
  vestingMonths: number
  recipient: string
}

export const DEFAULT_ALLOCATIONS: VestingAllocation[] = [
  {
    id: 'lp',
    name: 'Fair Launch & DEX Liquidity',
    percentage: 70,
    tgeUnlockPercent: 100,
    cliffMonths: 0,
    vestingMonths: 0,
    recipient: 'Uniswap / Robinhood DEX Pool',
  },
  {
    id: 'eco',
    name: 'Ecosystem & Marketing Growth',
    percentage: 15,
    tgeUnlockPercent: 10,
    cliffMonths: 1,
    vestingMonths: 12,
    recipient: 'Marketing Multi-Sig Treasury',
  },
  {
    id: 'airdrop',
    name: 'Community Airdrop & Raids',
    percentage: 10,
    tgeUnlockPercent: 50,
    cliffMonths: 0,
    vestingMonths: 3,
    recipient: 'Airdrop Distributor Contract',
  },
  {
    id: 'team',
    name: 'Core Contributors & Dev',
    percentage: 5,
    tgeUnlockPercent: 0,
    cliffMonths: 6,
    vestingMonths: 24,
    recipient: 'Dev Team Time-Lock Vault',
  },
]

export function generateVestingSolidityContract(kit: LaunchKit): string {
  const cleanName = kit.tokenName.replace(/[^A-Za-z0-9]/g, '') || 'Token'
  const symbol = kit.primaryTicker.replace('$', '')

  return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ${cleanName}Vesting
 * @notice Multi-schedule linear vesting vault for ${kit.tokenName} ($${symbol})
 * Designed for Robinhood Mainnet, Base, and Ethereum ERC20 tokens.
 */
interface IERC20 {
    function transfer(address to, uint256 value) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract ${cleanName}Vesting {
    struct VestingSchedule {
        address beneficiary;
        uint256 totalAmount;
        uint256 releasedAmount;
        uint256 startTimestamp;
        uint256 cliffDuration;
        uint256 vestingDuration;
        uint256 tgeAmount;
    }

    IERC20 public immutable token;
    address public immutable owner;

    mapping(bytes32 => VestingSchedule) public schedules;
    bytes32[] public scheduleIds;

    event ScheduleCreated(bytes32 indexed scheduleId, address indexed beneficiary, uint256 totalAmount);
    event TokensReleased(bytes32 indexed scheduleId, address indexed beneficiary, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call");
        _;
    }

    constructor(address tokenAddress) {
        require(tokenAddress != address(0), "Invalid token address");
        token = IERC20(tokenAddress);
        owner = msg.sender;
    }

    function createVestingSchedule(
        address beneficiary,
        uint256 totalAmount,
        uint256 cliffSeconds,
        uint256 durationSeconds,
        uint256 tgePercent
    ) external onlyOwner returns (bytes32) {
        require(beneficiary != address(0), "Invalid beneficiary");
        require(totalAmount > 0, "Amount must be > 0");

        bytes32 scheduleId = keccak256(abi.encodePacked(beneficiary, block.timestamp, scheduleIds.length));
        uint256 tgeAmount = (totalAmount * tgePercent) / 100;

        schedules[scheduleId] = VestingSchedule({
            beneficiary: beneficiary,
            totalAmount: totalAmount,
            releasedAmount: 0,
            startTimestamp: block.timestamp,
            cliffDuration: cliffSeconds,
            vestingDuration: durationSeconds,
            tgeAmount: tgeAmount
        });

        scheduleIds.push(scheduleId);
        emit ScheduleCreated(scheduleId, beneficiary, totalAmount);

        // Immediate release of TGE unlock if configured
        if (tgeAmount > 0) {
            schedules[scheduleId].releasedAmount = tgeAmount;
            require(token.transfer(beneficiary, tgeAmount), "TGE transfer failed");
            emit TokensReleased(scheduleId, beneficiary, tgeAmount);
        }

        return scheduleId;
    }

    function computeReleasableAmount(bytes32 scheduleId) public view returns (uint256) {
        VestingSchedule memory schedule = schedules[scheduleId];
        if (schedule.beneficiary == address(0)) return 0;

        if (block.timestamp < schedule.startTimestamp + schedule.cliffDuration) {
            return 0;
        }

        uint256 remainingVesting = schedule.totalAmount - schedule.tgeAmount;
        if (block.timestamp >= schedule.startTimestamp + schedule.vestingDuration) {
            return schedule.totalAmount - schedule.releasedAmount;
        }

        uint256 elapsed = block.timestamp - (schedule.startTimestamp + schedule.cliffDuration);
        uint256 linearDuration = schedule.vestingDuration - schedule.cliffDuration;
        uint256 vestedLinear = (remainingVesting * elapsed) / linearDuration;

        uint256 totalVested = schedule.tgeAmount + vestedLinear;
        if (totalVested > schedule.releasedAmount) {
            return totalVested - schedule.releasedAmount;
        }
        return 0;
    }

    function release(bytes32 scheduleId) external {
        VestingSchedule storage schedule = schedules[scheduleId];
        require(schedule.beneficiary != address(0), "Schedule not found");

        uint256 amount = computeReleasableAmount(scheduleId);
        require(amount > 0, "No tokens due for release");

        schedule.releasedAmount += amount;
        require(token.transfer(schedule.beneficiary, amount), "Token transfer failed");

        emit TokensReleased(scheduleId, schedule.beneficiary, amount);
    }
}
`
}

export function generateVestingScheduleSvg(allocations = DEFAULT_ALLOCATIONS): string {
  // Simple bar/radial visual breakdown SVG
  const colors = ['#00f4a3', '#38bdf8', '#ff007a', '#7928ca']

  const bars = allocations
    .map((alloc, idx) => {
      const y = 30 + idx * 48
      const width = alloc.percentage * 3.4
      const color = colors[idx % colors.length]
      return `
      <g transform="translate(20, ${y})">
        <text x="0" y="0" fill="#f0f4f8" font-size="12" font-weight="bold" font-family="sans-serif">${alloc.name} (${alloc.percentage}%)</text>
        <text x="360" y="0" fill="#94a3b8" font-size="11" font-family="sans-serif" text-anchor="end">TGE: ${alloc.tgeUnlockPercent}% · Cliff: ${alloc.cliffMonths}mo · Vest: ${alloc.vestingMonths}mo</text>
        <rect x="0" y="8" width="360" height="14" rx="7" fill="rgba(255, 255, 255, 0.08)" />
        <rect x="0" y="8" width="${width}" height="14" rx="7" fill="${color}" />
      </g>`
    })
    .join('')

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" width="100%" height="100%">
    <rect width="400" height="240" rx="16" fill="#090d16" stroke="rgba(0, 240, 255, 0.2)" stroke-width="1.5" />
    <text x="20" y="24" fill="#00f4a3" font-size="13" font-weight="900" font-family="sans-serif" letter-spacing="1">TOKENOMICS VESTING SCHEDULE</text>
    ${bars}
  </svg>`
}
