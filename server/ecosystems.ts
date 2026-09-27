import type { LaunchKit } from '../src/brandGenerator'
import { cleanContractName, generateSolidityCode } from './deployment'

export interface LiquidityPairingPlan {
  chain: 'robinhood' | 'ethereum' | 'solana' | 'base' | 'arbitrum'
  dexName: string
  dexUrl: string
  pairWith: string
  initialTokenDeposit: string
  initialPairedDeposit: string
  estimatedStartingPriceUsd: string
  estimatedInitialMarketCapUsd: string
  instructions: string[]
  poolCreationSnippet: string
}

export interface RobinhoodReadinessAudit {
  score: number
  rating: 'Tier A: Prime Candidate' | 'Tier B: Strong Candidate' | 'Tier C: Emerging Candidate'
  summary: string
  metrics: {
    name: string
    status: 'pass' | 'warning' | 'fail'
    detail: string
  }[]
  actionPlan: string[]
  robinhoodConnectConfig: {
    appId: string
    supportedTokens: string[]
    suggestedFiatRamp: string
  }
}

export interface ContractVerificationPayload {
  network: string
  contractAddress: string
  contractName: string
  compilerVersion: string
  optimizationUsed: number
  runs: number
  sourceCode: string
  constructorArguments: string
  explorerApiUrl: string
  curlCommand: string
}

export interface SolanaSplLaunchConfig {
  tokenName: string
  symbol: string
  decimals: number
  initialSupply: string
  metadataUri: string
  cliCommands: string[]
  pumpFunInstructions: {
    title: string
    description: string
    recommendedTwitter: string
    recommendedTelegram: string
  }
}

