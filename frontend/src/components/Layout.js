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
          <button className={isActive('/') && !location.pathname.includes('campaign') ? 'nav-btn active' : 'nav-btn'}>
            🏠 Browse Campaigns
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
        <Link to="/about">
          <button className={isActive('/about') ? 'nav-btn active' : 'nav-btn'}>
            ℹ️ About
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
    </div>
  );
};

export default Layout;
