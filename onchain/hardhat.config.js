require('dotenv').config({ path: '../.env' });
require('@nomicfoundation/hardhat-toolbox');

const PRIVATE_KEY = process.env.PRIVATE_KEY || '0x' + '0'.repeat(64);

module.exports = {
  solidity: {
    version: '0.8.24',
    settings: { optimizer: { enabled: true, runs: 200 } }
  },
  defaultNetwork: 'hardhat',
  networks: {
    baseSepolia: {
      url: process.env.BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org',
      chainId: 84532,
      accounts: [PRIVATE_KEY]
    }
  },
  paths: {
    sources: '../contracts',
    tests: './test',
    cache: './cache',
    artifacts: './artifacts'
  },
  typechain: {
    outDir: './typechain-types',
    target: 'ethers-v6'
  }
};
