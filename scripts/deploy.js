const hre = require("hardhat");

async function main() {
  console.log("Deploying CharityCampaignFactory...");

  const CharityCampaignFactory = await hre.ethers.getContractFactory("CharityCampaignFactory");
  const factory = await CharityCampaignFactory.deploy();

  await factory.waitForDeployment();

  const address = await factory.getAddress();
  console.log(`CharityCampaignFactory deployed to: ${address}`);

  // Save deployment info
  const fs = require("fs");
  const deploymentInfo = {
    network: hre.network.name,
    address: address,
    deployedAt: new Date().toISOString(),
  };

  const deploymentsDir = "./deployments";
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }

  fs.writeFileSync(
    `${deploymentsDir}/${hre.network.name}.json`,
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log(`Deployment info saved to ${deploymentsDir}/${hre.network.name}.json`);

  // Wait for block confirmations before verification
  if (hre.network.name !== "localhost" && hre.network.name !== "hardhat") {
    console.log("Waiting for block confirmations...");
    await factory.deploymentTransaction().wait(6);

    console.log("Verifying contract on Etherscan...");
    try {
      await hre.run("verify:verify", {
        address: address,
        constructorArguments: [],
      });
      console.log("Contract verified successfully");
    } catch (error) {
      console.log("Verification failed:", error.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
