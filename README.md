# Blockchain Charity Campaign Platform

A decentralized charity fundraising platform built on Ethereum. Create campaigns, accept donations, and automatically distribute funds or issue refunds based on campaign success.

## 🌟 Features

- **Create Campaigns** with funding goals and deadlines
- **Transparent Donations** recorded on blockchain
- **Automatic Refunds** if campaign fails to reach goal
- **MetaMask Integration** for easy wallet connection
- **Modern UI** with animations and real-time progress tracking

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- MetaMask browser extension
- Git

### Step-by-Step Setup

#### 1. Install Dependencies

```bash
# Install root dependencies (Hardhat, OpenZeppelin)
npm install

# Install frontend dependencies (React, ethers.js)
cd frontend && npm install && cd ..

# Install backend dependencies (Express, Sequelize, PostgreSQL)
cd backend && npm install && cd ..
```

#### 2. Setup PostgreSQL Database

**Option A: Using PostgreSQL CLI**

```bash
# Login to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE charity_platform;

# Exit PostgreSQL
\q
```

**Option B: Using pgAdmin**

1. Open pgAdmin
2. Right-click on "Databases" → Create → Database
3. Name: `charity_platform`
4. Click "Save"

**Configure Backend Environment**

```bash
# Create .env file in backend directory
cd backend
cp .env.example .env

# Edit .env file with your database credentials
# Example:
# DB_USER=postgres
# DB_PASSWORD=your_password
# DB_NAME=charity_platform
# DB_HOST=localhost
# DB_PORT=5432
```

The database tables will be created automatically when you start the backend server (using Sequelize auto-sync).

#### 3. Compile Smart Contract

```bash
npm run compile
```

This compiles the `CharityCampaignFactory.sol` contract and generates artifacts in the `artifacts/` directory.

#### 3. Start Local Hardhat Blockchain

**Terminal 1:**
```bash
npm run node
```

This starts a local Ethereum network at `http://localhost:8545` with 20 pre-funded test accounts. **Keep this terminal running.**

#### 4. Deploy Smart Contract

**Terminal 2:**
```bash
npm run deploy:local
```

The deployment script will:
- Deploy the contract to localhost
- Save the contract address to `deployments/localhost.json`
- Display the deployed contract address

**Copy the contract address from the output** (e.g., `0x5FbDB2315678afecb367f032d93F642f64180aa3`)

#### 5. Configure Frontend Environment

```bash
# Create .env file in frontend directory
echo "REACT_APP_CONTRACT_ADDRESS=<PASTE_CONTRACT_ADDRESS_HERE>" > frontend/.env
echo "REACT_APP_BACKEND_URL=http://localhost:3001" >> frontend/.env

# Copy contract ABI to frontend
cp artifacts/contracts/CharityCampaignFactory.sol/CharityCampaignFactory.json frontend/src/
```

#### 6. Start Backend Server

**Terminal 3:**
```bash
cd backend
npm start
```

The backend server will start at `http://localhost:3001` and handle:
- Campaign metadata (images, categories, locations)
- Image uploads
- Campaign updates

**Keep this terminal running.**

#### 7. Start Frontend Application

**Terminal 4:**
```bash
cd frontend
npm start
```

The React app will open at `http://localhost:3000`.

#### 8. Configure MetaMask

1. Open MetaMask extension in your browser
2. Click network dropdown → **Add Network** → **Add Network Manually**
3. Enter the following:
   - **Network Name**: Hardhat Local
   - **RPC URL**: `http://127.0.0.1:8545`
   - **Chain ID**: `31337`
   - **Currency Symbol**: ETH
4. Click **Save**
5. Import a test account:
   - Copy a private key from Terminal 1 (Hardhat node output)
   - MetaMask → Account menu → **Import Account** → Paste private key
   - **Note**: Account #0 is typically used for deployment

#### 9. Start Using the Platform!

- Browse campaigns at `http://localhost:3000`
- Create new campaigns with goals and deadlines
- Donate to campaigns using MetaMask
- View leaderboards of top donors
- Finalize campaigns after deadlines

### 📝 Optional: Create Sample Campaigns

```bash
# Run script to create test campaigns with donations
npx hardhat run scripts/createCampaignsWithDonations.js --network localhost
```

This creates a sample campaign with 6 donors for testing the leaderboard feature.

## 🔄 Development Workflow

### Making Changes to Smart Contract

1. Edit `contracts/CharityCampaignFactory.sol`
2. Recompile: `npm run compile`
3. **Restart Hardhat node** (Terminal 1)
4. Redeploy: `npm run deploy:local` (Terminal 2)
5. Update contract address in `frontend/.env`
6. Copy new ABI to frontend:
   ```bash
   cp artifacts/contracts/CharityCampaignFactory.sol/CharityCampaignFactory.json frontend/src/
   ```
7. Restart frontend (Terminal 4)

### Making Changes to Frontend

- Frontend auto-reloads on file changes
- No need to restart unless changing `.env` file

### Making Changes to Backend

- Restart backend server after changes:
  ```bash
  # In Terminal 3
  Ctrl+C
  npm start
  ```

### Database Migrations

The backend uses Sequelize ORM with auto-sync enabled. Tables are created/updated automatically when the server starts.

**Database Models:**
- `CampaignMetadata`: Stores campaign images, categories, locations, descriptions
- `UserProfile`: Stores user profiles and avatars (optional feature)

