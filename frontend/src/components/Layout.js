import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Layout = ({ account, loading, networkError, children }) => {
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>🌟 Charity Campaign Platform</h1>
        <p>Connected Account: {account ? `${account.substring(0, 6)}...${account.substring(38)}` : 'Not Connected'}</p>
      </header>

      <nav className="navigation">
        <Link to="/">
          <button className={isActive('/') && location.pathname === '/' ? 'nav-btn active' : 'nav-btn'}>
            🏠 Home
          </button>
        </Link>
        <Link to="/browse">
          <button className={isActive('/browse') ? 'nav-btn active' : 'nav-btn'}>
            🔍 Browse Campaigns
          </button>
        </Link>
        <Link to="/create">
          <button className={isActive('/create') ? 'nav-btn active' : 'nav-btn'}>
            ➕ Create Campaign
          </button>
        </Link>
        <Link to="/my-campaigns">
          <button className={isActive('/my-campaigns') ? 'nav-btn active' : 'nav-btn'}>
            📋 My Campaigns
          </button>
        </Link>
      </nav>

      {loading && <div className="loading">Processing transaction...</div>}
      
      {networkError && (
        <div className="network-error">
          {networkError}
          <p style={{marginTop: '10px', fontSize: '14px'}}>
            To switch: Click MetaMask → Network dropdown → Select "Localhost 8545"
          </p>
        </div>
      )}

      <div className="container">
        {children}
      </div>

      <footer className="about-footer">
        <section className="about-section">
          <div className="divider-icon">✨</div>
          <h2>About Charity Campaign Platform</h2>
          <div className="about-content">
            <div className="about-card">
              <h3>🎯 Our Mission</h3>
              <p>
                We provide a transparent, decentralized platform for charity fundraising
                powered by blockchain technology. Every donation is traceable, secure, and
                verifiable on the Ethereum blockchain.
              </p>
            </div>
            
            <div className="about-card">
              <h3>🔒 How It Works</h3>
              <ul>
                <li><strong>Create:</strong> Set up a campaign with a goal and deadline</li>
                <li><strong>Donate:</strong> Contributors send ETH directly to the campaign</li>
                <li><strong>Finalize:</strong> If goal is met, funds go to beneficiary</li>
                <li><strong>Refund:</strong> If goal isn't met, donors get their money back</li>
              </ul>
            </div>

            <div className="about-card">
              <h3>✨ Key Features</h3>
              <ul>
                <li>100% transparent - all transactions on-chain</li>
                <li>No intermediaries - direct peer-to-peer transfers</li>
                <li>Automatic refunds for unsuccessful campaigns</li>
                <li>Built with audited OpenZeppelin smart contracts</li>
              </ul>
            </div>

            <div className="about-card">
              <h3>🛠️ Technology Stack</h3>
              <p>
                <strong>Smart Contracts:</strong> Solidity 0.8.20 with OpenZeppelin libraries<br/>
                <strong>Frontend:</strong> React with Ethers.js v6<br/>
                <strong>Network:</strong> Ethereum (Local Hardhat / Sepolia Testnet)<br/>
                <strong>Wallet:</strong> MetaMask integration
              </p>
            </div>
          </div>
        </section>
      </footer>
    </div>
  );
};

export default Layout;
