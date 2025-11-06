import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import './CampaignDetail.css';

const CampaignDetail = ({ 
  campaignId, 
  contract, 
  account, 
  onBack, 
  onDonate, 
  onFinalize, 
  onClaimRefund,
  showModal,
  showInputModal 
}) => {
  const [campaign, setCampaign] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [donation, setDonation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedImage, setSelectedImage] = useState(0);

  const loadCampaignData = useCallback(async () => {
    if (!contract || !account) {
      // Don't set loading to false yet, wait for contract to be ready
      return;
    }
    
    try {
      setLoading(true);
      setError(null);

      // Load blockchain data
      const campaignData = await contract.getCampaign(campaignId);
      const parsedCampaign = {
        id: campaignId,
        beneficiary: campaignData[0],
        title: campaignData[1],
        description: campaignData[2],
        goal: campaignData[3],
        deadline: campaignData[4],
        totalRaised: campaignData[5],
        finalized: campaignData[6],
        refundEnabled: campaignData[7],
        creator: campaignData[8]
      };
      setCampaign(parsedCampaign);

      // Load user's donation
      const userDonation = await contract.getContribution(campaignId, account);
      setDonation(userDonation);

      // Load metadata from backend
      try {
        const response = await fetch(`http://localhost:3001/api/campaigns/${campaignId}`);
        if (response.ok) {
          const data = await response.json();
          setMetadata(data.data);
        }
      } catch (err) {
        console.log('No metadata found for campaign');
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading campaign:', error);
      setError(error.message || 'Failed to load campaign details');
      showModal('Error', 'Failed to load campaign details', 'error');
      setLoading(false);
    }
  }, [campaignId, contract, account, showModal]);

  useEffect(() => {
    loadCampaignData();
  }, [loadCampaignData]);

  const handleDonateClick = () => {
    onDonate(campaignId);
    // Reload will happen through parent component
  };

  const handleFinalizeClick = async () => {
    await onFinalize(campaignId);
    await loadCampaignData(); // Reload after finalization
  };

  const handleClaimRefundClick = async () => {
    await onClaimRefund(campaignId);
    await loadCampaignData(); // Reload after refund
  };

  if (loading) {
    return (
      <div className="campaign-detail">
        <button className="back-button" onClick={onBack}>← Back to Campaigns</button>
        <div className="loading">Loading campaign details...</div>
      </div>
    );
  }

  if (!contract || !account) {
    return (
      <div className="campaign-detail">
        <button className="back-button" onClick={onBack}>← Back to Campaigns</button>
        <div className="loading">Connecting to wallet...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="campaign-detail">
        <button className="back-button" onClick={onBack}>← Back to Campaigns</button>
        <div className="error">{error}</div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="campaign-detail">
        <button className="back-button" onClick={onBack}>← Back to Campaigns</button>
        <div className="error">Campaign not found</div>
      </div>
    );
  }

  const progress = Number(campaign.totalRaised) > 0 
    ? (Number(campaign.totalRaised) / Number(campaign.goal)) * 100 
    : 0;
  const goalReached = Number(campaign.totalRaised) >= Number(campaign.goal);
  const isExpired = Number(campaign.deadline) * 1000 < Date.now();
  const canFinalize = (account === campaign.creator || account === campaign.beneficiary) 
    && !campaign.finalized 
    && (goalReached || isExpired);
  const canClaimRefund = campaign.refundEnabled 
    && Number(donation) > 0 
    && !campaign.finalized;

  const allImages = [
    metadata?.imageUrl,
    ...(metadata?.galleryImages || [])
  ].filter(Boolean);

  return (
    <div className="campaign-detail">
      <button className="back-button" onClick={onBack}>← Back to Campaigns</button>

      {/* Hero Section with Image Gallery */}
      <div className="hero-section">
        <div className="image-gallery">
          {allImages.length > 0 ? (
            <>
              <div className="main-image">
                <img 
                  src={`http://localhost:3001${allImages[selectedImage]}`} 
                  alt={campaign.title}
                  onError={(e) => e.target.src = 'https://via.placeholder.com/800x400?text=Campaign+Image'}
                />
              </div>
              {allImages.length > 1 && (
                <div className="thumbnail-gallery">
                  {allImages.map((img, idx) => (
                    <img
                      key={idx}
                      src={`http://localhost:3001${img}`}
                      alt={`Thumbnail ${idx + 1}`}
                      className={selectedImage === idx ? 'active' : ''}
                      onClick={() => setSelectedImage(idx)}
                      onError={(e) => e.target.src = 'https://via.placeholder.com/100?text=Image'}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="placeholder-image">
              <span>📸</span>
              <p>No images available</p>
            </div>
          )}
        </div>

        <div className="campaign-header">
          <div className="header-top">
            <h1>{campaign.title}</h1>
            {metadata?.category && (
              <span className="category-badge">{metadata.category}</span>
            )}
          </div>
          {metadata?.location && (
            <p className="location">📍 {metadata.location}</p>
          )}
        </div>
      </div>

      {/* Stats Bar */}
      <div className="stats-bar">
        <div className="stat">
          <span className="stat-value">{ethers.formatEther(campaign.totalRaised)} ETH</span>
          <span className="stat-label">Raised</span>
        </div>
        <div className="stat">
          <span className="stat-value">{ethers.formatEther(campaign.goal)} ETH</span>
          <span className="stat-label">Goal</span>
        </div>
        <div className="stat">
          <span className="stat-value">{progress.toFixed(1)}%</span>
          <span className="stat-label">Progress</span>
        </div>
        <div className="stat">
          <span className="stat-value">
            {isExpired ? 'Ended' : new Date(Number(campaign.deadline) * 1000).toLocaleDateString()}
          </span>
          <span className="stat-label">Deadline</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="progress-container">
        <div className="progress-bar">
          <div 
            className={`progress-fill ${goalReached ? 'success' : ''}`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          ></div>
        </div>
      </div>

      {/* Status Badges */}
      <div className="status-badges">
        {campaign.finalized && (
          <span className="badge finalized">✅ Finalized</span>
        )}
        {goalReached && !campaign.finalized && (
          <span className="badge success">🎯 Goal Reached!</span>
        )}
        {isExpired && !campaign.finalized && (
          <span className="badge expired">⏰ Deadline Passed</span>
        )}
        {campaign.refundEnabled && (
          <span className="badge refund">💸 Refunds Available</span>
        )}
      </div>

      {/* Action Buttons */}
      <div className="action-buttons">
        {!campaign.finalized && !isExpired && (
          <button className="btn-primary" onClick={handleDonateClick}>
            💝 Donate Now
          </button>
        )}
        {canFinalize && (
          <button className="btn-success" onClick={handleFinalizeClick}>
            ✅ Finalize Campaign
          </button>
        )}
        {canClaimRefund && (
          <button className="btn-warning" onClick={handleClaimRefundClick}>
            💸 Claim Refund ({ethers.formatEther(donation)} ETH)
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button 
          className={activeTab === 'overview' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('overview')}
        >
          📋 Overview
        </button>
        <button 
          className={activeTab === 'updates' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('updates')}
        >
          📢 Updates
        </button>
        <button 
          className={activeTab === 'details' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('details')}
        >
          ℹ️ Details
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <h2>About This Campaign</h2>
            <p className="description">{campaign.description}</p>
            
            {metadata?.detailedDescription && (
              <>
                <h3>Detailed Description</h3>
                <div className="detailed-description">
                  {metadata.detailedDescription}
                </div>
              </>
            )}

            {metadata?.websiteUrl && (
              <div className="website-link">
                <h3>Learn More</h3>
                <a href={metadata.websiteUrl} target="_blank" rel="noopener noreferrer">
                  🔗 Visit Campaign Website
                </a>
              </div>
            )}

            {metadata?.socialMedia && Object.keys(metadata.socialMedia).length > 0 && (
              <div className="social-media">
                <h3>Connect With Us</h3>
                <div className="social-links">
                  {metadata.socialMedia.twitter && (
                    <a href={metadata.socialMedia.twitter} target="_blank" rel="noopener noreferrer">
                      🐦 Twitter
                    </a>
                  )}
                  {metadata.socialMedia.facebook && (
                    <a href={metadata.socialMedia.facebook} target="_blank" rel="noopener noreferrer">
                      👥 Facebook
                    </a>
                  )}
                  {metadata.socialMedia.instagram && (
                    <a href={metadata.socialMedia.instagram} target="_blank" rel="noopener noreferrer">
                      📷 Instagram
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'updates' && (
          <div className="updates-tab">
            <h2>Campaign Updates</h2>
            {metadata?.updates && metadata.updates.length > 0 ? (
              <div className="updates-list">
                {metadata.updates.map((update, idx) => (
                  <div key={idx} className="update-item">
                    <div className="update-header">
                      <h3>{update.title}</h3>
                      <span className="update-date">
                        {new Date(update.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <p>{update.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-updates">No updates yet</p>
            )}
          </div>
        )}

        {activeTab === 'details' && (
          <div className="details-tab">
            <h2>Campaign Details</h2>
            <div className="details-grid">
              <div className="detail-item">
                <span className="detail-label">Campaign ID</span>
                <span className="detail-value">#{campaignId.toString()}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Creator</span>
                <span className="detail-value monospace">
                  {campaign.creator.substring(0, 10)}...{campaign.creator.substring(38)}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Beneficiary</span>
                <span className="detail-value monospace">
                  {campaign.beneficiary.substring(0, 10)}...{campaign.beneficiary.substring(38)}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Your Donation</span>
                <span className="detail-value">
                  {donation ? `${ethers.formatEther(donation)} ETH` : 'None'}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Status</span>
                <span className="detail-value">
                  {campaign.finalized ? 'Finalized' : 'Active'}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Created</span>
                <span className="detail-value">
                  {metadata?.createdAt 
                    ? new Date(metadata.createdAt).toLocaleDateString()
                    : 'Unknown'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CampaignDetail;
