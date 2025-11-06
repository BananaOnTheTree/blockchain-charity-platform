import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import './App.css';
import { campaignAPI, userAPI } from './api';

// Import contract ABI (you'll need to copy this from artifacts after compilation)
import CharityCampaignFactoryABI from './CharityCampaignFactory.json';

// Update this with your deployed contract address
const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS || 'YOUR_CONTRACT_ADDRESS';

function App() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState('');
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [networkError, setNetworkError] = useState('');
  const [activeSection, setActiveSection] = useState('campaigns');

  // Form states
  const [newCampaign, setNewCampaign] = useState({
    beneficiary: '',
    title: '',
    description: '',
    goalAmount: '',
    durationDays: '',
    // Off-chain metadata
    category: '',
    location: '',
    detailedDescription: '',
    websiteUrl: '',
    imageFile: null
  });

  useEffect(() => {
    initializeProvider();
  }, []);

  useEffect(() => {
    if (contract) {
      loadCampaigns();
    }
  }, [contract]);

  const initializeProvider = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const web3Provider = new ethers.BrowserProvider(window.ethereum);
        setProvider(web3Provider);

        // Check network
        const network = await web3Provider.getNetwork();
        const chainId = Number(network.chainId);
        
        // Check if we're on localhost (chainId 31337)
        if (chainId !== 31337) {
          setNetworkError(`⚠️ Wrong Network! You're on chain ID ${chainId}. Please switch MetaMask to "Localhost 8545" (Chain ID: 31337)`);
          alert(`WRONG NETWORK!\n\nYou're connected to chain ID: ${chainId}\nYou need to be on: Localhost 8545 (Chain ID: 31337)\n\nPlease switch networks in MetaMask!`);
          return;
        } else {
          setNetworkError('');
        }

        const accounts = await window.ethereum.request({ 
          method: 'eth_requestAccounts' 
        });
        setAccount(accounts[0]);

        const web3Signer = await web3Provider.getSigner();
        setSigner(web3Signer);

        const campaignContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          CharityCampaignFactoryABI.abi,
          web3Signer
        );
        setContract(campaignContract);

        // Listen for account changes
        window.ethereum.on('accountsChanged', (accounts) => {
          setAccount(accounts[0]);
          window.location.reload();
        });

        // Listen for network changes
        window.ethereum.on('chainChanged', (chainId) => {
          window.location.reload();
        });

      } catch (error) {
        console.error('Error connecting to MetaMask:', error);
        alert('Please install MetaMask!');
      }
    } else {
      alert('Please install MetaMask!');
    }
  };

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const count = await contract.getCampaignCount();
      const campaignList = [];

      // Fetch all metadata from backend
      const allMetadata = await campaignAPI.getAllMetadata();
      const metadataMap = {};
      allMetadata.forEach(meta => {
        metadataMap[meta.campaignId] = meta;
      });

      for (let i = 0; i < count; i++) {
        const campaign = await contract.getCampaign(i);
        const contribution = await contract.getContribution(i, account);
        const metadata = metadataMap[i] || {};
        
        campaignList.push({
          id: i,
          beneficiary: campaign[0],
          title: campaign[1],
          description: campaign[2],
          goalAmount: ethers.formatEther(campaign[3]),
          deadline: new Date(Number(campaign[4]) * 1000),
          totalRaised: ethers.formatEther(campaign[5]),
          finalized: campaign[6],
          refundEnabled: campaign[7],
          creator: campaign[8],
          userContribution: ethers.formatEther(contribution),
          // Off-chain metadata
          imageUrl: metadata.imageUrl,
          category: metadata.category,
          location: metadata.location,
          detailedDescription: metadata.detailedDescription,
          websiteUrl: metadata.websiteUrl
        });
      }

      setCampaigns(campaignList);
    } catch (error) {
      console.error('Error loading campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const createCampaign = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      // Create campaign on blockchain
      const tx = await contract.createCampaign(
        newCampaign.beneficiary,
        newCampaign.title,
        newCampaign.description,
        ethers.parseEther(newCampaign.goalAmount),
        parseInt(newCampaign.durationDays)
      );
      
      const receipt = await tx.wait();
      
      // Get the campaign ID from the event
      const event = receipt.logs.find(log => {
        try {
          return contract.interface.parseLog(log).name === 'CampaignCreated';
        } catch {
          return false;
        }
      });
      
      let campaignId;
      if (event) {
        const parsedEvent = contract.interface.parseLog(event);
        campaignId = Number(parsedEvent.args[0]);
      } else {
        // Fallback: get latest campaign ID
        const count = await contract.getCampaignCount();
        campaignId = Number(count) - 1;
      }
      
      // Save metadata to backend
      if (newCampaign.category || newCampaign.location || newCampaign.imageFile) {
        await campaignAPI.saveMetadata(
          campaignId,
          {
            category: newCampaign.category,
            location: newCampaign.location,
            detailedDescription: newCampaign.detailedDescription,
            websiteUrl: newCampaign.websiteUrl
          },
          newCampaign.imageFile
        );
      }
      
      alert('Campaign created successfully!');
      setNewCampaign({
        beneficiary: '',
        title: '',
        description: '',
        goalAmount: '',
        durationDays: '',
        category: '',
        location: '',
        detailedDescription: '',
        websiteUrl: '',
        imageFile: null
      });
      await loadCampaigns();
    } catch (error) {
      console.error('Error creating campaign:', error);
      alert('Error creating campaign: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const donate = async (campaignId, amount) => {
    try {
      setLoading(true);
      const tx = await contract.donate(campaignId, {
        value: ethers.parseEther(amount)
      });
      await tx.wait();
      alert('Donation successful!');
      await loadCampaigns();
    } catch (error) {
      console.error('Error donating:', error);
      alert('Error donating: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const finalizeCampaign = async (campaignId) => {
    try {
      setLoading(true);
      const tx = await contract.finalizeCampaign(campaignId);
      await tx.wait();
      alert('Campaign finalized!');
      await loadCampaigns();
    } catch (error) {
      console.error('Error finalizing campaign:', error);
      alert('Error finalizing: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const claimRefund = async (campaignId) => {
    try {
      setLoading(true);
      const tx = await contract.claimRefund(campaignId);
      await tx.wait();
      alert('Refund claimed successfully!');
      await loadCampaigns();
    } catch (error) {
      console.error('Error claiming refund:', error);
      alert('Error claiming refund: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDonation = (campaignId) => {
    const amount = prompt('Enter donation amount in ETH:');
    if (amount && parseFloat(amount) > 0) {
      donate(campaignId, amount);
    }
  };

  const getProgressPercentage = (raised, goal) => {
    return Math.min((parseFloat(raised) / parseFloat(goal)) * 100, 100).toFixed(1);
  };

  const isDeadlinePassed = (deadline) => {
    return new Date() > deadline;
  };
  
  const canFinalizeCampaign = (campaign) => {
    // Can finalize if deadline passed OR if goal is fully reached
    const deadlinePassed = new Date() > campaign.deadline;
    const goalReached = parseFloat(campaign.totalRaised) >= parseFloat(campaign.goalAmount);
    return deadlinePassed || goalReached;
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>🌟 Charity Campaign Platform</h1>
        <p>Connected Account: {account ? `${account.substring(0, 6)}...${account.substring(38)}` : 'Not Connected'}</p>
      </header>

      <nav className="navigation">
        <button 
          className={activeSection === 'campaigns' ? 'nav-btn active' : 'nav-btn'}
          onClick={() => setActiveSection('campaigns')}
        >
          🏠 Browse Campaigns
        </button>
        <button 
          className={activeSection === 'create' ? 'nav-btn active' : 'nav-btn'}
          onClick={() => setActiveSection('create')}
        >
          ➕ Create Campaign
        </button>
        <button 
          className={activeSection === 'my-campaigns' ? 'nav-btn active' : 'nav-btn'}
          onClick={() => setActiveSection('my-campaigns')}
        >
          📋 My Campaigns
        </button>
        <button 
          className={activeSection === 'about' ? 'nav-btn active' : 'nav-btn'}
          onClick={() => setActiveSection('about')}
        >
          ℹ️ About
        </button>
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
        {activeSection === 'create' && (
          <section className="create-campaign">
            <h2>Create New Campaign</h2>
            <form onSubmit={createCampaign}>
            <input
              type="text"
              placeholder="Beneficiary Address (0x...)"
              value={newCampaign.beneficiary}
              onChange={(e) => setNewCampaign({...newCampaign, beneficiary: e.target.value})}
              required
            />
            <input
              type="text"
              placeholder="Campaign Title"
              value={newCampaign.title}
              onChange={(e) => setNewCampaign({...newCampaign, title: e.target.value})}
              required
            />
            <textarea
              placeholder="Short Description (on-chain)"
              value={newCampaign.description}
              onChange={(e) => setNewCampaign({...newCampaign, description: e.target.value})}
              required
            />
            
            <select
              value={newCampaign.category}
              onChange={(e) => setNewCampaign({...newCampaign, category: e.target.value})}
            >
              <option value="">Select Category (Optional)</option>
              <option value="Health">🏥 Health</option>
              <option value="Education">📚 Education</option>
              <option value="Environment">🌱 Environment</option>
              <option value="Animal Welfare">🐾 Animal Welfare</option>
              <option value="Disaster Relief">🚨 Disaster Relief</option>
              <option value="Community">🏘️ Community</option>
              <option value="Other">💡 Other</option>
            </select>
            
            <input
              type="text"
              placeholder="Location (Optional)"
              value={newCampaign.location}
              onChange={(e) => setNewCampaign({...newCampaign, location: e.target.value})}
            />
            
            <textarea
              placeholder="Detailed Description (Optional - stored off-chain)"
              value={newCampaign.detailedDescription}
              onChange={(e) => setNewCampaign({...newCampaign, detailedDescription: e.target.value})}
              rows="4"
            />
            
            <input
              type="url"
              placeholder="Website URL (Optional)"
              value={newCampaign.websiteUrl}
              onChange={(e) => setNewCampaign({...newCampaign, websiteUrl: e.target.value})}
            />
            
            <div className="file-input-wrapper">
              <label htmlFor="campaign-image">Campaign Image (Optional)</label>
              <input
                id="campaign-image"
                type="file"
                accept="image/*"
                onChange={(e) => setNewCampaign({...newCampaign, imageFile: e.target.files[0]})}
              />
              {newCampaign.imageFile && <span className="file-name">{newCampaign.imageFile.name}</span>}
            </div>
            
            <input
              type="number"
              step="0.01"
              placeholder="Goal Amount (ETH)"
              value={newCampaign.goalAmount}
              onChange={(e) => setNewCampaign({...newCampaign, goalAmount: e.target.value})}
              required
            />
            <input
              type="number"
              placeholder="Duration (days)"
              value={newCampaign.durationDays}
              onChange={(e) => setNewCampaign({...newCampaign, durationDays: e.target.value})}
              required
            />
            <button type="submit" disabled={loading}>Create Campaign</button>
          </form>
          </section>
        )}

        {activeSection === 'campaigns' && (
          <section className="campaigns">
            <h2>Active Campaigns</h2>
            {campaigns.length === 0 ? (
              <p>No campaigns yet. Create the first one!</p>
            ) : (
              <div className="campaign-grid">
                {campaigns.map((campaign) => (
                  <div key={campaign.id} className="campaign-card">
                    {campaign.imageUrl && (
                      <div className="campaign-image">
                        <img 
                          src={`${process.env.REACT_APP_BACKEND_URL}${campaign.imageUrl}`} 
                          alt={campaign.title}
                        />
                      </div>
                    )}
                    
                    <div className="campaign-content">
                      {campaign.category && (
                        <span className="campaign-category">{campaign.category}</span>
                      )}
                      
                      <h3>{campaign.title}</h3>
                      <p className="description">{campaign.description}</p>
                      
                      {campaign.location && (
                        <p className="campaign-location">📍 {campaign.location}</p>
                      )}
                      
                      <div className="campaign-stats">
                        <div className="stat">
                          <span className="label">Goal:</span>
                          <span className="value">{campaign.goalAmount} ETH</span>
                        </div>
                        <div className="stat">
                          <span className="label">Raised:</span>
                          <span className="value">{campaign.totalRaised} ETH</span>
                        </div>
                        <div className="stat">
                          <span className="label">Deadline:</span>
                          <span className="value">{campaign.deadline.toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{width: `${getProgressPercentage(campaign.totalRaised, campaign.goalAmount)}%`}}
                        />
                      </div>
                      <p className="progress-text">
                        {getProgressPercentage(campaign.totalRaised, campaign.goalAmount)}% funded
                      </p>

                      {parseFloat(campaign.userContribution) > 0 && (
                        <p className="user-contribution">
                          Your contribution: {campaign.userContribution} ETH
                        </p>
                      )}

                      <div className="campaign-actions">
                        {!campaign.finalized && !isDeadlinePassed(campaign.deadline) && (
                          <button 
                            onClick={() => handleDonation(campaign.id)}
                            disabled={loading}
                            className="btn-primary"
                          >
                            Donate
                          </button>
                        )}

                        {!campaign.finalized && canFinalizeCampaign(campaign) && 
                         (campaign.creator.toLowerCase() === account.toLowerCase()) && (
                          <button 
                            onClick={() => finalizeCampaign(campaign.id)}
                            disabled={loading}
                            className="btn-secondary"
                          >
                            Finalize Campaign
                          </button>
                        )}

                        {campaign.finalized && campaign.refundEnabled && 
                         parseFloat(campaign.userContribution) > 0 && (
                          <button 
                            onClick={() => claimRefund(campaign.id)}
                            disabled={loading}
                            className="btn-warning"
                          >
                            Claim Refund
                          </button>
                        )}

                        {campaign.finalized && (
                          <span className="status">
                            {campaign.refundEnabled ? '❌ Goal Not Reached' : '✅ Successfully Funded'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {activeSection === 'my-campaigns' && (
          <section className="my-campaigns">
            <h2>My Campaigns</h2>
            {campaigns.filter(c => c.creator.toLowerCase() === account.toLowerCase()).length === 0 ? (
              <p>You haven't created any campaigns yet.</p>
            ) : (
              <div className="campaign-grid">
                {campaigns
                  .filter(c => c.creator.toLowerCase() === account.toLowerCase())
                  .map((campaign) => (
                    <div key={campaign.id} className="campaign-card">
                      <h3>{campaign.title}</h3>
                      <p className="description">{campaign.description}</p>
                      
                      <div className="campaign-stats">
                        <div className="stat">
                          <span className="label">Goal:</span>
                          <span className="value">{campaign.goalAmount} ETH</span>
                        </div>
                        <div className="stat">
                          <span className="label">Raised:</span>
                          <span className="value">{campaign.totalRaised} ETH</span>
                        </div>
                        <div className="stat">
                          <span className="label">Deadline:</span>
                          <span className="value">{campaign.deadline.toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{width: `${getProgressPercentage(campaign.totalRaised, campaign.goalAmount)}%`}}
                        />
                      </div>
                      <p className="progress-text">
                        {getProgressPercentage(campaign.totalRaised, campaign.goalAmount)}% funded
                      </p>

                      <div className="campaign-actions">
                        {!campaign.finalized && canFinalizeCampaign(campaign) && (
                          <button 
                            onClick={() => finalizeCampaign(campaign.id)}
                            disabled={loading}
                            className="btn-secondary"
                          >
                            Finalize Campaign
                          </button>
                        )}

                        {campaign.finalized && (
                          <span className="status">
                            {campaign.refundEnabled ? '❌ Goal Not Reached' : '✅ Successfully Funded'}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </section>
        )}

        {activeSection === 'about' && (
          <section className="about-section">
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
        )}
      </div>
    </div>
  );
}

export default App;