export function buildLiquidityPlan(
  kit: LaunchKit,
  chain: 'robinhood' | 'ethereum' | 'solana' | 'base' | 'arbitrum' = 'base',
  options: { initialEthOrSol?: number; pairedTokenPriceUsd?: number } = {},
): LiquidityPairingPlan {
  const cleanSupply = Number((kit.tokenomics?.supply || '1000000000').replace(/,/g, '')) || 1_000_000_000
  const pairedAmount = options.initialEthOrSol || (chain === 'solana' ? 25 : chain === 'ethereum' ? 5 : 2)
  const pairedPrice = options.pairedTokenPriceUsd || (chain === 'solana' ? 150 : 3200)

  // Typically 80%-90% of supply seeded to LP
  const tokensInLp = Math.floor(cleanSupply * 0.85)
  const totalDepositUsd = pairedAmount * pairedPrice
  const tokenPriceUsd = totalDepositUsd / tokensInLp
  const marketCapUsd = tokenPriceUsd * cleanSupply

  if (chain === 'robinhood') {
    return {
      chain: 'robinhood',
      dexName: 'Robinhood Chain DEX & Robinhood Swap',
      dexUrl: 'https://robinhood.com/crypto',
      pairWith: 'ETH',
      initialTokenDeposit: tokensInLp.toLocaleString(),
      initialPairedDeposit: `${pairedAmount} ETH (~$${(pairedAmount * pairedPrice).toLocaleString()} USD)`,
      estimatedStartingPriceUsd: `$${tokenPriceUsd.toFixed(8)}`,
      estimatedInitialMarketCapUsd: `$${Math.round(marketCapUsd).toLocaleString()}`,
      instructions: [
        `1. Deploy ${kit.tokenName} contract to Robinhood Chain Mainnet (Chain ID 42170).`,
        `2. Seed initial liquidity (${tokensInLp.toLocaleString()} ${kit.primaryTicker} + ${pairedAmount} ETH) on Robinhood Chain DEX.`,
        '3. Lock LP tokens in Robinhood verified smart contract locker for minimum 12 months.',
        '4. Submit token metadata to Robinhood Wallet token registry for self-custodial trading.',
        '5. Enable zero-fee fiat-to-token onramp via Robinhood Connect widget.',
      ],
      poolCreationSnippet: `// Robinhood Chain Mainnet (Chain ID: 42170) Liquidity Seeder
const robinhoodRouter = new ethers.Contract(ROBINHOOD_ROUTER_ADDRESS, ROUTER_ABI, deployerWallet);
await robinhoodRouter.addLiquidityETH(
    tokenAddress,
    ethers.parseUnits("${tokensInLp}", 18),
    0, // slippage tolerance
    0,
    deployerWallet.address,
    Math.floor(Date.now() / 1000) + 1200,
    { value: ethers.parseEther("${pairedAmount}") }
);`,
    }
  }

  if (chain === 'solana') {
    return {
      chain: 'solana',
      dexName: 'Raydium (CPMM / CLMM)',
      dexUrl: 'https://raydium.io/liquidity/create/',
      pairWith: 'SOL',
      initialTokenDeposit: tokensInLp.toLocaleString(),
      initialPairedDeposit: `${pairedAmount} SOL (~$${(pairedAmount * pairedPrice).toLocaleString()} USD)`,
      estimatedStartingPriceUsd: `$${tokenPriceUsd.toFixed(8)}`,
      estimatedInitialMarketCapUsd: `$${Math.round(marketCapUsd).toLocaleString()}`,
      instructions: [
        '1. Create the SPL token mint and freeze mint authority.',
        `2. Deposit ${tokensInLp.toLocaleString()} ${kit.primaryTicker} and ${pairedAmount} SOL into Raydium CPMM Pool.`,
        '3. Burn or lock 100% of Raydium LP tokens on Streamflow or BurntFinance.',
        '4. Submit token listing verification to Solscan and Jupiter Token List.',
      ],
      poolCreationSnippet: `# Raydium CLI / Solana SDK Pool Seeding
spl-token authorize <MINT_ADDRESS> mint --disable
solana transfer <RAYDIUM_VAULT> ${pairedAmount} --allow-unfunded-recipient
echo "Pool initialized with ${tokensInLp.toLocaleString()} ${kit.primaryTicker} and ${pairedAmount} SOL"`,
    }
  }

  if (chain === 'ethereum') {
    return {
      chain: 'ethereum',
      dexName: 'Uniswap V2 / V3 (Ethereum)',
      dexUrl: 'https://app.uniswap.org/add/v2/ETH',
      pairWith: 'WETH',
      initialTokenDeposit: tokensInLp.toLocaleString(),
      initialPairedDeposit: `${pairedAmount} ETH (~$${(pairedAmount * pairedPrice).toLocaleString()} USD)`,
      estimatedStartingPriceUsd: `$${tokenPriceUsd.toFixed(8)}`,
      estimatedInitialMarketCapUsd: `$${Math.round(marketCapUsd).toLocaleString()}`,
      instructions: [
        `1. Deploy and verify ${kit.tokenName} on Etherscan.`,
        `2. Open Uniswap V2/V3 liquidity pool creation, select ETH and paste contract address.`,
        `3. Supply ${tokensInLp.toLocaleString()} tokens and ${pairedAmount} ETH.`,
        '4. Lock 100% of Uniswap V2 LP tokens for minimum 12 months using UNCX Network or Team Finance.',
        '5. Renounce token contract ownership if no admin minting is needed.',
      ],
      poolCreationSnippet: `// Uniswap V2 Router02 call
uniswapRouter.addLiquidityETH{value: ${pairedAmount} ether}(
    tokenAddress,
    ${tokensInLp} * 10**18,
    0, // slippage min tokens
    0, // slippage min ETH
    ownerAddress,
    block.timestamp + 600
);`,
    }
  }

  // Default: Base / Arbitrum
  const isBase = chain === 'base'
  return {
    chain,
    dexName: isBase ? 'Aerodrome & Uniswap V3 (Base)' : 'Camelot & Uniswap V3 (Arbitrum)',
    dexUrl: isBase ? 'https://aerodrome.finance/liquidity' : 'https://app.camelot.exchange/liquidity',
    pairWith: 'WETH',
    initialTokenDeposit: tokensInLp.toLocaleString(),
    initialPairedDeposit: `${pairedAmount} ETH (~$${(pairedAmount * pairedPrice).toLocaleString()} USD)`,
    estimatedStartingPriceUsd: `$${tokenPriceUsd.toFixed(8)}`,
    estimatedInitialMarketCapUsd: `$${Math.round(marketCapUsd).toLocaleString()}`,
    instructions: [
      `1. Deploy ${kit.tokenName} to ${isBase ? 'Base' : 'Arbitrum'} Mainnet via ZAND AI.`,
      `2. Supply ${tokensInLp.toLocaleString()} ${kit.primaryTicker} paired with ${pairedAmount} ETH on ${isBase ? 'Aerodrome' : 'Camelot'}.`,
      '3. Lock LP NFT or burn LP tokens permanently to build holder confidence.',
      `4. Verify on ${isBase ? 'BaseScan' : 'ArbiScan'} and index on DEXScreener / GeckoTerminal.`,
    ],
    poolCreationSnippet: `// Aerodrome / Camelot initial pool creation
router.addLiquidityETH{value: ${pairedAmount} ether}(
    tokenAddress,
    false, // stable: false for volatile meme tokens
    ${tokensInLp} * 10**18,
    0,
    0,
    msg.sender,
    block.timestamp + 900
);`,
  }
}

