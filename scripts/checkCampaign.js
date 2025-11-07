const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  const campaignId = process.env.CAMPAIGN_ID ? parseInt(process.env.CAMPAIGN_ID) : 0;

  // Load deployed contract address
  const deploymentPath = path.join(__dirname, '../deployments/localhost.json');
  if (!fs.existsSync(deploymentPath)) {
    console.error("❌ No deployment found. Please deploy the contract first.");
    process.exit(1);
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
  const contractAddress = deployment.address;

  // Get contract
  const CharityCampaignFactory = await ethers.getContractFactory("CharityCampaignFactory");
  const contract = CharityCampaignFactory.attach(contractAddress);

  // Get campaign details
  const campaign = await contract.getCampaign(campaignId);
  
  // Get current block time
  const blockNumber = await ethers.provider.getBlockNumber();
  const block = await ethers.provider.getBlock(blockNumber);
  const currentTime = block.timestamp;

  // Parse campaign data
  const deadline = Number(campaign[4]);
  const totalRaised = campaign[5];
  const goalAmount = campaign[3];
  const finalized = campaign[6];
  const refundEnabled = campaign[7];

  // Calculate status
  const isExpired = currentTime >= deadline;
  const goalReached = totalRaised >= goalAmount;
  const progress = goalAmount > 0n ? (totalRaised * 100n / goalAmount) : 0n;

  console.log("\n" + "=".repeat(60));
  console.log(`📋 Campaign #${campaignId}: ${campaign[1]}`);
  console.log("=".repeat(60));
  console.log(`💰 Goal: ${ethers.formatEther(goalAmount)} ETH`);
  console.log(`📊 Raised: ${ethers.formatEther(totalRaised)} ETH (${progress}%)`);
  console.log(`⏰ Deadline: ${new Date(deadline * 1000).toLocaleString()}`);
  console.log(`🕐 Current Time: ${new Date(currentTime * 1000).toLocaleString()}`);
  console.log(`⏳ Expired: ${isExpired ? "YES ⚠️" : "NO ✅"}`);
  console.log(`🎯 Goal Reached: ${goalReached ? "YES 🎉" : "NO ❌"}`);
  console.log(`✔️ Finalized: ${finalized ? "YES" : "NO"}`);
  console.log(`💸 Refunds Enabled: ${refundEnabled ? "YES" : "NO"}`);
  
  if (!finalized && isExpired) {
    console.log("\n⚠️  Campaign is expired but not finalized yet!");
    console.log("💡 You can now finalize this campaign.");
  }
  
  if (finalized && refundEnabled) {
    console.log("\n💸 Donors can now claim refunds!");
  }
  
  console.log("=".repeat(60) + "\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
