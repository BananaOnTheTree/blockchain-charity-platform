import React from 'react';
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

  return (
    <section className="campaigns">
      <h2>Active Campaigns</h2>
      {campaigns.length === 0 ? (
        <p>No campaigns yet. Create the first one!</p>
      ) : (
        <div className="campaign-grid">
          {campaigns.map((campaign) => (
            <div 
              key={campaign.id} 
              className="campaign-card"
            >
              <button 
                className="view-detail-btn"
                onClick={() => navigate(`/campaign/${campaign.id}`)}
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
    </section>
  );
};

export default BrowseCampaigns;
