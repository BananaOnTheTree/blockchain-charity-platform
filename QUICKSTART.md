# Quick Start Guide - Blockchain Charity Platform

## 🚀 Get Started in 5 Minutes

### Step 1: Install Dependencies
```bash
npm install
cd frontend && npm install && cd ..
```

### Step 2: Compile Contracts
```bash
npm run compile
```
✅ All tests passed! 22/22 passing

### Step 3: Start Local Blockchain
**Open a new terminal (Terminal 1):**
```bash
npm run node
```
Leave this running - it's your local blockchain.

### Step 4: Deploy Contract
**Open another terminal (Terminal 2):**
```bash
npm run deploy:local
```

You'll see output like:
```
CharityCampaignFactory deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
```

**Copy this contract address!** You'll need it for the frontend.

### Step 5: Configure Frontend
```bash
# Copy the contract ABI to frontend
cp artifacts/contracts/CharityCampaignFactory.sol/CharityCampaignFactory.json frontend/src/

# Create frontend environment file
echo "REACT_APP_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3" > frontend/.env
```
⚠️ Replace `0x5FbDB2315678afecb367f032d93F642f64180aa3` with YOUR actual deployed contract address!

### Step 6: Start Frontend
**In Terminal 2:**
```bash
cd frontend
npm start
```

Your browser will open to `http://localhost:3000`

### Step 7: Connect MetaMask

1. **Install MetaMask** browser extension if you haven't already
2. **Add Local Network** to MetaMask:
   - Network Name: `Localhost 8545`
   - RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `31337`
   - Currency Symbol: `ETH`

3. **Import a Test Account**:
   - In your Terminal 1 (where Hardhat node is running), you'll see test accounts with private keys
   - Copy a private key (e.g., `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`)
   - In MetaMask: Click account icon → Import Account → Paste private key

4. **Refresh the page** and click "Connect" when MetaMask prompts you

### Step 8: Test the Platform

**Create a Campaign:**
1. Fill in the "Create New Campaign" form:
   - Beneficiary: Your account address (or another test account)
   - Title: "Test Clean Water Initiative"
   - Description: "Helping communities get clean water"
   - Goal: `1` (1 ETH)
   - Duration: `30` (days)
2. Click "Create Campaign" and confirm in MetaMask

**Make a Donation:**
1. Find your campaign in the list
2. Click "Donate"
3. Enter amount (e.g., `0.5` ETH)
4. Confirm transaction in MetaMask

**View Progress:**
- Watch the progress bar fill up
- See your contribution amount
- Track total raised vs goal

---

## 🎯 Optional: Add Sample Campaigns

Want to see multiple campaigns? Run:
```bash
npx hardhat run scripts/createSampleCampaigns.js --network localhost
```

This creates 3 pre-populated campaigns with different goals and deadlines.

---

## 🧪 Run Tests Anytime

```bash
npm test
```

All 22 tests should pass ✅

---

## 🌐 Deploy to Sepolia Testnet (Optional)

1. **Get Sepolia ETH**:
   - Get free test ETH from: https://sepoliafaucet.com/

2. **Configure .env**:
```bash
cp .env.example .env
# Edit .env and add:
# - Your wallet's PRIVATE_KEY
# - SEPOLIA_RPC_URL (from Alchemy or Infura)
# - ETHERSCAN_API_KEY (optional, for verification)
```

3. **Deploy**:
```bash
npm run deploy:sepolia
```

4. **Update frontend**:
```bash
# Get contract address from deployment output
echo "REACT_APP_CONTRACT_ADDRESS=<SEPOLIA_CONTRACT_ADDRESS>" > frontend/.env
```

---

## 🆘 Troubleshooting

**"Cannot find module" errors?**
```bash
npm install
cd frontend && npm install
```

**MetaMask transactions failing?**
- Make sure you're connected to "Localhost 8545" network
- Check you have ETH in your test account
- Restart Hardhat node and redeploy

**Frontend showing "YOUR_CONTRACT_ADDRESS"?**
- You forgot to set `REACT_APP_CONTRACT_ADDRESS` in `frontend/.env`
- Make sure you copied the deployed address correctly

**Contract ABI errors?**
```bash
npm run compile
cp artifacts/contracts/CharityCampaignFactory.sol/CharityCampaignFactory.json frontend/src/
```

---

## 📚 Next Steps

- Read the full [README.md](README.md) for detailed documentation
- Check [.github/copilot-instructions.md](.github/copilot-instructions.md) for development guidelines
- Explore the smart contract in `contracts/CharityCampaignFactory.sol`
- Customize the frontend in `frontend/src/App.js`

---

**Happy Building! 🎉**
