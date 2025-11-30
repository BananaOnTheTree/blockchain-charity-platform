import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Home.css';

const Home = ({ campaigns, account }) => {
  const navigate = useNavigate();

  // Calculate statistics from campaigns
  const totalCampaigns = campaigns.length;
  const activeCampaigns = campaigns.filter(c => !c.finalized).length;
  const totalRaised = campaigns.reduce((sum, c) => sum + parseFloat(c.totalRaised || 0), 0).toFixed(2);
  const successfulCampaigns = campaigns.filter(c => c.finalized && parseFloat(c.totalRaised) >= parseFloat(c.goalAmount)).length;

  // Mock reviews data for homepage (expanded)
  const mockReviews = [
    { id: 1, name: 'Asha K.', rating: 5, comment: 'Incredibly transparent and easy to use. Donated in minutes and could track everything on-chain.', thought: 'A trustworthy platform for giving' },
    { id: 2, name: 'Marcelo R.', rating: 4, comment: 'Great idea and smooth UX. Would love mobile wallet integrations next.', thought: 'Solid foundation — promising future' },
    { id: 3, name: 'Priya S.', rating: 5, comment: 'Campaign I supported reached its goal and funds were transferred instantly. Amazing!', thought: 'Proved its value for real causes' },
    { id: 4, name: 'Lina T.', rating: 5, comment: 'Loved the clear updates—kept me confident about where my donation went.', thought: 'Clear and reliable' },
    { id: 5, name: 'Omar N.', rating: 4, comment: 'Smooth onboarding and fast transactions. Would enjoy more social sharing options.', thought: 'Useful and fast' },
    { id: 6, name: 'Yara P.', rating: 5, comment: 'The campaign I backed met its goal — funds released instantly. Couldn\'t be happier.', thought: 'Effective for real causes' },
    { id: 7, name: 'Ethan M.', rating: 4, comment: 'Good UX and transparent flow. Would like better mobile layout on some screens.', thought: 'Promising and improving' },
    { id: 8, name: 'Sofia L.', rating: 5, comment: 'A great way to support projects worldwide. Trustworthy and simple.', thought: 'Global impact made easy' }
  ];

  const renderStars = (rating) => {
    const max = 5;
    return (
      <span className="review-stars" aria-label={`${rating} out of 5 stars`}>
        {Array.from({ length: max }).map((_, i) => (
          <span key={i} className={i < rating ? 'star filled' : 'star'}>{i < rating ? '★' : '☆'}</span>
        ))}
      </span>
    );
  };

  // Carousel / auto-scroll logic
  const carouselRef = useRef(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;

    const checkOverflow = () => {
      setIsOverflowing(el.scrollWidth > el.clientWidth + 8);
    };

    checkOverflow();
    window.addEventListener('resize', checkOverflow);

    // observe changes if content changes (basic)
    const ro = new ResizeObserver(checkOverflow);
    ro.observe(el);

    return () => {
      window.removeEventListener('resize', checkOverflow);
      ro.disconnect();
    };
  }, [mockReviews.length]);

  useEffect(() => {
    if (!isOverflowing) return;
    const el = carouselRef.current;
    if (!el) return;

    let rafId = null;
    let interval = null;

    const stepScroll = () => {
      if (!el) return;
      const max = el.scrollWidth - el.clientWidth;
      // advance by one card width (card + gap) for predictable paging
      const card = el.querySelector('.review-card');
      let advance;
      if (card) {
        const gap = parseFloat(getComputedStyle(el).gap) || parseFloat(getComputedStyle(el).columnGap) || 24;
        advance = Math.round(card.offsetWidth + gap);
      } else {
        advance = Math.round(el.clientWidth * 0.82);
      }
      if (el.scrollLeft >= max - 4) {
        el.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        el.scrollTo({ left: Math.min(el.scrollLeft + advance, max), behavior: 'smooth' });
      }
    };

    interval = setInterval(() => {
      if (isPaused) return;
      // use requestAnimationFrame to schedule smooth scroll
      rafId = window.requestAnimationFrame(stepScroll);
    }, 3600);

    return () => {
      if (interval) clearInterval(interval);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [isOverflowing, isPaused]);

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

      {/* Reviews Section */}
      <section className="reviews-section">
        <h2 className="section-title">What People Say</h2>
  <p className="section-subtitle">Genuine feedback from our community</p>

        <div
          className="reviews-carousel"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div className="reviews-grid" ref={carouselRef}>
          {mockReviews.map(r => (
            <div key={r.id} className="review-card" role="article" aria-labelledby={`review-${r.id}-name`}>
              <div className="review-header">
                <div id={`review-${r.id}-name`} className="review-name">{r.name}</div>
                <div className="review-rating">{renderStars(r.rating)}</div>
              </div>
              <div className="review-comment">"{r.comment}"</div>
              <div className="review-thought">{r.thought}</div>
            </div>
          ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
