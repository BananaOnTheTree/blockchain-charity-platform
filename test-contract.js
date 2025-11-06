const { ethers } = require('ethers');
const fs = require('fs');

async function testContract() {
  try {
    // Read the ABI
    const abi = JSON.parse(fs.readFileSync('./artifacts/contracts/CharityCampaignFactory.sol/CharityCampaignFactory.json', 'utf8')).abi;
    
    // Connect to Hardhat node
    const provider = new ethers.JsonRpcProvider('http://localhost:8545');
    const contractAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
    
    const contract = new ethers.Contract(contractAddress, abi, provider);
    
    console.log('Testing contract at:', contractAddress);
    console.log('Contract connected:', !!contract);
    
    // Try to get campaign count
    const count = await contract.getCampaignCount();
    console.log('Campaign count:', count.toString());
    
    // Try to get a campaign if any exist
    if (count > 0) {
      const campaign = await contract.getCampaign(0);
      console.log('Campaign 0:', {
        beneficiary: campaign[0],
        title: campaign[1],
        description: campaign[2],
        goalAmount: ethers.formatEther(campaign[3]),
        deadline: new Date(Number(campaign[4]) * 1000),
        totalRaised: ethers.formatEther(campaign[5]),
        finalized: campaign[6],
        refundEnabled: campaign[7],
        creator: campaign[8]
      });
    }
    
  } catch (error) {
    console.error('Error testing contract:', error);
  }
}

testContract();
