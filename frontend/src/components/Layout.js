import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ethers } from 'ethers';

const Layout = ({ account, loading, networkError, children }) => {
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const [balance, setBalance] = useState(null);
  const [logoError, setLogoError] = useState(false);
  const [logoLoaded, setLogoLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;
    const loadBalance = async () => {
      try {
        if (account && window.ethereum) {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const bal = await provider.getBalance(account);
          const eth = ethers.formatEther(bal);
          if (mounted) setBalance(Number(eth));
        } else {
          if (mounted) setBalance(null);
        }
      } catch (err) {
        console.error('Failed to fetch balance', err);
        if (mounted) setBalance(null);
      }
    };
    loadBalance();

    return () => { mounted = false; };
  }, [account]);

  const shortAddress = account ? `${account.substring(0,6)}...${account.substring(account.length - 4)}` : null;

  return (
    <div className="App">
      <header className="App-header">
        <div className="header-left">
          <div className="logo-wrapper" aria-hidden="true">
            {/* User-supplied logo: place your image at `frontend/public/logo.png` for automatic use.
                Fallback to inline SVG if the image isn't present or fails to load. */}
            {!logoError ? (
              <img
                src="/logo.png"
                alt="KindnessChain logo"
                className={`site-logo ${logoLoaded ? 'loaded' : ''}`}
                onLoad={() => setLogoLoaded(true)}
                onError={() => setLogoError(true)}
                style={{width: '66px', height: '56px', objectFit: 'cover', borderRadius: '12px'}}
              />
            ) : (
              <svg width="56" height="56" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="64" height="64" rx="12" fill="url(#g)" />
                <path d="M20 36c0-8 12-14 12-14s12 6 12 14c0 10-12 16-12 16s-12-6-12-16z" fill="#fff" opacity="0.95"/>
                <defs>
                  <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#11998e"/>
                    <stop offset="1" stopColor="#38ef7d"/>
                  </linearGradient>
                </defs>
              </svg>
            )}
          </div>
          <h1>KindnessChain</h1>
        </div>

        <div className="header-right">
          {account ? (
            <div className="wallet-card" title={account}>
              <div className="wallet-avatar" aria-hidden>
                {/* small gradient droplet as avatar */}
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C12 2 6 7 6 12a6 6 0 0012 0c0-5-6-10-6-10z" fill="url(#wg)"/>
                  <defs>
                    <linearGradient id="wg" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0" stopColor="#06beb6"/>
                      <stop offset="1" stopColor="#11998e"/>
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <div className="wallet-details">
                <div className="wallet-addr">{shortAddress}</div>
                <div className="wallet-balance">{balance !== null ? Number(balance).toFixed(4) : '—'} ETH</div>
              </div>
            </div>
          ) : (
            <div className="wallet-card empty">Not Connected</div>
          )}
        </div>
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
          <h2>About KindnessChain</h2>
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