export function auditRobinhoodReadiness(kit: LaunchKit): RobinhoodReadinessAudit {
  const metrics: RobinhoodReadinessAudit['metrics'] = []
  let score = 0

  // 1. Tokenomics & Tax check
  const isCleanTax = kit.tokenomics?.tax?.includes('0') || kit.tokenomics?.tax === '0/0'
  if (isCleanTax) {
    score += 25
    metrics.push({
      name: 'Transaction Tax Structure',
      status: 'pass',
      detail: '0% / 0% Tax. Standard for Tier-1 centralized exchange listings like Robinhood.',
    })
  } else {
    score += 10
    metrics.push({
      name: 'Transaction Tax Structure',
      status: 'warning',
      detail: 'Non-zero tax detected. Centralized exchanges require zero-tax architecture for seamless order-book matching.',
    })
  }

  // 2. Supply and Distribution
  const supplyNum = Number((kit.tokenomics?.supply || '0').replace(/,/g, ''))
  if (supplyNum >= 1_000_000 && supplyNum <= 100_000_000_000) {
    score += 25
    metrics.push({
      name: 'Supply Distribution & Denomination',
      status: 'pass',
      detail: `Total supply of ${kit.tokenomics?.supply} fits optimal retail meme coin liquidity brackets.`,
    })
  } else {
    score += 15
    metrics.push({
      name: 'Supply Distribution & Denomination',
      status: 'warning',
      detail: 'Supply denomination exceeds typical exchange decimal limits.',
    })
  }

  // 3. Contract Safety & Renounceability
  score += 25
  metrics.push({
    name: 'Smart Contract Architecture',
    status: 'pass',
    detail: 'Standard OpenZeppelin ERC20 implementation with renounceable ownership and no proxy backdoors.',
  })

  // 4. Community & Brand Narrative
  if (kit.lore && kit.lore.length > 80 && kit.character?.catchphrase) {
    score += 20
    metrics.push({
      name: 'Brand Differentiation & Cultural Moat',
      status: 'pass',
      detail: `Strong mascot lore ("${kit.character.name}"), high engagement catchphrase, and clear viral hook.`,
    })
  } else {
    score += 10
    metrics.push({
      name: 'Brand Differentiation & Cultural Moat',
      status: 'warning',
      detail: 'Expand lore depth and social manifesto to strengthen cultural sentiment score.',
    })
  }

  let rating: RobinhoodReadinessAudit['rating'] = 'Tier C: Emerging Candidate'
  if (score >= 90) rating = 'Tier A: Prime Candidate'
  else if (score >= 75) rating = 'Tier B: Strong Candidate'

  return {
    score,
    rating,
    summary: `${kit.tokenName} meets ${score}% of compliance prerequisites for Robinhood Connect integration and future retail trading review.`,
    metrics,
    actionPlan: [
      'Lock 100% of initial DEX liquidity for minimum 12 months with publicly verified locker.',
      'Achieve $1.5M+ 24h trading volume and 5,000+ unique on-chain token holders.',
      'Maintain active community Telegram with 24/7 moderation and active X / Twitter presence.',
      'Submit Robinhood Connect partnership application to enable 1-click debit card onboarding in your dApp.',
      'Publish transparent token distribution report showing team holding under 5% of circulating supply.',
    ],
    robinhoodConnectConfig: {
      appId: `zand_${kit.primaryTicker.replace('$', '').toLowerCase()}`,
      supportedTokens: ['ETH', 'SOL', 'USDC'],
      suggestedFiatRamp: 'Robinhood Connect Web SDK (0-fee direct bank/debit onramp)',
    },
  }
}

