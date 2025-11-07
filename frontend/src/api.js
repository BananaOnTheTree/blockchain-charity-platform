const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

// Campaign Metadata API
export const campaignAPI = {
  // Initialize campaign record (before blockchain) - returns DB ID
  async initCampaign(metadata) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/campaigns/init`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(metadata)
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error initializing campaign:', error);
      throw error;
    }
  },

  // Link database record to blockchain campaign ID
  async linkCampaign(dbId, campaignId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/campaigns/${dbId}/link`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ campaignId })
      });
      return await response.json();
    } catch (error) {
      console.error('Error linking campaign:', error);
      throw error;
    }
  },

  // Get campaign metadata
  async getMetadata(campaignId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/campaigns/${campaignId}`);
      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      console.error('Error fetching campaign metadata:', error);
      return null;
    }
  },

  // Get all campaign metadata
  async getAllMetadata() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/campaigns`);
      const data = await response.json();
      return data.success ? data.data : [];
    } catch (error) {
      console.error('Error fetching all campaign metadata:', error);
      return [];
    }
  },

  // Get single campaign metadata
  async getCampaign(campaignId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/campaigns/${campaignId}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching campaign:', error);
      throw error;
    }
  },

  // Upload campaign data (FormData)
  async uploadCampaignData(campaignId, formData) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/campaigns/${campaignId}`, {
        method: 'POST',
        body: formData
      });
      return await response.json();
    } catch (error) {
      console.error('Error uploading campaign data:', error);
      throw error;
    }
  },

  // Create or update campaign metadata
  async saveMetadata(campaignId, metadata, imageFile) {
    try {
      const formData = new FormData();
      
      if (imageFile) {
        formData.append('image', imageFile);
      }
      
      if (metadata.category) formData.append('category', metadata.category);
      if (metadata.location) formData.append('location', metadata.location);
      if (metadata.detailedDescription) formData.append('detailedDescription', metadata.detailedDescription);
      if (metadata.websiteUrl) formData.append('websiteUrl', metadata.websiteUrl);
      if (metadata.socialMedia) formData.append('socialMedia', JSON.stringify(metadata.socialMedia));

      const response = await fetch(`${API_BASE_URL}/api/campaigns/${campaignId}`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error saving campaign metadata:', error);
      return { success: false, error: error.message };
    }
  },

  // Add campaign update
  async addUpdate(campaignId, title, content) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/campaigns/${campaignId}/updates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title, content })
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error adding campaign update:', error);
      return { success: false, error: error.message };
    }
  },

  // Update campaign (sync from blockchain)
  async updateCampaign(campaignId, updates) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/campaigns/${campaignId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error updating campaign:', error);
      return { success: false, error: error.message };
    }
  },

  // Upload gallery images
  async uploadGalleryImages(campaignId, formData) {
    try {
      const url = `${API_BASE_URL}/api/campaigns/${campaignId}/gallery`;
      console.log('🖼️ Uploading gallery images to:', url);
      const response = await fetch(url, {
        method: 'POST',
        body: formData
      });
      const result = await response.json();
      console.log('🖼️ Gallery upload response:', result);
      return result;
    } catch (error) {
      console.error('Error uploading gallery images:', error);
      throw error;
    }
  }
};

// User Profile API
export const userAPI = {
  // Get user profile
  async getProfile(walletAddress) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${walletAddress}`);
      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  },

  // Create or update user profile
  async saveProfile(profileData, avatarFile) {
    try {
      const formData = new FormData();
      
      formData.append('walletAddress', profileData.walletAddress);
      if (profileData.username) formData.append('username', profileData.username);
      if (profileData.bio) formData.append('bio', profileData.bio);
      if (profileData.email) formData.append('email', profileData.email);
      if (profileData.socialMedia) formData.append('socialMedia', JSON.stringify(profileData.socialMedia));
      if (avatarFile) formData.append('avatar', avatarFile);

      const response = await fetch(`${API_BASE_URL}/api/users`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error saving user profile:', error);
      return { success: false, error: error.message };
    }
  }
};
