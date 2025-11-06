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
  onEdit,
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
  const [leaderboard, setLeaderboard] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedDescription, setEditedDescription] = useState('');

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

      // Load leaderboard (top 10 donors)
      try {
        const [donors, amounts] = await contract.getTopDonors(campaignId, 10);
        const leaderboardData = donors.map((donor, index) => ({
          rank: index + 1,
          address: donor,
          amount: amounts[index],
          isCurrentUser: donor.toLowerCase() === account.toLowerCase()
        }));
        setLeaderboard(leaderboardData);
      } catch (err) {
        console.log('Error loading leaderboard:', err);
        setLeaderboard([]);
      }

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

  const handleEditClick = () => {
    setEditedTitle(campaign.title);
    setEditedDescription(campaign.description);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedTitle('');
    setEditedDescription('');
  };

  const handleSaveEdit = async () => {
    if (!editedTitle.trim()) {
      showModal('Error', 'Title cannot be empty', 'error');
      return;
    }

    try {
      await onEdit(campaignId, editedTitle, editedDescription);
      setIsEditing(false);
      await loadCampaignData(); // Reload after edit
    } catch (error) {
      console.error('Error editing campaign:', error);
    }
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
  
  // Debug logging
  console.log('🔍 Account check:', {
    account: account,
    creator: campaign.creator,
    accountLower: account?.toLowerCase(),
    creatorLower: campaign.creator?.toLowerCase(),
    isMatch: account?.toLowerCase() === campaign.creator?.toLowerCase(),
    finalized: campaign.finalized
  });
  
  const canFinalize = (account?.toLowerCase() === campaign.creator?.toLowerCase() || account?.toLowerCase() === campaign.beneficiary?.toLowerCase()) 
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
        {account?.toLowerCase() === campaign.creator?.toLowerCase() && !campaign.finalized && (
          <button className="btn-secondary" onClick={handleEditClick}>
            ✏️ Edit Campaign
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
          className={activeTab === 'leaderboard' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('leaderboard')}
        >
          🏆 Leaderboard
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

        {activeTab === 'leaderboard' && (
          <div className="leaderboard-tab">
            <h2>🏆 Top Donors</h2>
            {leaderboard.length > 0 ? (
              <div className="leaderboard-list">
                {leaderboard.map((donor) => (
                  <div 
                    key={donor.rank} 
                    className={`leaderboard-item ${donor.isCurrentUser ? 'current-user' : ''} ${donor.rank <= 3 ? `rank-${donor.rank}` : ''}`}
                  >
                    <div className="rank-badge">
                      {donor.rank === 1 && <span className="medal gold">🥇</span>}
                      {donor.rank === 2 && <span className="medal silver">🥈</span>}
                      {donor.rank === 3 && <span className="medal bronze">🥉</span>}
                      {donor.rank > 3 && <span className="rank-number">#{donor.rank}</span>}
                    </div>
                    <div className="donor-info">
                      <span className="donor-address">
                        {donor.address.substring(0, 10)}...{donor.address.substring(38)}
                        {donor.isCurrentUser && <span className="you-badge">You</span>}
                      </span>
                    </div>
                    <div className="donor-amount">
                      <span className="amount">{ethers.formatEther(donor.amount)} ETH</span>
                      <span className="percentage">
                        {((Number(ethers.formatEther(donor.amount)) / Number(ethers.formatEther(campaign.totalRaised))) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-donations">
                <p>🎁 No donations yet. Be the first to support this campaign!</p>
              </div>
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

      {/* Edit Campaign Modal */}
      {isEditing && (
        <div className="modal-overlay" onClick={handleCancelEdit}>
          <div className="modal-content edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>✏️ Edit Campaign</h2>
              <button className="close-button" onClick={handleCancelEdit}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="edit-title">Campaign Title *</label>
                <input
                  id="edit-title"
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  placeholder="Enter campaign title"
                  maxLength="100"
                />
              </div>
              <div className="form-group">
                <label htmlFor="edit-description">Description</label>
                <textarea
                  id="edit-description"
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  placeholder="Enter campaign description"
                  rows="6"
                  maxLength="1000"
                />
              </div>
              <div className="form-note">
                Note: You can only edit the title and description. Goal, deadline, and beneficiary cannot be changed.
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={handleCancelEdit}>
                Cancel
              </button>
              <button className="btn-save" onClick={handleSaveEdit}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignDetail;
