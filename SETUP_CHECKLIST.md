# VMF Staking Setup Checklist

## Quick Start Checklist

### Before Deployment
- [ ] Ensure you have Base Mainnet RPC URL
- [ ] Generate or import private key for deployment wallet
- [ ] Fund wallet with ETH for gas (at least 1 ETH recommended)
- [ ] Create BaseScan API key for contract verification
- [ ] npm dependencies installed: `npm install`

### Contract Deployment
- [ ] Update `.env` with PRIVATE_KEY and BASE_RPC_URL
- [ ] Run deployment script: `npx hardhat run scripts/deploy-staking.ts --network base`
- [ ] Copy the contract address from output
- [ ] Wait ~1 minute for transaction confirmation on Base
- [ ] Verify contract on BaseScan (manual or with hardhat verify)

### Frontend Configuration
- [ ] Update `src/contracts/addresses.ts` with deployed STAKING_CONTRACT_ADDRESS
- [ ] Verify MOCK_TOKEN_ADDRESS = 0xA3E82adF6bd3207a1d2470ED7Ad742596Ee81776
- [ ] Verify APR is 15% in:
  - [ ] `src/utils/yieldCalculations.ts` (4.756468797564688e-9)
  - [ ] `src/hooks/useRealTimeYield.ts` (0.15)
  - [ ] `src/components/StakingForm.tsx` (BASE_APR = 15)
- [ ] Verify wagmi.ts is configured for Base Mainnet (not Sepolia)

### The Graph Setup (Optional but Recommended)
- [ ] If subgraph exists, get the endpoint from The Graph Studio
- [ ] If not, create new subgraph at https://thegraph.com/studio
- [ ] Update Apollo Client URI in `src/providers/AppProviders.tsx`
- [ ] Deploy subgraph (may take 30+ minutes to fully sync)

### Post-Deployment Configuration
- [ ] Connect to deployed contract as owner
- [ ] Configure stakes caps:
  - [ ] Minimum: 0 VMF (no minimum)
  - [ ] Maximum: 5,000 VMF
- [ ] Verify caps are set correctly

### Testing
- [ ] Test on mainnet or use testnet first:
  - [ ] Connect MetaMask/wallet to Base Mainnet
  - [ ] Mint test tokens
  - [ ] Approve tokens
  - [ ] Stake tokens
  - [ ] Verify stake appears in "View Stakes"
  - [ ] Wait a few seconds, verify yield increases
  - [ ] Withdraw yield
  - [ ] Check transaction notifications appear
  - [ ] Verify BaseScan links in notifications work

### Frontend Deployment
- [ ] Build: `npm run build`
- [ ] Test build locally: `npm run preview`
- [ ] Set environment variables on hosting platform
- [ ] Deploy to vmfcoin.com/staking
- [ ] Test live site:
  - [ ] Connect wallet
  - [ ] Perform staking flow
  - [ ] Check transaction notifications
  - [ ] Verify real-time yield updates

---

## Quick Reference

### Deployment Command
```bash
npx hardhat run scripts/deploy-staking.ts --network base
```

### Configuration Values
```
Network: Base Mainnet (8453)
RPC: https://mainnet.base.org or Coinbase RPC
VMF Token: 0xA3E82adF6bd3207a1d2470ED7Ad742596Ee81776
APR: 15% per year
Min Period: 1 day (86400 seconds)
Min Stake: 0 VMF
Max Stake: 5,000 VMF
```

### Key Files to Update
```
.env (private key, RPC URLs)
src/contracts/addresses.ts (staking contract address)
src/providers/AppProviders.tsx (GraphQL endpoint if using subgraph)
```

### Files Already Updated
```
✅ src/utils/yieldCalculations.ts (APR to 15%)
✅ src/hooks/useRealTimeYield.ts (APR to 15%)
✅ src/components/StakingForm.tsx (APR to 15%, validation, notifications)
✅ src/providers/AppProviders.tsx (Sonner toast provider added)
✅ src/wagmi.ts (Base Mainnet configured)
✅ hardhat.config.ts (Base Mainnet network configured)
✅ scripts/deploy-staking.ts (deployment script created)
✅ scripts/deploy-staking.ts (toast notification service created)
```

---

## Environment Variables Template

```bash
# .env file
PRIVATE_KEY=0x...your_64_character_hex_key...
BASE_RPC_URL=https://mainnet.base.org
BASESCAN_API_KEY=your_api_key_here
VITE_WALLETCONNECT_PROJECT_ID=b1647c589ac18a28722c490d2f840895
```

---

## Verification Commands

```bash
# Check contract owner
npx hardhat console --network base
> const s = await ethers.getContractAt("VMFStaking", "0x...")
> await s.owner()

# Check stake caps
> await s.minimumStakeCap()
> await s.maximumStakeCap()

# Check APR rate
> await s._minimumAPRRate()
```

---

## Estimated Timeline

- **Deploy contract**: 1-2 minutes
- **Verify on BaseScan**: 5-10 minutes
- **Update frontend**: 5 minutes
- **Setup subgraph** (if needed): 30+ minutes
- **Frontend build & deploy**: 10-20 minutes
- **Total**: 1-2 hours (plus subgraph time)

---

## Support Contacts

- **BaseScan**: https://basescan.org
- **Base Discord**: https://discord.gg/base
- **The Graph**: https://discord.gg/thegraph

---

## Notes

- Always test on testnet first
- Keep private key secure, never share
- Contract is immutable once deployed (can't be changed)
- Only owner can adjust stake caps
- Maximum stake is 5,000 VMF per position
- APR is fixed at 15% (cannot be changed after deployment)

---

Last Updated: December 2024
