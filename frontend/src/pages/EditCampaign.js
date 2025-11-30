import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { campaignAPI } from '../api';
import {
  FormField,
  CategorySelector,
  ImageUploader,
  GalleryPreview,
  Lightbox
} from '../components/wizard';
import useLightbox from '../hooks/useLightbox';
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
  
  // Lightbox hook
  const lightbox = useLightbox();
  
  // Delete confirmation modal state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [imageToDelete, setImageToDelete] = useState(null);

  useEffect(() => {
    loadCampaignData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  dbUuid: campaignData[9]
      };

      setCampaign(campaignInfo);
      setTitle(campaignInfo.title);
      setDescription(campaignInfo.description);

      // Check if user is the creator
      if (campaignInfo.creator.toLowerCase() !== account.toLowerCase()) {
        showModal('Access Denied', 'Only the campaign creator can edit this campaign.', 'error');
        navigate(`/campaign/${campaignInfo.dbUuid}`);
        return;
      }

      if (campaignInfo.finalized) {
        showModal('Cannot Edit', 'Finalized campaigns cannot be edited.', 'warning');
        navigate(`/campaign/${campaignInfo.dbUuid}`);
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
  };

  const handleDeleteGalleryImage = async (imageIndex, e) => {
    e.stopPropagation(); // Prevent triggering the image preview
    
    // Open confirmation modal
    setImageToDelete(imageIndex);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (imageToDelete === null) return;

    try {
      setSaving(true);
      const response = await campaignAPI.deleteGalleryImage(campaignId, imageToDelete);
      
      if (response.success) {
        // Update local metadata state with the new gallery images
        setMetadata(response.data);
        showModal('Success', 'Gallery image deleted successfully', 'success');
      } else {
        showModal('Error', response.error || 'Failed to delete image', 'error');
      }
    } catch (error) {
      console.error('Error deleting gallery image:', error);
      showModal('Error', 'Failed to delete gallery image', 'error');
    } finally {
      setSaving(false);
      setDeleteConfirmOpen(false);
      setImageToDelete(null);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmOpen(false);
    setImageToDelete(null);
  };

  const handlePreviewGalleryImage = (imageIndex) => {
    if (metadata?.galleryImages) {
      const images = metadata.galleryImages.map(img => `http://localhost:3001${img}`);
      lightbox.openLightbox(images, imageIndex);
    }
  };

  const handlePreviewNewGalleryImage = (imageIndex) => {
    lightbox.openLightbox(newGalleryImages, imageIndex);
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
  navigate(`/campaign/${campaign?.dbUuid || campaignId}`);
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
      navigate(`/campaign/${campaign?.dbUuid || campaignId}`);
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

          <FormField
            label="Campaign Title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter campaign title"
            required
          />

          <FormField
            label="Short Description"
            type="textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief campaign description"
            rows={4}
            helperText={`${description.length}/500 characters`}
          />

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

          <CategorySelector
            selectedCategory={category}
            onSelect={(cat) => setCategory(cat)}
          />

          <FormField
            label="Location"
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="City, Country"
          />

          <FormField
            label="Website URL"
            type="url"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            placeholder="https://example.com"
          />

          <FormField
            label="Detailed Description"
            type="textarea"
            value={detailedDescription}
            onChange={(e) => setDetailedDescription(e.target.value)}
            placeholder="Provide a comprehensive description of your campaign, including goals, timeline, and impact..."
            rows={10}
            helperText={`${detailedDescription.length}/5000 characters`}
          />
        </section>

        {/* Image Upload Section */}
        <section className="form-section">
          <h2>🖼️ Images</h2>

          <ImageUploader
            id="mainImage"
            label="Main Campaign Image"
            helperText="Upload a new image to replace the current one (max 5MB)"
            onFileChange={handleMainImageChange}
            onFileRemove={() => {
              setNewMainImage(null);
              setMainImagePreview(null);
            }}
            selectedFile={newMainImage}
          />

          {(mainImagePreview || metadata?.imageUrl) && (
            <div className="image-preview main-image-preview">
              <img 
                src={mainImagePreview || `http://localhost:3001${metadata.imageUrl}`} 
                alt="Main campaign" 
              />
            </div>
          )}

          <ImageUploader
            id="galleryImages"
            label="Additional Gallery Images"
            helperText="Select multiple images to add to gallery (max 10 images, 5MB each)"
            multiple
            onFileChange={handleGalleryImagesChange}
            icon="🖼️"
            primaryText="Add more images"
            secondaryText="Select multiple files"
          />

          {newGalleryImages.length > 0 && (
            <GalleryPreview
              files={newGalleryImages}
              onImageClick={handlePreviewNewGalleryImage}
              onRemove={(index) => {
                const updatedFiles = newGalleryImages.filter((_, i) => i !== index);
                setNewGalleryImages(updatedFiles);
              }}
            />
          )}

          {metadata?.galleryImages && metadata.galleryImages.length > 0 && (
            <div className="current-gallery">
              <p className="label">Current Gallery Images:</p>
              <div className="gallery-preview">
                {metadata.galleryImages.map((img, idx) => (
                  <div 
                    key={idx} 
                    className="gallery-image-container"
                    onClick={() => handlePreviewGalleryImage(idx)}
                  >
                    <img 
                      src={`http://localhost:3001${img}`} 
                      alt={`Current gallery ${idx + 1}`} 
                    />
                    <div className="gallery-overlay">
                      <button
                        type="button"
                        className="delete-gallery-btn"
                        onClick={(e) => handleDeleteGalleryImage(idx, e)}
                        disabled={saving}
                        title="Delete this image"
                      >
                        ×
                      </button>
                    </div>
                  </div>
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

      {/* Lightbox Modal */}
      <Lightbox
        isOpen={lightbox.isOpen}
        images={lightbox.images}
        currentIndex={lightbox.currentIndex}
        onClose={lightbox.closeLightbox}
        onNext={lightbox.nextImage}
        onPrev={lightbox.prevImage}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirmOpen && (
        <div className="lightbox-overlay" onClick={cancelDelete}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Delete Image</h3>
            <p>Are you sure you want to delete this gallery image?</p>
            <div className="confirm-actions">
              <button className="btn-cancel-confirm" onClick={cancelDelete}>
                Cancel
              </button>
              <button className="btn-delete-confirm" onClick={confirmDelete} disabled={saving}>
                {saving ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditCampaign;
