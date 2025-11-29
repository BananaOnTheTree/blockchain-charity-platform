import React from 'react';

const About = () => {
  return (
    <section className="about-section">
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
  );
};

export default About;
