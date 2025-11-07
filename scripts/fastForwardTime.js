const { ethers, network } = require("hardhat");

async function main() {
  // Get the number of days to fast forward (default 31 days)
  const daysToAdd = process.env.DAYS ? parseInt(process.env.DAYS) : 31;
  const secondsToAdd = daysToAdd * 24 * 60 * 60;

  console.log(`⏰ Fast-forwarding time by ${daysToAdd} days (${secondsToAdd} seconds)...`);
  
  // Increase time
  await network.provider.send("evm_increaseTime", [secondsToAdd]);
  
  // Mine a new block to apply the time change
  await network.provider.send("evm_mine");
  
  // Get current block timestamp to verify
  const blockNumber = await ethers.provider.getBlockNumber();
  const block = await ethers.provider.getBlock(blockNumber);
  const currentTime = block.timestamp;
  const date = new Date(currentTime * 1000);
  
  console.log("✅ Time fast-forwarded successfully!");
  console.log(`📅 Current blockchain time: ${date.toLocaleString()}`);
  console.log(`🔢 Current block number: ${blockNumber}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
