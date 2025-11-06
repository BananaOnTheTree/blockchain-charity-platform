import React from 'react';
import { useNavigate } from 'react-router-dom';

const MyCampaigns = ({ 
  campaigns, 
  account,
  loading,
  finalizeCampaign,
  getProgressPercentage,
  canFinalizeCampaign
}) => {
  const navigate = useNavigate();

  const myCampaigns = campaigns.filter(c => c.creator.toLowerCase() === account.toLowerCase());

  return (
    <section className="my-campaigns">
      <h2>My Campaigns</h2>
      {myCampaigns.length === 0 ? (
        <p>You haven't created any campaigns yet.</p>
      ) : (
        <div className="campaign-grid">
          {myCampaigns.map((campaign) => (
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
  );
};

export default MyCampaigns;
