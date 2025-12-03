import { config as dotenvConfig } from 'dotenv';
dotenvConfig();
import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';

const PRIVATE_KEY = process.env.PRIVATE_KEY || '0x' + '0'.repeat(64);

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.24',
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  defaultNetwork: 'hardhat',
  networks: {
    base: {
      url: process.env.BASE_RPC_URL || 'https://mainnet.base.org',
      chainId: 8453,
      accounts: [PRIVATE_KEY],
    },
  },
  paths: {
    sources: 'contracts/src',
    tests: 'contracts/test',
    cache: 'contracts/cache',
    artifacts: 'contracts/artifacts',
  },
  typechain: {
    outDir: 'contracts/typechain-types',
    target: 'ethers-v6',
  },
};

export default config;
