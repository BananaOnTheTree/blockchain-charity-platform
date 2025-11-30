const hre = require('hardhat');
const fs = require('fs');
const path = require('path');

async function main() {
  // Determine address: CLI arg > ENV > deployments/localhost.json
  const deploymentsPath = path.join(__dirname, '..', 'deployments', 'localhost.json');
  let defaultAddress = undefined;
  if (fs.existsSync(deploymentsPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(deploymentsPath, 'utf8'));
      defaultAddress = data.address;
    } catch (e) {
      // ignore parse errors
    }
  }

  const addr = process.argv[2] || process.env.CONTRACT_ADDRESS || defaultAddress;
  if (!addr) {
    console.error('No contract address provided. Pass it as the first argument, set CONTRACT_ADDRESS env var, or add deployments/localhost.json');
    process.exit(2);
  }

  const { ethers } = hre;
  const provider = ethers.provider; // uses network from --network flag or default

  console.log('Checking contract bytecode at', addr);
  const network = await provider.getNetwork();
  console.log('Connected network chainId:', network.chainId.toString());

  try {
    const code = await provider.getCode(addr);
    console.log('Raw bytecode (first 66 chars):', code ? code.slice(0, 66) : code);
    if (!code || code === '0x' || code === '0x0') {
      console.log(`No contract deployed at ${addr} on the connected network.`);
      process.exitCode = 1;
    } else {
      console.log(`Contract FOUND at ${addr} on the connected network.`);
      process.exitCode = 0;
    }
  } catch (err) {
    console.error('Error while fetching contract code:', err.message || err);
    process.exitCode = 3;
  }
}

main().catch((err) => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
