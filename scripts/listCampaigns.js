const { ethers } = require("hardhat");
require('dotenv').config();

async function main() {
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
  
  const CharityCampaignFactory = await ethers.getContractAt(
    "CharityCampaignFactory",
    contractAddress
  );

  const count = await CharityCampaignFactory.getCampaignCount();
  console.log(`\nTotal campaigns: ${count}\n`);

  for (let i = 0; i < count; i++) {
    const campaign = await CharityCampaignFactory.getCampaign(i);
    console.log(`Campaign ${i}:`);
    console.log(`  Title: ${campaign[1]}`);
    console.log(`  Description: ${campaign[2]}`);
    console.log(`  Goal: ${ethers.formatEther(campaign[3])} ETH`);
    console.log(`  Raised: ${ethers.formatEther(campaign[5])} ETH`);
    console.log(`  Beneficiary: ${campaign[0]}`);
    console.log(`  Creator: ${campaign[8]}`);
    console.log(`  Deadline: ${new Date(Number(campaign[4]) * 1000).toLocaleString()}`);
    console.log(`  Finalized: ${campaign[6]}`);
    console.log(`---\n`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
