# VMF Staking DApp - Deployment Guide

## Overview
This guide covers deploying the VMF Staking DApp to Base Mainnet using the existing $VMF token (0xA3E82adF6bd3207a1d2470ED7Ad742596Ee81776).

---

## Configuration

### Network
- **Network**: Base Mainnet
- **Chain ID**: 8453
- **RPC Endpoint**: https://mainnet.base.org or https://api.developer.coinbase.com/rpc/v1/base/[YOUR_KEY]

### Contract Parameters
- **VMF Token Address**: 0xA3E82adF6bd3207a1d2470ED7Ad742596Ee81776
- **APR Rate**: 15% per year (4,756,468,798 per second, scaled by 1e18)
- **Minimum Staking Period**: 86,400 seconds (1 day)
- **Minimum Stake Cap**: 0 VMF (no minimum)
- **Maximum Stake Cap**: 5,000 VMF
- **Website**: https://vmfcoin.com/staking

---

## Step 1: Prepare Environment Variables

Create or update your `.env` file with the following:

```bash
# Private key for deployment (NEVER commit this!)
PRIVATE_KEY=0x...your_private_key_here...

# Base Mainnet RPC URL
BASE_RPC_URL=https://mainnet.base.org
# OR use Coinbase RPC with API key:
# BASE_RPC_URL=https://api.developer.coinbase.com/rpc/v1/base/YOUR_API_KEY

# For contract verification on BaseScan
BASESCAN_API_KEY=your_basescan_api_key
```

**Security Note**: Never commit private keys to version control. Use `.env.local` for local development.

---

## Step 2: Deploy VMFStaking Contract

### Option A: Using Hardhat Deployment Script

```bash
# Run the deployment script
npx hardhat run scripts/deploy-staking.ts --network base
```

This will:
1. Deploy VMFStaking contract with:
   - VMF token address: 0xA3E82adF6bd3207a1d2470ED7Ad742596Ee81776
   - 15% APR (4,756,468,798 per second)
   - Minimum period: 1 day
   - Max stake: 5,000 VMF
2. Output deployment details including the contract address
3. Save deployment info to console (save this!)

**Expected Output**:
```
==============================================================
VMFStaking Contract Deployment
==============================================================
Configuration:
  VMF Token Address: 0xA3E82adF6bd3207a1d2470ED7Ad742596Ee81776
  APR Rate: 15% per year
  APR per second (scaled): 4756468798
  ...
✅ VMFStaking deployed successfully!
   Contract Address: 0x...YOUR_STAKING_CONTRACT_ADDRESS...
```

### Option B: Manual Deployment via Console

```bash
# Open Hardhat console
npx hardhat console --network base

# Deploy the contract
const VMFStaking = await ethers.getContractFactory("VMFStaking");
const staking = await VMFStaking.deploy(
  86400,                           // 1 day minimum period
  4756468798n,                     // 15% APR per second (scaled 1e18)
  ethers.parseEther("0"),          // 0 minimum stake
  ethers.parseEther("5000"),       // 5000 max stake
  "0xA3E82adF6bd3207a1d2470ED7Ad742596Ee81776" // VMF token address
);

await staking.waitForDeployment();
console.log("Deployed at:", await staking.getAddress());
```

---

## Step 3: Update Frontend Configuration

Once you have the deployed contract address, update the frontend configuration:

### Update `/src/contracts/addresses.ts`:

```typescript
export const STAKING_CONTRACT_ADDRESS: `0x${string}` =
  "0x...YOUR_DEPLOYED_STAKING_ADDRESS..."; // Replace with actual address
export const MOCK_TOKEN_ADDRESS: `0x${string}` =
  "0xA3E82adF6bd3207a1d2470ED7Ad742596Ee81776"; // VMF Token
```

### Verify APR Settings

Check that APR is set to 15% in these files:
- `/src/utils/yieldCalculations.ts` - APR_RATE_PER_SECOND = 4.756468797564688e-9
- `/src/hooks/useRealTimeYield.ts` - APR = 0.15
- `/src/components/StakingForm.tsx` - BASE_APR = 15

---

## Step 4: Set Up The Graph Subgraph (Optional but Recommended)

The frontend uses GraphQL to fetch staking data. You need to either:

### Option A: Use Existing Subgraph (if available)
If The Graph already indexes your contract, update `/src/providers/AppProviders.tsx`:
```typescript
const apolloClient = new ApolloClient({
  uri: "https://api.studio.thegraph.com/query/YOUR_SUBGRAPH_ID/vmf_staking/version/latest",
  cache: new InMemoryCache(),
});
```

### Option B: Deploy Your Own Subgraph
1. Go to https://thegraph.com/studio
2. Create a new subgraph for your VMFStaking contract
3. Follow The Graph's documentation to index stake events
4. Deploy and publish your subgraph
5. Update the Apollo Client URI with your subgraph endpoint

**Note**: Without a working subgraph, the "View Stakes" feature will not display user data. The contract read functions will still work, but real-time updates won't be available.

---

## Step 5: Verify Contract on BaseScan (Important!)

Contract verification provides transparency and allows users to see the source code.

### Using Hardhat Verify Plugin:

```bash
npx hardhat verify --network base \
  0x...YOUR_DEPLOYED_STAKING_ADDRESS... \
  86400 \
  4756468798 \
  0 \
  5000000000000000000000 \
  0xA3E82adF6bd3207a1d2470ED7Ad742596Ee81776
```

