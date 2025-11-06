const { ethers, network } = require("hardhat");

async function main() {
  const campaignId = process.argv[2] || 0;
  const daysToSkip = process.argv[3] || 1;
  
  const secondsToSkip = daysToSkip * 24 * 60 * 60;
  
  console.log(`Fast-forwarding time by ${daysToSkip} day(s)...`);
  
  await network.provider.send("evm_increaseTime", [secondsToSkip]);
  await network.provider.send("evm_mine");
  
  console.log(`✅ Time advanced by ${daysToSkip} day(s)`);
  console.log(`Now you can finalize campaign #${campaignId}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