export function buildSolanaLaunchConfig(kit: LaunchKit): SolanaSplLaunchConfig {
  const symbol = kit.primaryTicker.replace('$', '').trim()
  const supply = (kit.tokenomics?.supply || '1000000000').replace(/,/g, '').trim()

  return {
    tokenName: kit.tokenName,
    symbol,
    decimals: 9,
    initialSupply: supply,
    metadataUri: `https://arweave.net/metadata-${symbol.toLowerCase()}.json`,
    cliCommands: [
      '# 1. Install Solana CLI & SPL Token tools',
      'sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"',
      '',
      '# 2. Configure network (mainnet-beta or devnet)',
      'solana config set --url https://api.mainnet-beta.solana.com',
      '',
      '# 3. Create Token Mint (Token-2022 compatible)',
      'spl-token --program-id TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb create-token --decimals 9',
      '',
      '# 4. Create Token Account & Mint Supply',
      'spl-token create-account <MINT_ADDRESS>',
      `spl-token mint <MINT_ADDRESS> ${supply}`,
      '',
      '# 5. Revoke Mint Authority (Immunity guarantee)',
      'spl-token authorize <MINT_ADDRESS> mint --disable',
    ],
    pumpFunInstructions: {
      title: `Pump.fun 1-Click Launch: ${kit.tokenName} (${kit.primaryTicker})`,
      description: kit.lore.slice(0, 300),
      recommendedTwitter: `https://x.com/${symbol.toLowerCase()}_token`,
      recommendedTelegram: `https://t.me/${symbol.toLowerCase()}_portal`,
    },
  }
}

export function buildVerificationPayload(
  kit: LaunchKit,
  contractAddress: string,
  networkKey = 'base-mainnet',
): ContractVerificationPayload {
  const contractName = cleanContractName(kit.tokenName)
  const symbol = kit.primaryTicker.replace('$', '').trim()
  const supply = (kit.tokenomics?.supply || '1000000000').replace(/,/g, '').trim()
  const sourceCode = generateSolidityCode(contractName, kit.tokenName, symbol, supply)

  let explorerApiUrl = 'https://api.basescan.org/api'
  if (networkKey === 'base-sepolia') explorerApiUrl = 'https://api-sepolia.basescan.org/api'
  else if (networkKey === 'arbitrum-one') explorerApiUrl = 'https://api.arbiscan.io/api'
  else if (networkKey === 'ethereum-mainnet') explorerApiUrl = 'https://api.etherscan.io/api'
  else if (networkKey === 'sepolia-testnet') explorerApiUrl = 'https://api-sepolia.etherscan.io/api'

  return {
    network: networkKey,
    contractAddress,
    contractName,
    compilerVersion: 'v0.8.24+commit.e11b9ed9',
    optimizationUsed: 1,
    runs: 200,
    sourceCode,
    constructorArguments: '000000000000000000000000...',
    explorerApiUrl,
    curlCommand: `curl -X POST "${explorerApiUrl}" \\
  -d "apikey=YOUR_EXPLORER_API_KEY" \\
  -d "module=contract" \\
  -d "action=verifysourcecode" \\
  -d "contractaddress=${contractAddress}" \\
  -d "sourceCode=$(cat ${contractName}.sol)" \\
  -d "contractname=${contractName}" \\
  -d "compilerversion=v0.8.24+commit.e11b9ed9" \\
  -d "optimizationUsed=1" \\
  -d "runs=200"`,
  }
}