### Manual Verification:
1. Go to https://basescan.org
2. Search for your contract address
3. Click "Verify and Publish"
4. Use Solidity compiler version 0.8.24
5. Paste the contract source code from `contracts/src/VMFStaking.sol`
6. Fill in constructor arguments

---

## Step 6: Configure Owner Capabilities

After deployment, configure stake caps (done by contract owner):

```bash
npx hardhat console --network base

# Connect to your deployed contract
const staking = await ethers.getContractAt(
  "VMFStaking",
  "0x...YOUR_STAKING_ADDRESS..."
);

// Set minimum stake cap (0 for no minimum)
await staking.setMinimumStakeCap(ethers.parseEther("0"));

// Set maximum stake cap (5000 VMF)
await staking.setMaximumStakeCap(ethers.parseEther("5000"));

// Verify settings
console.log("Min cap:", await staking.minimumStakeCap());
console.log("Max cap:", await staking.maximumStakeCap());
console.log("APR rate:", await staking._minimumAPRRate());
```

---

## Step 7: Test on Testnet First (Recommended)

Before deploying to mainnet, test on Base Sepolia:

1. Update `hardhat.config.ts` to include Base Sepolia network
2. Get testnet ETH from Base Sepolia faucet
3. Deploy to testnet: `npx hardhat run scripts/deploy-staking.ts --network baseSepolia`
4. Test full flow: mint → approve → stake → withdraw
5. Verify everything works before mainnet deployment

---

## Step 8: Deploy Frontend

### Build for Production:
```bash
npm run build
```

### Deploy to vmfcoin.com/staking:

If using Vercel (currently configured):
```bash
npx vercel deploy --prod
```

Or manually push to your deployment platform:
```bash
# Set environment variables in your hosting platform
VITE_WALLETCONNECT_PROJECT_ID=b1647c589ac18a28722c490d2f840895

# Then deploy the dist folder
npm run build
# Upload dist/ to your hosting
```

---

## Post-Deployment Checklist

- [ ] VMFStaking contract deployed to Base Mainnet
- [ ] Contract verified on BaseScan
- [ ] Frontend addresses.ts updated with deployed contract address
- [ ] APR rates verified (15% in all locations)
- [ ] Stake caps configured (0 min, 5,000 max)
- [ ] The Graph subgraph set up and queryable
- [ ] Frontend environment variables configured
- [ ] Frontend build successful
- [ ] Frontend deployed to vmfcoin.com/staking
- [ ] End-to-end testing complete:
  - [ ] Connect wallet
  - [ ] Mint tokens
  - [ ] Approve tokens
  - [ ] Stake tokens
  - [ ] View stakes
  - [ ] Withdraw yield
  - [ ] Withdraw stake
- [ ] Transaction notifications displaying correctly
- [ ] BaseScan links working in notifications

---

## Important Notes

### Security Considerations
1. **Private Key**: Store securely, never commit to git
2. **Contract Ownership**: Contract owner can modify stakes caps and receive ownership transfers
3. **Token Permissions**: The staking contract needs to be approved by users before they can stake
4. **Max Stake Limit**: Currently set to 5,000 VMF per position (configurable)

### Monitoring
- Monitor transaction failures in deployment
- Check BaseScan for contract interactions
- Monitor The Graph for indexing delays (can take 5-60 seconds)
- Track user stakes in real-time via frontend

### Troubleshooting

**Transaction fails with "Invalid token"**
- Verify VMF token address is correct: 0xA3E82adF6bd3207a1d2470ED7Ad742596Ee81776
- Ensure token exists on Base Mainnet (not Sepolia)

**"View Stakes" shows no data**
- The Graph subgraph may not be set up
- Check if subgraph is deployed and synced
- Verify Apollo Client URI in AppProviders.tsx

**Frontend shows wrong APR**
- Check APR values in yieldCalculations.ts, useRealTimeYield.ts, StakingForm.tsx
- All should use 15% (0.15 decimal or 4.756468797564688e-9 per second)

**Stake transaction fails with amount error**
- Verify user has approved tokens
- Check if amount is between min (0) and max (5,000)
- Ensure user has sufficient balance

---

## Support & Resources

- **BaseScan**: https://basescan.org (view transactions, contracts)
- **The Graph**: https://thegraph.com/studio (manage subgraph)
- **Base Docs**: https://docs.base.org
- **Wagmi Docs**: https://wagmi.sh
- **Hardhat Docs**: https://hardhat.org/docs

---

## Contract ABIs & Addresses Reference

**VMF Token (ERC20)**
- Address: 0xA3E82adF6bd3207a1d2470ED7Ad742596Ee81776
- Type: Standard ERC20

**VMFStaking (Custom)**
- Address: 0x...YOUR_DEPLOYED_ADDRESS...
- Functions:
  - `stake(uint112 amount, uint40 period)` - Stake tokens for fixed period
  - `withdraw(uint48 id, uint112 amount)` - Withdraw partial stake after period
  - `withdrawAll(uint48 id)` - Withdraw full stake and yield
  - `withdrawYield(uint48 id)` - Claim yield without withdrawing principal
  - `setMinimumStakeCap(uint112)` - Owner: set minimum stake
  - `setMaximumStakeCap(uint112)` - Owner: set maximum stake

---

**Last Updated**: December 2024
**Network**: Base Mainnet (8453)
**Version**: 1.0.0
