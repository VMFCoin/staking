import { ethers } from "hardhat";

/**
 * Deployment script for VMFStaking contract
 *
 * Configuration:
 * - VMF Token Address: 0xA3E82adF6bd3207a1d2470ED7Ad742596Ee81776 (Base Mainnet)
 * - APR: 15% per year
 * - Min Stake: 0 VMF (no minimum)
 * - Max Stake: 5,000 VMF
 * - Minimum Staking Period: 1 day (86400 seconds)
 *
 * Usage:
 *   npx hardhat run scripts/deploy-staking.ts --network base
 */

async function main() {
  console.log("=".repeat(60));
  console.log("VMFStaking Contract Deployment");
  console.log("=".repeat(60));

  // Configuration
  const VMF_TOKEN_ADDRESS = "0xA3E82adF6bd3207a1d2470ED7Ad742596Ee81776";
  const APR_PERCENTAGE = 15; // 15% per year
  const MINIMUM_STAKING_PERIOD = 86400; // 1 day in seconds
  const MINIMUM_STAKE_CAP = ethers.parseEther("0"); // No minimum
  const MAXIMUM_STAKE_CAP = ethers.parseEther("5000"); // 5,000 VMF max

  // Calculate APR per second (scaled by 1e18)
  const aprDecimal = APR_PERCENTAGE / 100;
  const secondsPerYear = 365 * 24 * 60 * 60;
  const aprPerSecond = (aprDecimal / secondsPerYear) * 1e18;
  const aprPerSecondBigInt = BigInt(Math.round(aprPerSecond));

  console.log("\nConfiguration:");
  console.log(`  VMF Token Address: ${VMF_TOKEN_ADDRESS}`);
  console.log(`  APR Rate: ${APR_PERCENTAGE}% per year`);
  console.log(`  APR per second (scaled): ${aprPerSecondBigInt.toString()}`);
  console.log(`  Minimum Staking Period: ${MINIMUM_STAKING_PERIOD} seconds (1 day)`);
  console.log(`  Minimum Stake Cap: ${ethers.formatEther(MINIMUM_STAKE_CAP)} VMF`);
  console.log(`  Maximum Stake Cap: ${ethers.formatEther(MAXIMUM_STAKE_CAP)} VMF`);

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log(`\nDeploying with account: ${deployer.address}`);
  console.log(`Account balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH`);

  // Deploy VMFStaking contract
  console.log("\n" + "=".repeat(60));
  console.log("Deploying VMFStaking contract...");
  console.log("=".repeat(60));

  const VMFStaking = await ethers.getContractFactory("VMFStaking");
  const vmfStaking = await VMFStaking.deploy(
    MINIMUM_STAKING_PERIOD,
    aprPerSecondBigInt,
    MINIMUM_STAKE_CAP,
    MAXIMUM_STAKE_CAP,
    VMF_TOKEN_ADDRESS
  );

  await vmfStaking.waitForDeployment();
  const stakingAddress = await vmfStaking.getAddress();

  console.log(`\n✅ VMFStaking deployed successfully!`);
  console.log(`   Contract Address: ${stakingAddress}`);

  // Verify deployment
  console.log("\n" + "=".repeat(60));
  console.log("Verifying deployment...");
  console.log("=".repeat(60));

  const owner = await vmfStaking.owner();
  const tokenAddr = await vmfStaking.token();
  const minimumRate = await vmfStaking._minimumAPRRate();
  const minCap = await vmfStaking.minimumStakeCap();
  const maxCap = await vmfStaking.maximumStakeCap();

  console.log(`\nDeployed contract details:`);
  console.log(`  Owner: ${owner}`);
  console.log(`  Token Address: ${tokenAddr}`);
  console.log(`  APR Rate (per second): ${minimumRate.toString()}`);
  console.log(`  Minimum Stake Cap: ${ethers.formatEther(minCap)} VMF`);
  console.log(`  Maximum Stake Cap: ${ethers.formatEther(maxCap)} VMF`);

  // Save deployment info
  const deploymentInfo = {
    network: "base",
    chainId: 8453,
    vmfStakingAddress: stakingAddress,
    vmfTokenAddress: VMF_TOKEN_ADDRESS,
    aprPercentage: APR_PERCENTAGE,
    aprPerSecond: aprPerSecondBigInt.toString(),
    minimumStakingPeriod: MINIMUM_STAKING_PERIOD,
    minimumStakeCap: ethers.formatEther(MINIMUM_STAKE_CAP),
    maximumStakeCap: ethers.formatEther(MAXIMUM_STAKE_CAP),
    deployer: deployer.address,
    deploymentDate: new Date().toISOString(),
    blockNumber: await ethers.provider.getBlockNumber(),
  };

  console.log("\n" + "=".repeat(60));
  console.log("Deployment Info (save this!):");
  console.log("=".repeat(60));
  console.log(JSON.stringify(deploymentInfo, null, 2));

  console.log("\n" + "=".repeat(60));
  console.log("Next Steps:");
  console.log("=".repeat(60));
  console.log(`1. Verify contract on BaseScan:`);
  console.log(`   https://basescan.org/address/${stakingAddress}`);
  console.log(`\n2. Update src/contracts/addresses.ts with the contract address`);
  console.log(`\n3. Set up The Graph subgraph to index the contract`);
  console.log(`\n4. Test the staking flow on mainnet`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
