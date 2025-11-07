import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Home.css';

const Home = ({ campaigns, account }) => {
  const navigate = useNavigate();

  // Calculate statistics from campaigns
  const totalCampaigns = campaigns.length;
  const activeCampaigns = campaigns.filter(c => !c.finalized).length;
  const totalRaised = campaigns.reduce((sum, c) => sum + parseFloat(c.totalRaised || 0), 0).toFixed(2);
  const successfulCampaigns = campaigns.filter(c => c.finalized && parseFloat(c.totalRaised) >= parseFloat(c.goalAmount)).length;

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Transparent Charity Fundraising
            <span className="highlight"> Powered by Blockchain</span>
          </h1>
          <p className="hero-subtitle">
            Create campaigns, raise funds, and make a difference with complete transparency.
            Every donation is traceable and secure on the Ethereum blockchain.
          </p>
          <div className="hero-buttons">
            <button 
              className="btn-primary-large"
              onClick={() => navigate('/create')}
            >
              Start a Campaign
            </button>
            <button 
              className="btn-secondary-large"
              onClick={() => navigate('/browse')}
            >
              Browse Campaigns
            </button>
          </div>
          
          {/* Trust indicators */}
          <div className="trust-indicators">
            <div className="indicator">
              <span className="indicator-icon">🔒</span>
              <span>Blockchain Secured</span>
            </div>
            <div className="indicator">
              <span className="indicator-icon">✓</span>
              <span>100% Transparent</span>
            </div>
            <div className="indicator">
              <span className="indicator-icon">⚡</span>
              <span>Instant Transfers</span>
            </div>
          </div>
        </div>
        
        <div className="hero-image">
          <div className="hero-illustration">
            <div className="floating-card card-1">
              <span className="card-icon">💝</span>
              <span className="card-text">Direct Donations</span>
            </div>
            <div className="floating-card card-2">
              <span className="card-icon">🌍</span>
              <span className="card-text">Global Impact</span>
            </div>
            <div className="floating-card card-3">
              <span className="card-icon">🔗</span>
              <span className="card-text">On-Chain Verified</span>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="stats-section">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-number">{totalCampaigns}</div>
            <div className="stat-label">Total Campaigns</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">💰</div>
            <div className="stat-number">{totalRaised} ETH</div>
            <div className="stat-label">Funds Raised</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🎯</div>
            <div className="stat-number">{activeCampaigns}</div>
            <div className="stat-label">Active Campaigns</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✨</div>
            <div className="stat-number">{successfulCampaigns}</div>
            <div className="stat-label">Success Stories</div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works">
        <h2 className="section-title">How It Works</h2>
        <p className="section-subtitle">Simple, transparent, and secure fundraising in 4 easy steps</p>
        
        <div className="steps-grid">
          <div className="step-card">
            <div className="step-number">1</div>
            <div className="step-icon">📝</div>
            <h3>Create Campaign</h3>
            <p>Set up your fundraising campaign with a clear goal, deadline, and compelling story</p>
          </div>
          
          <div className="step-card">
            <div className="step-number">2</div>
            <div className="step-icon">📢</div>
            <h3>Share & Promote</h3>
            <p>Share your campaign with supporters and watch donations come in real-time</p>
          </div>
          
          <div className="step-card">
            <div className="step-number">3</div>
            <div className="step-icon">💎</div>
            <h3>Receive Donations</h3>
            <p>Accept ETH donations directly on the blockchain with complete transparency</p>
          </div>
          
          <div className="step-card">
            <div className="step-number">4</div>
            <div className="step-icon">🎉</div>
            <h3>Achieve Goal</h3>
            <p>Reach your goal and funds are automatically transferred to the beneficiary</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <h2 className="section-title">Why Choose Our Platform?</h2>
        <p className="section-subtitle">Built on blockchain technology for maximum trust and efficiency</p>
        
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🔐</div>
            <h3>Secure & Trustless</h3>
            <p>Smart contracts ensure funds are handled securely without intermediaries. Your donations are protected by blockchain technology.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">👁️</div>
            <h3>100% Transparent</h3>
            <p>Every transaction is recorded on the blockchain. Anyone can verify where donations go and how funds are used.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">💸</div>
            <h3>Automatic Refunds</h3>
            <p>If a campaign doesn't reach its goal by the deadline, donors can instantly claim their full refund.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3>Instant Transfers</h3>
            <p>No waiting periods. Successful campaigns receive funds immediately after finalization.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">🌍</div>
            <h3>Global Accessibility</h3>
            <p>Anyone with an Ethereum wallet can create campaigns or donate from anywhere in the world.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">🛡️</div>
            <h3>Audited Contracts</h3>
            <p>Built with OpenZeppelin's battle-tested smart contract libraries for maximum security.</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>Ready to Make a Difference?</h2>
          <p>Start your fundraising journey today or support an existing cause</p>
          <div className="cta-buttons">
            <button 
              className="btn-cta-primary"
              onClick={() => navigate('/create')}
            >
              Create Your Campaign
            </button>
            <button 
              className="btn-cta-secondary"
              onClick={() => navigate('/browse')}
            >
              Explore Campaigns
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
