const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  
  console.log("Creating sample campaigns with account:", deployer.address);

  // Get the deployed contract address
  const fs = require("fs");
  const deploymentPath = `./deployments/${hre.network.name}.json`;
  
  if (!fs.existsSync(deploymentPath)) {
    console.error("Contract not deployed yet. Run deployment script first.");
    process.exit(1);
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  const factoryAddress = deployment.address;

  const CharityCampaignFactory = await hre.ethers.getContractFactory("CharityCampaignFactory");
  const factory = CharityCampaignFactory.attach(factoryAddress);

  console.log("Connected to CharityCampaignFactory at:", factoryAddress);

  // Sample campaign 1: Clean Water Initiative
  console.log("\nCreating Campaign 1: Clean Water Initiative");
  const tx1 = await factory.createCampaign(
    deployer.address, // beneficiary
    "Clean Water for Rural Communities",
    "Help us bring clean drinking water to 1,000 families in rural areas. Funds will be used to build wells and water purification systems.",
    hre.ethers.parseEther("10"), // 10 ETH goal
    30 // 30 days
  );
  await tx1.wait();
  console.log("Campaign 1 created!");

  // Sample campaign 2: Education Fund
  console.log("\nCreating Campaign 2: Education Fund");
  const tx2 = await factory.createCampaign(
    deployer.address,
    "School Supplies for Underprivileged Children",
    "Provide books, uniforms, and learning materials to 500 children from low-income families.",
    hre.ethers.parseEther("5"), // 5 ETH goal
    45 // 45 days
  );
  await tx2.wait();
  console.log("Campaign 2 created!");

  // Sample campaign 3: Medical Aid
  console.log("\nCreating Campaign 3: Medical Aid");
  const tx3 = await factory.createCampaign(
    deployer.address,
    "Emergency Medical Fund",
    "Support free medical camps and emergency treatments for those who cannot afford healthcare.",
    hre.ethers.parseEther("15"), // 15 ETH goal
    60 // 60 days
  );
  await tx3.wait();
  console.log("Campaign 3 created!");

  // Get campaign count
  const count = await factory.getCampaignCount();
  console.log(`\nTotal campaigns created: ${count}`);

  // Display campaign details
  for (let i = 0; i < count; i++) {
    const campaign = await factory.getCampaign(i);
    console.log(`\nCampaign ${i}:`);
    console.log(`  Title: ${campaign.title}`);
    console.log(`  Goal: ${hre.ethers.formatEther(campaign.goalAmount)} ETH`);
    console.log(`  Deadline: ${new Date(Number(campaign.deadline) * 1000).toLocaleDateString()}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
