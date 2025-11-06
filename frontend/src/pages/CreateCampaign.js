import React from 'react';

const CreateCampaign = ({ 
  newCampaign, 
  setNewCampaign, 
  createCampaign, 
  loading 
}) => {
  return (
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
  );
};

export default CreateCampaign;
