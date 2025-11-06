# Blockchain Charity Campaign Platform

A decentralized charity fundraising platform built on Ethereum. Create campaigns, accept donations, and automatically distribute funds or issue refunds based on campaign success.

## 🌟 Features

- **Create Campaigns** with funding goals and deadlines
- **Transparent Donations** recorded on blockchain
- **Automatic Refunds** if campaign fails to reach goal
- **MetaMask Integration** for easy wallet connection
- **Modern UI** with animations and real-time progress tracking

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
cd frontend && npm install && cd ..
```

### 2. Compile & Test

```bash
npm run compile
npm test
```

### 3. Start Local Blockchain & Deploy

```bash
# Terminal 1: Start Hardhat node
npm run node

# Terminal 2: Deploy contract
npm run deploy:local
# Copy the contract address from output
```

### 4. Configure & Start Frontend

```bash
# Set contract address
echo "REACT_APP_CONTRACT_ADDRESS=<CONTRACT_ADDRESS>" > frontend/.env

# Copy contract ABI
cp artifacts/contracts/CharityCampaignFactory.sol/CharityCampaignFactory.json frontend/src/

# Start frontend
cd frontend && npm start
```

### 5. Connect MetaMask

- Open http://localhost:3000
- Connect MetaMask to "Localhost 8545" network
- Import a test account from Hardhat node output

## 📁 Project Structure

```
├── contracts/CharityCampaignFactory.sol    # Main smart contract
├── test/CharityCampaignFactory.test.js     # Test suite (22 tests)
├── scripts/deploy.js                        # Deployment script
├── frontend/src/App.js                      # React UI
└── hardhat.config.js                        # Hardhat config
```

## 🔧 Key Scripts

```bash
npm run compile        # Compile contracts
npm test              # Run tests
npm run node          # Start local blockchain
npm run deploy:local  # Deploy to localhost
```

## 💡 How It Works

1. **Create Campaign**: Set beneficiary, goal (ETH), and duration (days)
2. **Donate**: Anyone can donate ETH to active campaigns
3. **Finalize**: After deadline, creator finalizes campaign
   - ✅ Goal reached → Funds sent to beneficiary
   - ❌ Goal not reached → Refunds enabled
4. **Claim Refund**: Donors get full refund if campaign failed

## � Security

- OpenZeppelin ReentrancyGuard for safe transfers
- Access control for campaign finalization
- Comprehensive input validation

## ⚠️ Note

This is a **local development project**. All data is stored on your local Hardhat blockchain and will reset when you restart the node.

## 📚 Resources

- [Hardhat Docs](https://hardhat.org/docs)
- [Ethers.js Docs](https://docs.ethers.org/)
- [OpenZeppelin](https://docs.openzeppelin.com/contracts/)

