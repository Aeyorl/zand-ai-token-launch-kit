import type { LaunchKit } from './brandGenerator'

export interface VerificationPackage {
  contractName: string
  compilerVersion: string
  optimizationRuns: number
  constructorArgumentsHex: string
  standardJsonInput: string
  foundryVerifyCommand: string
  hardhatVerifyCommand: string
  blockscoutApiPayload: Record<string, unknown>
}

export function generateVerificationPackage(
  kit: LaunchKit,
  contractAddress = '0x42170bA5E8C9472DaE419Fa432170DEAdbeef123',
  soliditySource = '',
  networkKey = 'robinhood-mainnet',
): VerificationPackage {
  const cleanName = kit.tokenName.replace(/[^A-Za-z0-9]/g, '') || 'Token'
  const symbol = kit.primaryTicker.replace('$', '')
  const supplyNum = kit.tokenomics?.supply?.replace(/,/g, '') || '1000000000'

  // ABI encoded arguments (name, symbol, deployer, supply)
  const encoder = new TextEncoder()
  const nameHex = Array.from(encoder.encode(kit.tokenName), (b) => b.toString(16).padStart(2, '0')).join('')
  const symbolHex = Array.from(encoder.encode(symbol), (b) => b.toString(16).padStart(2, '0')).join('')
  const constructorArgsHex = `${nameHex.padEnd(64, '0')}${symbolHex.padEnd(64, '0')}${'0'.repeat(24)}${'42170bA5E8C9472DaE419Fa432170DEAdbeef123'.slice(2)}${BigInt(supplyNum).toString(16).padStart(64, '0')}`

  const standardJson = {
    language: 'Solidity',
    sources: {
      [`${cleanName}.sol`]: {
        content:
          soliditySource ||
          `// SPDX-License-Identifier: MIT\npragma solidity ^0.8.20;\n\ncontract ${cleanName} {\n    string public name = "${kit.tokenName}";\n    string public symbol = "${symbol}";\n    uint8 public decimals = 18;\n    uint256 public totalSupply = ${supplyNum} * 10**18;\n    mapping(address => uint256) public balanceOf;\n}`,
      },
    },
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      evmVersion: 'paris',
      outputSelection: {
        '*': {
          '*': ['abi', 'evm.bytecode', 'evm.deployedBytecode'],
        },
      },
    },
  }

  const rpcMap: Record<string, { chainId: number; explorer: string; rpc: string }> = {
    'robinhood-mainnet': {
      chainId: 42170,
      explorer: 'https://explorer.robinhood.com',
      rpc: 'https://mainnet.robinhood.com/rpc',
    },
    'base-mainnet': {
      chainId: 8453,
      explorer: 'https://basescan.org',
      rpc: 'https://mainnet.base.org',
    },
    'arbitrum-one': {
      chainId: 42161,
      explorer: 'https://arbiscan.io',
      rpc: 'https://arb1.arbitrum.io/rpc',
    },
    'ethereum-mainnet': {
      chainId: 1,
      explorer: 'https://etherscan.io',
      rpc: 'https://eth.llamarpc.com',
    },
  }

  const selectedNet = rpcMap[networkKey] || rpcMap['robinhood-mainnet']

  return {
    contractName: cleanName,
    compilerVersion: 'v0.8.20+commit.a1b79de6',
    optimizationRuns: 200,
    constructorArgumentsHex: constructorArgsHex,
    standardJsonInput: JSON.stringify(standardJson, null, 2),
    foundryVerifyCommand: `forge verify-contract ${contractAddress} src/${cleanName}.sol:${cleanName} --chain-id ${selectedNet.chainId} --verifier-url ${selectedNet.explorer}/api --constructor-args 0x${constructorArgsHex}`,
    hardhatVerifyCommand: `npx hardhat verify --network ${networkKey} ${contractAddress} "${kit.tokenName}" "${symbol}" "${supplyNum}"`,
    blockscoutApiPayload: {
      address: contractAddress,
      compiler_version: 'v0.8.20+commit.a1b79de6',
      optimization: true,
      optimization_runs: 200,
      contract_name: cleanName,
      autodetect_constructor_args: true,
      constructor_arguments: constructorArgsHex,
    },
  }
}
