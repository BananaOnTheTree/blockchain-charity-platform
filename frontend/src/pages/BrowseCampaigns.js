import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const BrowseCampaigns = ({ 
  campaigns, 
  loading, 
  account,
  handleDonation,
  finalizeCampaign,
  claimRefund,
  getProgressPercentage,
  isDeadlinePassed,
  canFinalizeCampaign
}) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const filteredCampaigns = useMemo(() => {
    const q = (query || '').trim().toLowerCase();
    if (!q) return campaigns;
    return campaigns.filter(c => (c.title || '').toLowerCase().includes(q));
  }, [campaigns, query]);

  // Early return for empty campaign list (decorated empty state)
  if (!campaigns || campaigns.length === 0) {
    return (
      <section className="campaigns">
        <h2>Active Campaigns</h2>
        <div className="empty-campaigns">
          <div className="empty-card">
            <h3>No campaigns yet</h3>
            <p>Create the first campaign and make an impact.</p>
            <div className="empty-actions">
              <button
                className="btn-primary-large"
                onClick={() => navigate('/create')}
              >
                Create Campaign
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="campaigns">
      <h2>Active Campaigns</h2>
      <div className="campaigns-list">
        <div className="campaigns-toolbar">
          <div className="search-bar">
            <input
              type="search"
              placeholder="Search campaigns by name"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search campaigns by name"
            />
            {query && (
              <button
                className="btn-clear"
                onClick={() => setQuery('')}
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {filteredCampaigns.length === 0 ? (
          <div className="no-results">No campaigns match "{query}"</div>
        ) : (
          <div className="campaign-grid">
            {filteredCampaigns.map((campaign) => (
              <div 
                key={campaign.id} 
                className="campaign-card"
              >
                <button 
                  className="view-detail-btn"
                  onClick={() => navigate(`/campaign/${campaign.dbUuid || campaign.id}`)}
                  aria-label="View campaign details"
                >
                  👁 View
                </button>
                
                {campaign.imageUrl && (
                  <div className="campaign-image">
                    <img 
                      src={`${process.env.REACT_APP_BACKEND_URL}${campaign.imageUrl}`} 
                      alt={campaign.title}
                    />
                  </div>
                )}
                
                <div className="campaign-content">
                  <div className="campaign-header">
                    <div style={{height: '1.8rem', marginBottom: '0.5rem'}}>
                      {campaign.category && (
                        <span className="campaign-category">{campaign.category}</span>
                      )}
                    </div>
                    
                    <h3>{campaign.title}</h3>
                    <p className="description">{campaign.description}</p>
                    
                    {campaign.location ? (
                      <p className="campaign-location">📍 {campaign.location}</p>
                    ) : (
                      <p className="campaign-location"></p>
                    )}
                  </div>
                  
                  <div className="campaign-metrics">
                    <div className="campaign-stats">
                      <div className="stat">
                        <span className="label">Goal</span>
                        <span className="value">{campaign.goalAmount} ETH</span>
                      </div>
                      <div className="stat">
                        <span className="label">Raised</span>
                        <span className="value">{campaign.totalRaised} ETH</span>
                      </div>
                    </div>

                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{width: `${getProgressPercentage(campaign.totalRaised, campaign.goalAmount)}%`}}
                      />
                      <p className="progress-text">
                        {getProgressPercentage(campaign.totalRaised, campaign.goalAmount)}% funded
                      </p>
                    </div>
                    
                    <div className="stat" style={{marginTop: '0.5rem'}}>
                      <span className="label">Deadline</span>
                      <span className="value">{campaign.deadline.toLocaleDateString()}</span>
                    </div>

                    <p className="user-contribution">
                      Your contribution: {parseFloat(campaign.userContribution) > 0 
                        ? `${campaign.userContribution} ETH`
                        : '0 ETH'}
                    </p>

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
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default BrowseCampaigns;