**Reset Database (if needed):**
```bash
# Drop and recreate database
psql -U postgres
DROP DATABASE charity_platform;
CREATE DATABASE charity_platform;
\q

# Restart backend to recreate tables
cd backend && npm start
```



## 💡 How It Works

### Campaign Lifecycle

1. **Create Campaign**
   - Set beneficiary address (who receives funds)
   - Define goal amount in ETH
   - Set duration in days (1-365 days)
   - Add optional metadata: category, location, description, images

2. **Donate to Campaign**
   - Anyone can donate ETH while campaign is active
   - Donations tracked on blockchain
   - Real-time progress updates
   - Leaderboard shows top donors

3. **Campaign Ends**
   - After deadline passes, campaign creator can finalize
   - Two outcomes:
     - ✅ **Goal Reached**: Funds automatically sent to beneficiary
     - ❌ **Goal Not Reached**: Refunds enabled for all donors

4. **Claim Refunds** (if goal not reached)
   - Donors can claim full refund of their contributions
   - Refunds processed immediately via smart contract

### Key Features

- 🏆 **Donor Leaderboard**: See top contributors for each campaign
- 📊 **Real-time Progress**: Live funding progress with percentage
- 🖼️ **Image Galleries**: Support for campaign images and photo galleries
- 🔒 **Secure Transactions**: ReentrancyGuard protection on all transfers
- 📱 **Responsive Design**: Works on desktop and mobile browsers
- 🎨 **Modern UI**: Gradient cards, smooth animations, intuitive navigation

## 🔐 Security Features

- **OpenZeppelin ReentrancyGuard**: Prevents reentrancy attacks on donate/finalize/refund
- **Access Control**: Only campaign creator can finalize campaigns
- **Input Validation**: Comprehensive checks on all contract inputs
- **Safe Math**: Solidity 0.8+ overflow protection
- **Donor Tracking**: Maintains list of all campaign donors for leaderboard
- **State Validation**: Ensures campaigns can't be finalized twice or refunded incorrectly

## 🧪 Testing

Run the comprehensive test suite:

```bash
npm test
```

The test suite includes 22 tests covering:
- Campaign creation validation
- Donation functionality
- Campaign finalization (success and failure scenarios)
- Refund mechanisms
- Access control
- Edge cases and error handling

## ⚠️ Important Notes

### Local Development Only

This is a **local development project** designed for learning and testing:
- All blockchain data is stored on your local Hardhat network
- Data resets when you restart the Hardhat node
- Not configured for testnets or mainnet deployment
- Use only with test accounts (never use accounts with real funds)

### Common Issues & Solutions

**Issue**: "Wrong Network" error in MetaMask
- **Solution**: Ensure MetaMask is connected to "Hardhat Local" network (Chain ID: 31337)

**Issue**: Contract function errors after redeployment
- **Solution**: 
  1. Update contract address in `frontend/.env`
  2. Copy new ABI to frontend
  3. Refresh browser and clear MetaMask activity data

**Issue**: Backend server won't start - Database connection error
- **Solution**: 
  1. Ensure PostgreSQL is running: `sudo service postgresql status`
  2. Check database exists: `psql -U postgres -l | grep charity_platform`
  3. Verify credentials in `backend/.env`
  4. Test connection: `psql -U postgres -d charity_platform`

**Issue**: Backend images not loading
- **Solution**: Ensure backend server is running on port 3001 and `uploads/` folder exists

**Issue**: "SequelizeConnectionError" or "ECONNREFUSED"
- **Solution**: 
  1. Start PostgreSQL: `sudo service postgresql start` (Linux) or `brew services start postgresql` (Mac)
  2. Create database if missing (see Step 2 in setup)
  3. Check PostgreSQL is listening on port 5432

**Issue**: Transaction fails with "Invalid duration"
- **Solution**: Duration must be between 1-365 days

**Issue**: Cannot finalize campaign
- **Solution**: Only campaign creator can finalize, and deadline must have passed

## 🎯 Next Steps

After setting up the project, try:

1. **Create your first campaign** with a small goal (e.g., 1 ETH)
2. **Switch MetaMask accounts** and donate to your campaign
3. **View the leaderboard** to see donor rankings
4. **Add images** to your campaigns for better presentation
5. **Test refund functionality** by creating a campaign with unreachable goal
6. **Explore the code** to understand smart contract patterns

## 📚 Learn More

### Documentation
- [Hardhat Documentation](https://hardhat.org/docs)
- [Ethers.js v6 Documentation](https://docs.ethers.org/v6/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [React Documentation](https://react.dev/)
- [Solidity Documentation](https://docs.soliditylang.org/)

### Technologies Used
- **Smart Contract**: Solidity 0.8.20
- **Development Framework**: Hardhat
- **Frontend**: React 18.2.0, React Router v6
- **Web3 Library**: Ethers.js v6.9.0
- **Backend**: Express.js, SQLite3
- **Security**: OpenZeppelin Contracts v5.0.0
- **Styling**: Custom CSS with animations

## 🤝 Contributing

This is an educational project. Feel free to:
- Fork and experiment
- Add new features
- Improve the UI/UX
- Enhance security measures
- Add more tests

## 📄 License

MIT License - feel free to use this project for learning purposes.

