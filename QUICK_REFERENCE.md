# VMF Staking - Quick Reference Card

## Configuration Values

```
Network:        Base Mainnet (8453)
RPC:            https://mainnet.base.org
VMF Token:      0xA3E82adF6bd3207a1d2470ED7Ad742596Ee81776
APR:            15% per year
Min Stake:      0 VMF
Max Stake:      5,000 VMF
Min Period:     1 day (86,400 seconds)
Website:        https://vmfcoin.com/staking
```

## Environment Setup

```bash
# .env file
PRIVATE_KEY=0x...your_64_char_key...
BASE_RPC_URL=https://mainnet.base.org
BASESCAN_API_KEY=your_api_key
```

## Deployment Command

```bash
npx hardhat run scripts/deploy-staking.ts --network base
```

## Three-Step Launch

1. **Set .env** → `PRIVATE_KEY` + `BASE_RPC_URL`
2. **Deploy** → `npx hardhat run scripts/deploy-staking.ts --network base`
3. **Update** → Update `src/contracts/addresses.ts` with contract address

## Files You Need to Know

| File | Purpose | Action |
|------|---------|--------|
| `.env` | Environment config | Add PRIVATE_KEY & RPC_URL |
| `scripts/deploy-staking.ts` | Deployment script | Run to deploy contract |
| `src/contracts/addresses.ts` | Contract addresses | Update with deployed address |
| `DEPLOYMENT_GUIDE.md` | Full guide | Read for details |
| `SETUP_CHECKLIST.md` | Verification checklist | Use to verify setup |

## After Deployment

1. Copy contract address from deploy output
2. Update `src/contracts/addresses.ts`
3. Verify contract on BaseScan (optional but recommended)
4. Test mint → approve → stake → withdraw flow
5. Deploy frontend: `npm run build` then deploy `dist/`

## What's Already Done

✅ Network switched to Base Mainnet
✅ APR set to 15% everywhere
✅ Transaction notifications added
✅ Input validation added
✅ Deployment script created
✅ Documentation complete

## What You Need to Do

1. ⏳ Deploy contract to mainnet
2. ⏳ Update contract address in frontend
3. ⏳ Test full flow
4. ⏳ Deploy frontend
5. ⏳ Go live!

## Testing Flows

```
Mint       → Input amount → Click mint → Wait notification → Check balance
Approve    → Click stake → Approve popup → Confirm → Wait notification
Stake      → Input amount & period → Click stake → Wait → See in "View Stakes"
Withdraw   → Click withdraw on stake → Confirm → Wait → Balance updated
```

## Key Contract Functions

```solidity
stake(amount, period_in_days)
withdraw(stake_id, amount)
withdrawAll(stake_id)
withdrawYield(stake_id)
setMinimumStakeCap(amount)     // Owner only
setMaximumStakeCap(amount)     // Owner only
```

## Error Messages & Solutions

| Error | Solution |
|-------|----------|
| "Please enter amount" | Fill in amount field |
| "Invalid positive number" | Enter positive number |
| "Exceeds maximum of 5,000 VMF" | Reduce amount to ≤ 5,000 |
| "Insufficient balance" | Mint more tokens first |
| "Please connect wallet" | Connect MetaMask to Base |
| Network mismatch | Switch MetaMask to Base Mainnet |

## Important Reminders

⚠️ Save contract address after deployment
⚠️ Keep private key secret
⚠️ Test before going live
⚠️ Verify contract on BaseScan
⚠️ Update frontend addresses before deploying

## Links

- Deploy: BaseScan https://basescan.org
- Verify: Contract verification https://basescan.org/verify
- Graph: https://thegraph.com/studio
- Docs: https://docs.base.org

## Support Documents

- 📄 DEPLOYMENT_GUIDE.md - Detailed steps
- 📄 SETUP_CHECKLIST.md - Verification checklist
- 📄 CHANGES_SUMMARY.md - What changed
- 📄 README_IMPLEMENTATION.md - Full summary

---

**Ready to deploy?** Run: `npx hardhat run scripts/deploy-staking.ts --network base`
