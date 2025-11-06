# Blockchain Charity Campaign Platform

A decentralized charity fundraising platform built on Ethereum that enables transparent, trustless crowdfunding for charitable causes.

## 🌟 Features

- **Create Campaigns**: Anyone can create a charity campaign with a funding goal and deadline
- **Transparent Donations**: All donations are recorded on the blockchain
- **Goal-Based Funding**: Campaigns must reach their goal by the deadline
- **Automatic Refunds**: Donors automatically get refunded if campaign fails to reach goal
- **MetaMask Integration**: Easy wallet connection for donations
- **Real-time Progress**: Track campaign progress in real-time

## 🏗️ Architecture

### Smart Contract (`CharityCampaignFactory.sol`)

The main contract manages all charity campaigns with the following features:

- **Campaign Creation**: Store campaign details (beneficiary, goal, deadline)
- **Donation Management**: Accept and track individual contributions
- **Finalization**: Automatically transfer funds to beneficiary if goal reached
- **Refund Mechanism**: Enable refunds if campaign fails
- **Security**: Uses OpenZeppelin's ReentrancyGuard and Ownable

### Frontend (React + Ethers.js)

- Modern React interface with Web3 integration
- Real-time campaign tracking
- MetaMask wallet connection
- Responsive design

## 📋 Prerequisites

- Node.js v16+ and npm
- MetaMask browser extension
- Git

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 2. Set Up Environment Variables

```bash
# Copy environment template
cp .env.example .env

# Edit .env and add your credentials:
# - PRIVATE_KEY: Your wallet private key (for deployment)
# - SEPOLIA_RPC_URL: Alchemy/Infura RPC endpoint
# - ETHERSCAN_API_KEY: For contract verification
```

### 3. Compile Smart Contracts

```bash
npm run compile
```

### 4. Run Tests

```bash
npm test
```

### 5. Deploy to Local Network

```bash
# Terminal 1: Start local Hardhat node
npm run node

# Terminal 2: Deploy contract
npm run deploy:local

# Terminal 3: Create sample campaigns (optional)
npx hardhat run scripts/createSampleCampaigns.js --network localhost
```

### 6. Configure Frontend

```bash
# Copy the deployed contract address from step 5
# Create frontend/.env file
cd frontend
echo "REACT_APP_CONTRACT_ADDRESS=<YOUR_CONTRACT_ADDRESS>" > .env

# Copy ABI to frontend
cp ../artifacts/contracts/CharityCampaignFactory.sol/CharityCampaignFactory.json src/
```

### 7. Start Frontend

```bash
cd frontend
npm start
```

Visit `http://localhost:3000` and connect your MetaMask wallet!

## 🌐 Deploy to Testnet (Sepolia)

```bash
# Make sure .env is configured with Sepolia RPC URL and private key
npm run deploy:sepolia
```

## 📁 Project Structure

```
BlockChainProject/
├── contracts/
│   └── CharityCampaignFactory.sol    # Main smart contract
├── scripts/
│   ├── deploy.js                      # Deployment script
│   └── createSampleCampaigns.js       # Sample data script
├── test/
│   └── CharityCampaignFactory.test.js # Contract tests
├── frontend/
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── App.js                     # Main React component
│       ├── App.css                    # Styles
│       ├── index.js                   # React entry point
│       └── CharityCampaignFactory.json # Contract ABI
├── deployments/                       # Deployment addresses (auto-generated)
├── artifacts/                         # Compiled contracts (auto-generated)
├── cache/                             # Hardhat cache (auto-generated)
├── hardhat.config.js                  # Hardhat configuration
├── package.json                       # Backend dependencies
└── .env                               # Environment variables (create from .env.example)
```

## 🔧 Available Scripts

### Backend
- `npm run compile` - Compile smart contracts
- `npm test` - Run contract tests
- `npm run node` - Start local Hardhat node
- `npm run deploy:local` - Deploy to local network
- `npm run deploy:sepolia` - Deploy to Sepolia testnet

### Frontend
- `cd frontend && npm start` - Start React development server
- `cd frontend && npm run build` - Build for production

## 📝 Smart Contract Functions

### For Campaign Creators

- `createCampaign(beneficiary, title, description, goalAmount, durationDays)` - Create a new campaign
- `finalizeCampaign(campaignId)` - Finalize campaign after deadline (transfers funds or enables refunds)

### For Donors

- `donate(campaignId)` - Donate to a campaign (payable)
- `claimRefund(campaignId)` - Claim refund if campaign failed

### View Functions

- `getCampaign(campaignId)` - Get campaign details
- `getCampaignCount()` - Get total number of campaigns
- `getContribution(campaignId, donor)` - Get donor's contribution amount
- `getUserCampaigns(creator)` - Get all campaigns created by an address

## 🔒 Security Features

- **ReentrancyGuard**: Prevents reentrancy attacks on donations and refunds
- **Access Control**: Only campaign creator or contract owner can finalize campaigns
- **Input Validation**: Comprehensive checks on all parameters
- **Safe Transfers**: Uses call() with proper error handling for ETH transfers

## 🧪 Testing

The test suite covers:
- Campaign creation with various parameters
- Donation flows and edge cases
- Campaign finalization (success and failure scenarios)
- Refund mechanisms
- Access control and authorization
- Time-based constraints (deadlines)

Run tests with coverage:
```bash
npx hardhat coverage
```

## 🎯 Usage Example

1. **Create a Campaign**
   - Fill in beneficiary address, title, description, goal (in ETH), and duration
   - Click "Create Campaign"

2. **Donate to a Campaign**
   - Browse active campaigns
   - Click "Donate" and enter amount in ETH
   - Confirm MetaMask transaction

3. **Finalize Campaign**
   - After deadline passes, creator clicks "Finalize Campaign"
   - If goal reached: funds automatically transfer to beneficiary
   - If goal not reached: refunds become available

4. **Claim Refund**
   - If campaign failed, donors can click "Claim Refund"
   - Receives full contribution back

## 🛣️ Roadmap

- [ ] Add campaign categories and tags
- [ ] Implement milestone-based funding
- [ ] Add image/media uploads (IPFS integration)
- [ ] Campaign updates and announcements
- [ ] Donation tiers with rewards
- [ ] Multi-token support (ERC20 donations)
- [ ] DAO governance for dispute resolution

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - feel free to use this project for learning or building your own charity platform!

## ⚠️ Disclaimer

This is educational software. Always audit smart contracts before deploying to mainnet with real funds.

## 🆘 Troubleshooting

**MetaMask not connecting?**
- Make sure MetaMask is installed and unlocked
- Check that you're on the correct network (localhost:8545 for local testing)

**Contract address not found?**
- Make sure you've deployed the contract first
- Check that frontend/.env has the correct CONTRACT_ADDRESS

**Transactions failing?**
- Ensure you have enough ETH for gas fees
- Check that campaign deadline hasn't passed (for donations)
- Verify you're calling functions with correct permissions

**ABI errors?**
- Make sure you've copied the latest ABI from artifacts/ to frontend/src/

## 📚 Learn More

- [Hardhat Documentation](https://hardhat.org/docs)
- [Ethers.js Documentation](https://docs.ethers.org/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [React Documentation](https://react.dev/)
