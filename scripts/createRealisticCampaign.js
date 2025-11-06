const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const deploymentPath = path.join(__dirname, "..", "deployments", "localhost.json");
  
  if (!fs.existsSync(deploymentPath)) {
    console.error("❌ Deployment file not found. Please deploy the contract first.");
    process.exit(1);
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  const contractAddress = deployment.address;

  console.log("📝 Creating realistic charity campaign...");
  console.log("Contract address:", contractAddress);

  const [deployer] = await hre.ethers.getSigners();
  console.log("Creating campaign with account:", deployer.address);

  const CharityCampaignFactory = await hre.ethers.getContractFactory("CharityCampaignFactory");
  const factory = CharityCampaignFactory.attach(contractAddress);

  // Realistic campaign details
  const campaigns = [
    {
      beneficiary: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", // Account #1
      title: "Clean Water Initiative for Rural Communities",
      description: "Help us bring clean, safe drinking water to 5,000 families in rural areas. Our project will install water filtration systems and wells in communities that currently lack access to clean water. Every donation helps save lives and prevent waterborne diseases.",
      goalAmount: hre.ethers.parseEther("50"), // 50 ETH
      durationDays: 60
    },
    {
      beneficiary: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", // Account #2
      title: "Education Support for Underprivileged Children",
      description: "Provide school supplies, books, and educational resources to 200 children from low-income families. Your contribution will help these students access quality education and build a brighter future. We'll also fund after-school tutoring programs.",
      goalAmount: hre.ethers.parseEther("25"), // 25 ETH
      durationDays: 45
    },
    {
      beneficiary: "0x90F79bf6EB2c4f870365E785982E1f101E93b906", // Account #3
      title: "Emergency Medical Fund for Cancer Patients",
      description: "Support families facing the financial burden of cancer treatment. This fund will help cover medical expenses, medications, and transportation costs for patients who cannot afford their treatment. Every contribution brings hope to someone fighting for their life.",
      goalAmount: hre.ethers.parseEther("100"), // 100 ETH
      durationDays: 90
    },
    {
      beneficiary: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65", // Account #4
      title: "Animal Shelter & Rescue Operations",
      description: "Help us rescue, rehabilitate, and rehome abandoned animals. Your donation will provide food, medical care, and shelter for cats, dogs, and other animals in need. We've saved over 500 animals this year and need your support to continue our mission.",
      goalAmount: hre.ethers.parseEther("30"), // 30 ETH
      durationDays: 30
    },
    {
      beneficiary: "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc", // Account #5
      title: "Food Bank Emergency Relief Program",
      description: "Combat hunger in our community by providing nutritious meals to families in crisis. With inflation and job losses affecting many households, our food bank serves 1,000+ families weekly. Help us keep our shelves stocked and no one goes to bed hungry.",
      goalAmount: hre.ethers.parseEther("40"), // 40 ETH
      durationDays: 40
    }
  ];

  console.log("\n🚀 Creating campaigns...\n");

  for (let i = 0; i < campaigns.length; i++) {
    const campaign = campaigns[i];
    
    try {
      const tx = await factory.createCampaign(
        campaign.beneficiary,
        campaign.title,
        campaign.description,
        campaign.goalAmount,
        campaign.durationDays
      );
      
      await tx.wait();
      
      console.log(`✅ Campaign ${i}: "${campaign.title}"`);
      console.log(`   Goal: ${hre.ethers.formatEther(campaign.goalAmount)} ETH`);
      console.log(`   Duration: ${campaign.durationDays} days`);
      console.log(`   Beneficiary: ${campaign.beneficiary}\n`);
    } catch (error) {
      console.error(`❌ Failed to create campaign ${i}:`, error.message);
    }
  }

  // Get total campaign count
  const count = await factory.getCampaignCount();
  console.log(`\n✨ Total campaigns created: ${count}`);
  console.log("\n💡 You can now view these campaigns in the frontend!");
  console.log("   Visit: http://localhost:3000");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
