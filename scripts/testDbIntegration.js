const hre = require("hardhat");

async function main() {
  console.log("🚀 Testing Campaign-Database Integration...\n");

  // Get contract
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const CharityCampaignFactory = await hre.ethers.getContractFactory("CharityCampaignFactory");
  const factory = CharityCampaignFactory.attach(contractAddress);

  const [creator] = await hre.ethers.getSigners();

  try {
    // Simulate the integration flow:
    // 1. Database would create a record and return ID (simulated as 100)
    const dbId = 100;
    console.log(`📊 Database record created with ID: ${dbId}`);

    // 2. Create blockchain campaign with DB ID
    console.log("\n⛓️  Creating blockchain campaign with DB ID...");
    const tx = await factory.createCampaign(
      creator.address,
      "Integration Test Campaign",
      "Testing database integration",
      hre.ethers.parseEther("5"),
      30,
      dbId
    );
    
    const receipt = await tx.wait();
    console.log("✅ Transaction confirmed:", receipt.hash);

    // 3. Get campaign count and verify
    const campaignCount = await factory.getCampaignCount();
    const campaignId = Number(campaignCount) - 1;
    console.log(`\n📋 Campaign created with blockchain ID: ${campaignId}`);

    // 4. Retrieve campaign and verify DB ID is stored
    const campaign = await factory.getCampaign(campaignId);
    console.log("\n📥 Campaign Details:");
    console.log("  Title:", campaign[1]);
    console.log("  Description:", campaign[2]);
    console.log("  Creator:", campaign[8]);
    console.log("  Database ID:", Number(campaign[9]));

    if (Number(campaign[9]) === dbId) {
      console.log("\n✅ SUCCESS! Database ID correctly stored in blockchain!");
    } else {
      console.log("\n❌ ERROR! Database ID mismatch!");
    }

  } catch (error) {
    console.error("\n❌ Error:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
