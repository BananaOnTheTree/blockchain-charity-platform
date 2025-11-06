const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  const [deployer, addr1, addr2, addr3, addr4, addr5] = await ethers.getSigners();
  
  // Get the deployed contract address
  const deploymentData = require('../deployments/localhost.json');
  const contractAddress = deploymentData.address;
  
  console.log("Using contract at:", contractAddress);
  
  const CharityCampaignFactory = await ethers.getContractFactory("CharityCampaignFactory");
  const contract = CharityCampaignFactory.attach(contractAddress);
  
  // Create a campaign
  console.log("\nCreating test campaign...");
  const goalAmount = ethers.parseEther("10");
  const durationDays = 30;
  
  const tx = await contract.createCampaign(
    addr1.address,
    "Test Campaign with Leaderboard",
    "A campaign to test the leaderboard feature",
    goalAmount,
    durationDays
  );
  await tx.wait();
  
  const campaignCount = await contract.getCampaignCount();
  const campaignId = Number(campaignCount) - 1;
  console.log("Campaign created with ID:", campaignId);
  
  // Make donations from different accounts
  console.log("\nMaking test donations...");
  
  const donations = [
    { signer: addr1, amount: "2.5" },
    { signer: addr2, amount: "1.8" },
    { signer: addr3, amount: "3.2" },
    { signer: addr4, amount: "0.5" },
    { signer: addr5, amount: "1.1" },
    { signer: deployer, amount: "0.9" },
  ];
  
  for (const { signer, amount } of donations) {
    const donateTx = await contract.connect(signer).donate(campaignId, {
      value: ethers.parseEther(amount)
    });
    await donateTx.wait();
    console.log(`${signer.address.substring(0, 8)}... donated ${amount} ETH`);
  }
  
  // Get and display leaderboard
  console.log("\n🏆 LEADERBOARD:");
  const [donors, amounts] = await contract.getTopDonors(campaignId, 10);
  
  donors.forEach((donor, index) => {
    const rank = index + 1;
    const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `#${rank}`;
    console.log(`${medal} ${donor.substring(0, 10)}...${donor.substring(38)} - ${ethers.formatEther(amounts[index])} ETH`);
  });
  
  const campaign = await contract.getCampaign(campaignId);
  console.log("\nTotal Raised:", ethers.formatEther(campaign[5]), "ETH");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
