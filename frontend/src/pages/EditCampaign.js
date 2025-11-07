import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { campaignAPI } from '../api';
import './EditCampaign.css';

const EditCampaign = ({ campaignId, contract, account, showModal, onCancel }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [campaign, setCampaign] = useState(null);
  const [metadata, setMetadata] = useState(null);
  
  // Blockchain editable fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  
  // Database editable fields
  const [detailedDescription, setDetailedDescription] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  
  // Image uploads
  const [newMainImage, setNewMainImage] = useState(null);
  const [newGalleryImages, setNewGalleryImages] = useState([]);
  const [mainImagePreview, setMainImagePreview] = useState(null);
  const [galleryPreviews, setGalleryPreviews] = useState([]);

  useEffect(() => {
    loadCampaignData();
  }, [campaignId, contract]);

  const loadCampaignData = async () => {
    if (!contract || !account) return;

    try {
      setLoading(true);

      // Load blockchain data
      const campaignData = await contract.getCampaign(campaignId);
      const campaignInfo = {
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
        dbId: Number(campaignData[9])
      };

      setCampaign(campaignInfo);
      setTitle(campaignInfo.title);
      setDescription(campaignInfo.description);

      // Check if user is the creator
      if (campaignInfo.creator.toLowerCase() !== account.toLowerCase()) {
        showModal('Access Denied', 'Only the campaign creator can edit this campaign.', 'error');
        navigate(`/campaign/${campaignId}`);
        return;
      }

      if (campaignInfo.finalized) {
        showModal('Cannot Edit', 'Finalized campaigns cannot be edited.', 'warning');
        navigate(`/campaign/${campaignId}`);
        return;
      }

      // Load metadata from backend
      try {
        const response = await campaignAPI.getCampaign(campaignId);
        if (response.success) {
          const meta = response.data;
          setMetadata(meta);
          setDetailedDescription(meta.detailedDescription || '');
          setCategory(meta.category || '');
          setLocation(meta.location || '');
          setWebsiteUrl(meta.websiteUrl || '');
        }
      } catch (err) {
        console.log('No metadata found');
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading campaign:', error);
      showModal('Error', 'Failed to load campaign data', 'error');
      setLoading(false);
    }
  };

  const handleMainImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewMainImage(file);
      setMainImagePreview(URL.createObjectURL(file));
    }
  };

  const handleGalleryImagesChange = (e) => {
    const files = Array.from(e.target.files);
    setNewGalleryImages(files);
    const previews = files.map(file => URL.createObjectURL(file));
    setGalleryPreviews(previews);
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      showModal('Validation Error', 'Title cannot be empty.', 'warning');
      return;
    }

    try {
      setSaving(true);

      // Step 1: Update blockchain data (title and description)
      if (title !== campaign.title || description !== campaign.description) {
        console.log('Updating blockchain data...');
        const tx = await contract.editCampaign(campaignId, title, description);
        await tx.wait();
        console.log('Blockchain updated successfully');
      }

      // Step 2: Update database metadata
      const formData = new FormData();
      
      // Add text fields
      if (category) formData.append('category', category);
      if (location) formData.append('location', location);
      if (detailedDescription) formData.append('detailedDescription', detailedDescription);
      if (websiteUrl) formData.append('websiteUrl', websiteUrl);

      // Add main image if changed
      if (newMainImage) {
        formData.append('image', newMainImage);
      }

      // Upload metadata
      await campaignAPI.uploadCampaignData(campaignId, formData);

      // Step 3: Upload gallery images if any
      if (newGalleryImages.length > 0) {
        console.log('Uploading gallery images:', newGalleryImages.length);
        const galleryFormData = new FormData();
        newGalleryImages.forEach(file => {
          console.log('Adding file to FormData:', file.name);
          galleryFormData.append('images', file);
        });
        
        try {
          const result = await campaignAPI.uploadGalleryImages(campaignId, galleryFormData);
          console.log('Gallery upload result:', result);
        } catch (galleryError) {
          console.error('Gallery upload failed:', galleryError);
          showModal('Warning', `Campaign updated but gallery images failed to upload: ${galleryError.message}`, 'warning');
        }
      }

      showModal('Success!', 'Campaign updated successfully!', 'success');
      navigate(`/campaign/${campaignId}`);
    } catch (error) {
      console.error('Error updating campaign:', error);
      showModal('Error', 'Failed to update campaign: ' + error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate(`/campaign/${campaignId}`);
    }
  };

  if (loading) {
    return (
      <div className="edit-campaign-container">
        <div className="loading">Loading campaign data...</div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="edit-campaign-container">
        <div className="error">Campaign not found</div>
      </div>
    );
  }

  return (
    <div className="edit-campaign-container">
      <div className="edit-campaign-header">
        <h1>✏️ Edit Campaign</h1>
        <p className="campaign-id">Campaign #{campaignId}</p>
      </div>

      <form onSubmit={handleSave} className="edit-campaign-form">
        {/* Blockchain Data Section */}
        <section className="form-section">
          <h2>📜 Blockchain Data (Immutable Core)</h2>
          <p className="section-note">These fields are stored on the blockchain. Editing requires a transaction.</p>

          <div className="form-group">
            <label htmlFor="title">Campaign Title *</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter campaign title"
              maxLength="100"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Short Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief campaign description"
              rows="4"
              maxLength="500"
            />
            <small>{description.length}/500 characters</small>
          </div>

          <div className="readonly-info">
            <div className="info-item">
              <span className="label">Goal:</span>
              <span className="value">{ethers.formatEther(campaign.goal)} ETH</span>
            </div>
            <div className="info-item">
              <span className="label">Deadline:</span>
              <span className="value">{new Date(Number(campaign.deadline) * 1000).toLocaleDateString()}</span>
            </div>
            <div className="info-item">
              <span className="label">Beneficiary:</span>
              <span className="value monospace">{campaign.beneficiary.substring(0, 10)}...{campaign.beneficiary.substring(38)}</span>
            </div>
          </div>
          <p className="readonly-note">⚠️ Goal, deadline, and beneficiary cannot be changed after creation.</p>
        </section>

        {/* Database Metadata Section */}
        <section className="form-section">
          <h2>💾 Off-Chain Metadata (Flexible)</h2>
          <p className="section-note">These fields are stored in the database and can be updated freely.</p>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="category">Category</label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">Select category</option>
                <option value="Health">Health</option>
                <option value="Education">Education</option>
                <option value="Environment">Environment</option>
                <option value="Animals">Animals</option>
                <option value="Community">Community</option>
                <option value="Emergency">Emergency</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="location">Location</label>
              <input
                id="location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="City, Country"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="websiteUrl">Website URL</label>
            <input
              id="websiteUrl"
              type="url"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://example.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="detailedDescription">Detailed Description</label>
            <textarea
              id="detailedDescription"
              value={detailedDescription}
              onChange={(e) => setDetailedDescription(e.target.value)}
              placeholder="Provide a comprehensive description of your campaign, including goals, timeline, and impact..."
              rows="10"
              maxLength="5000"
            />
            <small>{detailedDescription.length}/5000 characters</small>
          </div>
        </section>

        {/* Image Upload Section */}
        <section className="form-section">
          <h2>🖼️ Images</h2>

          <div className="form-group">
            <label htmlFor="mainImage">Main Campaign Image</label>
            {(mainImagePreview || metadata?.imageUrl) && (
              <div className="image-preview">
                <img 
                  src={mainImagePreview || `http://localhost:3001${metadata.imageUrl}`} 
                  alt="Main campaign" 
                />
              </div>
            )}
            <input
              id="mainImage"
              type="file"
              accept="image/*"
              onChange={handleMainImageChange}
            />
            <small>Upload a new image to replace the current one (max 5MB)</small>
          </div>

          <div className="form-group">
            <label htmlFor="galleryImages">Additional Gallery Images</label>
            {galleryPreviews.length > 0 && (
              <div className="gallery-preview">
                {galleryPreviews.map((preview, idx) => (
                  <img key={idx} src={preview} alt={`Gallery ${idx + 1}`} />
                ))}
              </div>
            )}
            <input
              id="galleryImages"
              type="file"
              accept="image/*"
              multiple
              onChange={handleGalleryImagesChange}
            />
            <small>Select multiple images to add to gallery (max 10 images, 5MB each)</small>
          </div>

          {metadata?.galleryImages && metadata.galleryImages.length > 0 && (
            <div className="current-gallery">
              <p className="label">Current Gallery Images:</p>
              <div className="gallery-preview">
                {metadata.galleryImages.map((img, idx) => (
                  <img 
                    key={idx} 
                    src={`http://localhost:3001${img}`} 
                    alt={`Current gallery ${idx + 1}`} 
                  />
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Action Buttons */}
        <div className="form-actions">
          <button 
            type="button" 
            className="btn-cancel" 
            onClick={handleCancel}
            disabled={saving}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="btn-save" 
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditCampaign;
