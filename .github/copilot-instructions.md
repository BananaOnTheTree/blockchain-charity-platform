# Copilot Instructions — Blockchain Charity Platform

## Project Overview
This is a decentralized charity fundraising platform on Ethereum (local development only). Campaign creators set goals and deadlines; donors contribute ETH. If the goal is reached, funds transfer to the beneficiary. If not, donors can claim refunds.

## Architecture

### Smart Contract Layer (`contracts/`)
- **CharityCampaignFactory.sol**: Single factory contract managing all campaigns
  - Uses OpenZeppelin's `Ownable` and `ReentrancyGuard`
  - Campaign struct stores: beneficiary, title, description, goal, deadline, totalRaised, finalized status, refund flag
  - Key functions: `createCampaign`, `donate` (payable), `finalizeCampaign`, `claimRefund`
  - Events: `CampaignCreated`, `DonationReceived`, `CampaignFinalized`, `RefundIssued`

### Frontend (`frontend/`)
- React app with ethers.js v6
- MetaMask integration via `BrowserProvider`
- Contract ABI imported from `CharityCampaignFactory.json` (copied from `artifacts/` after compile)
- Environment variable: `REACT_APP_CONTRACT_ADDRESS` for deployed contract address

### Deployment Info (`deployments/`)
- Auto-generated JSON files per network (e.g., `localhost.json`)
- Contains: contract address, network name, deployment timestamp

## Developer Workflows

### Setup
```bash
npm install                    # Install Hardhat, OpenZeppelin, testing tools
cd frontend && npm install     # Install React, ethers.js
```

### Smart Contract Development
```bash
npm run compile                # Compile contracts → artifacts/
npm test                       # Run comprehensive test suite (Chai + Hardhat helpers)
npm run node                   # Start local Hardhat node (localhost:8545)
npm run deploy:local           # Deploy to local node
```

### Frontend Development
```bash
# After deploying contract:
# 1. Copy contract address to frontend/.env as REACT_APP_CONTRACT_ADDRESS
# 2. Copy ABI: cp artifacts/contracts/CharityCampaignFactory.sol/CharityCampaignFactory.json frontend/src/
cd frontend
npm start                      # Start React dev server on :3000
```

### Testing Strategy
- All contract functions tested in `test/CharityCampaignFactory.test.js`
- Uses `@nomicfoundation/hardhat-network-helpers` for time manipulation
- Coverage: creation validation, donations, finalization (success/fail), refunds, access control

## Project-Specific Conventions

### Environment Variables
- **Frontend `.env`**: `REACT_APP_CONTRACT_ADDRESS`
- Never commit `.env` — use `.env.example` template (frontend only)

### File Naming
- Solidity: PascalCase (e.g., `CharityCampaignFactory.sol`)
- Scripts: camelCase (e.g., `deploy.js`, `createSampleCampaigns.js`)
- Tests: match contract name + `.test.js`

### Gas Optimization
- Contract uses `memory` for function parameters and return values
- Struct packing: booleans and addresses grouped where possible
- `external` vs `public`: prefer `external` for user-facing functions

### Security Patterns
- **ReentrancyGuard** on `donate`, `finalizeCampaign`, `claimRefund`
- **Access control**: Only creator or owner can finalize campaigns
- **Safe transfers**: Use `.call{value: amount}("")` with success checks
- **State changes before external calls**: Update mappings/storage before transfers

## Integration Points

### External Dependencies
- **OpenZeppelin Contracts v5.0.0**: `@openzeppelin/contracts`
- **Hardhat Toolbox v4**: Includes ethers, chai, network helpers, gas reporter
- **Ethers.js v6**: Frontend uses `BrowserProvider` (not legacy `Web3Provider`)

### Network Configuration (`hardhat.config.js`)
- Localhost: `http://127.0.0.1:8545` (Chain ID: 31337)
- No testnet configuration (local development only)

### Frontend-Contract Integration
- ABI must be manually copied after compilation
- Contract address set via environment variable
- MetaMask required for wallet connection
- Uses `call{value}` for donations (no `send` or `transfer`)

## Common Tasks for AI Agents

### Adding a New Campaign Field
1. Update `Campaign` struct in contract
2. Modify `createCampaign` function to accept new parameter
3. Update `getCampaign` return values
4. Add tests for new field validation
5. Update frontend form and display components
6. Recompile and copy new ABI to frontend

### Changing Deployment Flow
1. Edit `scripts/deploy.js` — deployment happens in `main()` function
2. Contract address saved to `deployments/localhost.json` automatically
3. Update frontend `.env` with new address

### Adding New Functions
1. Write function in contract with proper modifiers (`campaignExists`, `nonReentrant`, etc.)
2. Emit relevant events
3. Write tests covering happy path and edge cases
4. Recompile and update ABI in frontend
5. Add UI interactions in `App.js`

## Key Files Reference

- **`contracts/CharityCampaignFactory.sol`**: All campaign logic
- **`hardhat.config.js`**: Network settings, compiler version (0.8.20)
- **`scripts/deploy.js`**: Deployment + saves address to JSON
- **`test/CharityCampaignFactory.test.js`**: Full test suite (22 tests)
- **`frontend/src/App.js`**: React UI with Web3 integration (navigation menu)
- **`frontend/src/App.css`**: Modern styling with animations
- **`README.md`**: User-facing documentation and setup guide

## Anti-Patterns to Avoid

- Don't use `transfer()` or `send()` for ETH transfers (use `call` with gas forwarding)
- Don't modify state after external calls (reentrancy risk)
- Don't forget to update deployment address in frontend after redeployment
- Don't commit frontend/.env to git
- Don't skip copying ABI to frontend after contract changes

## Quick Reference Commands

```bash
# Full local development cycle
npm install && cd frontend && npm install && cd ..
npm run compile
npm test
npm run node                                      # Terminal 1
npm run deploy:local                              # Terminal 2 - copy address
cp artifacts/contracts/CharityCampaignFactory.sol/CharityCampaignFactory.json frontend/src/
echo "REACT_APP_CONTRACT_ADDRESS=<addr>" > frontend/.env
cd frontend && npm start                          # Terminal 3
```

For detailed setup and usage, see `README.md`.

