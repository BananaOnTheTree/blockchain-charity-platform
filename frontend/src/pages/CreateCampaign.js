import React, { useState } from 'react';
import {
  WizardProgress,
  FormField,
  CategorySelector,
  ImageUploader,
  ImagePreview,
  GalleryPreview,
  Lightbox
} from '../components/wizard';
import useLightbox from '../hooks/useLightbox';
import '../styles/wizard/index.css';

const WIZARD_STEPS = [
  { number: 1, title: 'Basic Info', icon: '📝' },
  { number: 2, title: 'Details', icon: '📋' },
  { number: 3, title: 'Media', icon: '🖼️' },
  { number: 4, title: 'Goal & Timeline', icon: '🎯' }
];

const CreateCampaign = ({ 
  newCampaign, 
  setNewCampaign, 
  createCampaign, 
  loading 
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = WIZARD_STEPS.length;
  
  // Lightbox functionality
  const lightbox = useLightbox();

  // Wizard navigation
  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createCampaign(e);
  };

  // Step validation
  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return newCampaign.title && newCampaign.beneficiary && newCampaign.description;
      case 2:
        return true; // Optional fields
      case 3:
        return true; // Optional fields
      case 4:
        return newCampaign.goalAmount && newCampaign.durationDays;
      default:
        return false;
    }
  };

  // Field update handler
  const updateField = (field, value) => {
    setNewCampaign({ ...newCampaign, [field]: value });
  };

  // Image handlers
  const handleMainImageChange = (e) => {
    updateField('imageFile', e.target.files[0]);
  };

  const handleMainImageRemove = () => {
    updateField('imageFile', null);
  };

  const handleGalleryImagesChange = (e) => {
    const files = Array.from(e.target.files);
    const existingFiles = newCampaign.galleryFiles || [];
    updateField('galleryFiles', [...existingFiles, ...files]);
  };

  const handleGalleryImageRemove = (index) => {
    const updatedFiles = newCampaign.galleryFiles.filter((_, i) => i !== index);
    updateField('galleryFiles', updatedFiles);
  };

  const handleMainImageClick = () => {
    lightbox.openLightbox([newCampaign.imageFile], 0);
  };

  const handleGalleryImageClick = (index) => {
    const allImages = newCampaign.imageFile 
      ? [newCampaign.imageFile, ...newCampaign.galleryFiles]
      : newCampaign.galleryFiles;
    const clickedIndex = newCampaign.imageFile ? index + 1 : index;
    lightbox.openLightbox(allImages, clickedIndex);
  };

  return (
    <section className="create-campaign-wizard">
      <div className="wizard-container">
        {/* Header */}
        <div className="wizard-header">
          <h1>Create Your Campaign</h1>
          <p>Let's bring your vision to life, step by step</p>
        </div>

        {/* Progress Indicator */}
        <WizardProgress 
          steps={WIZARD_STEPS} 
          currentStep={currentStep}
          onStepClick={setCurrentStep}
        />

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="wizard-form">
          <div className="form-content">
            {/* Step 1: Basic Info */}
            {currentStep === 1 && (
              <div className="step-content animate-in">
                <h2>📝 Let's start with the basics</h2>
                <p className="step-description">Tell us about your campaign and who it's for</p>
                
                <FormField
                  label="Campaign Title"
                  type="text"
                  placeholder="Give your campaign a clear, compelling title"
                  value={newCampaign.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  helperText="Make it memorable and descriptive"
                  required
                />

                <FormField
                  label="Beneficiary Wallet Address"
                  type="text"
                  placeholder="0x..."
                  value={newCampaign.beneficiary}
                  onChange={(e) => updateField('beneficiary', e.target.value)}
                  helperText="The Ethereum address that will receive the funds"
                  required
                />

                <FormField
                  label="Short Description"
                  type="textarea"
                  placeholder="Briefly describe your campaign in 2-3 sentences"
                  value={newCampaign.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  helperText="This will be stored on the blockchain"
                  rows={3}
                  required
                />

                <CategorySelector
                  selectedCategory={newCampaign.category}
                  onSelect={(category) => updateField('category', category)}
                />
              </div>
            )}

            {/* Step 2: Details */}
            {currentStep === 2 && (
              <div className="step-content animate-in">
                <h2>📋 Add more details</h2>
                <p className="step-description">Help donors understand your mission better</p>

                <FormField
                  label="Location"
                  type="text"
                  placeholder="City, Country"
                  value={newCampaign.location}
                  onChange={(e) => updateField('location', e.target.value)}
                  helperText="Where is this campaign located?"
                />

                <FormField
                  label="Detailed Description"
                  type="textarea"
                  placeholder="Tell your story in detail. What are you raising money for? Why is it important? How will the funds be used?"
                  value={newCampaign.detailedDescription}
                  onChange={(e) => updateField('detailedDescription', e.target.value)}
                  helperText="This extended description is stored off-chain"
                  rows={8}
                />

                <FormField
                  label="Website URL"
                  type="url"
                  placeholder="https://yourwebsite.com"
                  value={newCampaign.websiteUrl}
                  onChange={(e) => updateField('websiteUrl', e.target.value)}
                  helperText="Link to your organization or campaign website"
                />
              </div>
            )}

            {/* Step 3: Media */}
            {currentStep === 3 && (
              <div className="step-content animate-in">
                <h2>🖼️ Add visual appeal</h2>
                <p className="step-description">Campaigns with images raise more funds</p>

                {/* Main Campaign Image */}
                <ImageUploader
                  id="campaign-image"
                  label="Main Campaign Image *"
                  helperText="This will be the primary image shown on your campaign"
                  onFileChange={handleMainImageChange}
                  onFileRemove={handleMainImageRemove}
                  selectedFile={newCampaign.imageFile}
                  icon="📸"
                  primaryText="Click to upload main image"
                />

                {newCampaign.imageFile && (
                  <ImagePreview
                    file={newCampaign.imageFile}
                    onClick={handleMainImageClick}
                    className="main-image-preview"
                  />
                )}

                {/* Gallery Images */}
                <div className="gallery-section">
                  <ImageUploader
                    id="gallery-images"
                    label="Supporting Images (Gallery)"
                    helperText="Add up to 5 additional images to showcase your campaign"
                    multiple
                    onFileChange={handleGalleryImagesChange}
                    icon="🖼️"
                    primaryText="Add more images"
                    secondaryText="Select multiple files"
                  />

                  {newCampaign.galleryFiles && newCampaign.galleryFiles.length > 0 && (
                    <GalleryPreview
                      files={newCampaign.galleryFiles}
                      onImageClick={handleGalleryImageClick}
                      onRemove={handleGalleryImageRemove}
                    />
                  )}
                </div>
              </div>
            )}

            {/* Step 4: Goal & Timeline */}
            {currentStep === 4 && (
              <div className="step-content animate-in">
                <h2>🎯 Set your goal</h2>
                <p className="step-description">Define your fundraising target and deadline</p>

                <FormField
                  label="Funding Goal (ETH)"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={newCampaign.goalAmount}
                  onChange={(e) => updateField('goalAmount', e.target.value)}
                  helperText="How much do you need to raise?"
                  required
                />

                <FormField
                  label="Campaign Duration (days)"
                  type="number"
                  min="1"
                  placeholder="30"
                  value={newCampaign.durationDays}
                  onChange={(e) => updateField('durationDays', e.target.value)}
                  helperText="How long will your campaign run?"
                  required
                />

                {/* Campaign Summary */}
                <div className="campaign-summary">
                  <h3>Campaign Summary</h3>
                  <div className="summary-item">
                    <span className="summary-label">Title:</span>
                    <span className="summary-value">{newCampaign.title || 'Not set'}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Category:</span>
                    <span className="summary-value">{newCampaign.category || 'Not set'}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Goal:</span>
                    <span className="summary-value">{newCampaign.goalAmount || '0'} ETH</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Duration:</span>
                    <span className="summary-value">{newCampaign.durationDays || '0'} days</span>
                  </div>
                  {newCampaign.location && (
                    <div className="summary-item">
                      <span className="summary-label">Location:</span>
                      <span className="summary-value">{newCampaign.location}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="wizard-navigation">
            {currentStep > 1 && (
              <button 
                type="button" 
                onClick={handleBack}
                className="btn-back"
              >
                ← Back
              </button>
            )}
            
            <div className="nav-spacer"></div>

            {currentStep < totalSteps ? (
              <button 
                type="button" 
                onClick={handleNext}
                className="btn-next"
                disabled={!isStepValid()}
              >
                Continue →
              </button>
            ) : (
              <button 
                type="submit" 
                className="btn-submit"
                disabled={loading || !isStepValid()}
              >
                {loading ? 'Creating...' : '🚀 Launch Campaign'}
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Lightbox Modal for Image Preview */}
      <Lightbox
        isOpen={lightbox.isOpen}
        images={lightbox.images}
        currentIndex={lightbox.currentIndex}
        onClose={lightbox.closeLightbox}
        onNext={lightbox.nextImage}
        onPrev={lightbox.prevImage}
      />
    </section>
  );
};

export default CreateCampaign;
