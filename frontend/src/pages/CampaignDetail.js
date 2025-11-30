import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { Lightbox } from '../components/wizard';
import useLightbox from '../hooks/useLightbox';
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
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [donation, setDonation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [leaderboard, setLeaderboard] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState(null);
  const [aiRisk, setAiRisk] = useState(null);
  const [aiCached, setAiCached] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [blockchainTime, setBlockchainTime] = useState(null);
  
  // Lightbox hook for gallery
  const lightbox = useLightbox();  const loadCampaignData = useCallback(async () => {
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
        creator: campaignData[8],
  dbUuid: campaignData[9]
      };
      setCampaign(parsedCampaign);

      // Get current blockchain time
      const provider = contract.runner.provider;
      const blockNumber = await provider.getBlockNumber();
      const block = await provider.getBlock(blockNumber);
      setBlockchainTime(block.timestamp);

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

  // AI generate and save helpers
  const generateAi = async () => {
    setAiError(null);
    setAiLoading(true);
    setAiSummary(null);
    setAiRisk(null);
    setAiCached(false);
    try {
      const summaryResp = await fetch(`http://localhost:3001/api/ai/campaigns/${campaignId}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'summary', title: campaign.title, description: campaign.description })
      });
      const summaryJson = await summaryResp.json();
      if (!summaryJson.success) throw new Error(summaryJson.error || 'Summary generation failed');
      setAiSummary(summaryJson.data);
      if (summaryJson.cached) setAiCached(true);

      const riskResp = await fetch(`http://localhost:3001/api/ai/campaigns/${campaignId}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'risk', title: campaign.title, description: campaign.description })
      });
      const riskJson = await riskResp.json();
      if (!riskJson.success) throw new Error(riskJson.error || 'Risk generation failed');
      setAiRisk(riskJson.data);
      if (riskJson.cached) setAiCached(true);
    } catch (err) {
      console.error('AI generation error', err);
      setAiError(err.message || 'AI generation failed');
    } finally {
      setAiLoading(false);
    }
  };

  // Save functionality removed per request; AI only generates locally

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
    // Navigate to edit route by UUID (URL uses UUID)
    navigate(`/campaign/${campaign.dbUuid}/edit`);
  };

  const openGalleryLightbox = (index) => {
    if (metadata?.galleryImages) {
      const images = metadata.galleryImages.map(img => `http://localhost:3001${img}`);
      lightbox.openLightbox(images, index);
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
  
  // Use blockchain time instead of Date.now() for accurate deadline checking
  const currentTime = blockchainTime || Math.floor(Date.now() / 1000);
  const isExpired = Number(campaign.deadline) < currentTime;
  
  // Debug logging
  console.log('🔍 Campaign Status:', {
    deadline: Number(campaign.deadline),
    blockchainTime: currentTime,
    isExpired: isExpired,
    goalReached: goalReached,
    finalized: campaign.finalized
  });
  
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
    && campaign.finalized;

  const allImages = [
    metadata?.imageUrl,
    ...(metadata?.galleryImages || [])
  ].filter(Boolean);

  return (
    <div className="campaign-detail">
      {/* Hero Banner with Image and Title Overlay */}
      <div className="hero-banner">
        {allImages.length > 0 ? (
          <>
            <div className="banner-image">
              <img 
                src={`http://localhost:3001${allImages[0]}`} 
                alt={campaign.title}
                onError={(e) => e.target.src = 'https://via.placeholder.com/1400x500?text=Campaign+Image'}
              />
              <div className="banner-overlay"></div>
            </div>
            <div className="banner-content">
              <div className="banner-header">
                {metadata?.category && (
                  <span className="category-badge-hero">{metadata.category}</span>
                )}
                <h1 className="campaign-title-hero">{campaign.title}</h1>
                {metadata?.location && (
                  <p className="location-hero">📍 {metadata.location}</p>
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="banner-placeholder">
              <span className="placeholder-icon">📸</span>
            </div>
            <div className="banner-content">
              <div className="banner-header">
                {metadata?.category && (
                  <span className="category-badge-hero">{metadata.category}</span>
                )}
                <h1 className="campaign-title-hero">{campaign.title}</h1>
                {metadata?.location && (
                  <p className="location-hero">📍 {metadata.location}</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Main Content Card */}
      <div className="content-card">

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
          className={activeTab === 'details' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('details')}
        >
          ℹ️ Details
        </button>
      </div>

      {/* Tab Content with Sidebar Layout */}
      <div className="content-with-sidebar">
        <div className="main-content">
          {activeTab === 'overview' && (
            <div className="overview-tab">
              <h2>About This Campaign</h2>
              <p className="description">{campaign.description}</p>
              {/* AI feature moved to floating bubble */}
              
              {metadata?.detailedDescription && (
                <>
                  <h3>Detailed Description</h3>
                  <div className="detailed-description">
                    {metadata.detailedDescription}
                  </div>
                </>
              )}

              {/* Photo Gallery */}
              {metadata?.galleryImages && metadata.galleryImages.length > 0 && (
                <div className="photo-gallery">
                  <h2>📸 Photo Gallery</h2>
                  <div className="gallery-grid">
                    {metadata.galleryImages.map((image, idx) => (
                      <div 
                        key={idx} 
                        className="gallery-item"
                        onClick={() => openGalleryLightbox(idx)}
                      >
                        <img 
                          src={`http://localhost:3001${image}`} 
                          alt={`Campaign gallery ${idx + 1}`}
                          onError={(e) => e.target.src = 'https://via.placeholder.com/300?text=Image'}
                        />
                        <div className="gallery-overlay">
                          <span className="zoom-icon">🔍</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
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

          {activeTab === 'details' && (
          <div className="details-tab">
            <h2>Campaign Details</h2>
            <div className="details-grid">
              <div className="detail-item">
                <span className="detail-label">Campaign UUID</span>
                <span className="detail-value monospace">{
                  metadata?.uuid
                    ? `${metadata.uuid.substring(0,8)}...${metadata.uuid.substring(metadata.uuid.length - 4)}`
                    : `#${campaignId.toString()}`
                }</span>
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

        {/* Sidebar with Leaderboard */}
        <aside className="sidebar">
          <div className="leaderboard-sidebar">
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
        </aside>
      </div>
      </div>

      {/* Lightbox Modal for Gallery */}
      {/* Floating AI Bubble (bottom-right) */}
      <div className={`ai-bubble-wrapper ${aiOpen ? 'open' : ''}`}>
        <div className="ai-bubble" onClick={() => setAiOpen(!aiOpen)} title="AI tools">
          🤖
        </div>
        {aiOpen && (
          <div className="ai-panel-floating">
            <div className="ai-panel-header">
              <strong>AI: Summary & Risk</strong>
              <button className="btn-warning" onClick={() => { setAiOpen(false); }}>✕</button>
            </div>
            <div className="ai-panel-body">
              <div style={{display: 'flex', gap: '8px', marginBottom: '8px'}}>
                <button className="btn-secondary" onClick={generateAi} disabled={aiLoading}>{aiLoading ? 'Generating…' : 'Generate'}</button>
              </div>
              {aiError && <div className="ai-error">⚠️ {aiError}</div>}
              {aiCached && <div className="ai-note">Cached result</div>}
              {aiSummary && (
                <div className="ai-result">
                  <h4>Summary</h4>
                  <div className="ai-text">{aiSummary.text || aiSummary}</div>
                </div>
              )}
              {aiRisk && (
                <div className="ai-result">
                  <h4>Risk Assessment</h4>
                  <pre className="ai-text" style={{whiteSpace: 'pre-wrap'}}>{aiRisk.text || JSON.stringify(aiRisk, null, 2)}</pre>
                </div>
              )}
              {/* Save removed: generation only per current request */}
            </div>
          </div>
        )}
      </div>

      <Lightbox
        isOpen={lightbox.isOpen}
        images={lightbox.images}
        currentIndex={lightbox.currentIndex}
        onClose={lightbox.closeLightbox}
        onNext={lightbox.nextImage}
        onPrev={lightbox.prevImage}
      />
    </div>
  );
};

export default CampaignDetail;
