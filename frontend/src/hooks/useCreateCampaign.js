import { useState } from 'react';
import { ethers } from 'ethers';
import { campaignAPI } from '../api';

export const useCreateCampaign = (contract, showModal, loadCampaigns) => {
  const [loading, setLoading] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    beneficiary: '',
    title: '',
    description: '',
    goalAmount: '',
    durationDays: '',
    category: '',
    location: '',
    detailedDescription: '',
    websiteUrl: '',
    imageFile: null
  });

  const createCampaign = async (e) => {
    e.preventDefault();
    
    if (!newCampaign.beneficiary || !newCampaign.title || 
        !newCampaign.goalAmount || !newCampaign.durationDays) {
      showModal('Missing Fields', 'Please fill in all required fields.', 'warning');
      return;
    }

    try {
      setLoading(true);
      
      const goalInWei = ethers.parseEther(newCampaign.goalAmount);
      const durationInSeconds = parseInt(newCampaign.durationDays) * 24 * 60 * 60;
      
      const tx = await contract.createCampaign(
        newCampaign.beneficiary,
        newCampaign.title,
        newCampaign.description || '',
        goalInWei,
        durationInSeconds
      );
      
      await tx.wait();
      const campaignId = Number(await contract.getCampaignCount()) - 1;
      
      // Upload metadata and image if provided
      if (newCampaign.imageFile || newCampaign.category || newCampaign.location) {
        const formData = new FormData();
        if (newCampaign.imageFile) formData.append('image', newCampaign.imageFile);
        if (newCampaign.category) formData.append('category', newCampaign.category);
        if (newCampaign.location) formData.append('location', newCampaign.location);
        if (newCampaign.detailedDescription) formData.append('detailedDescription', newCampaign.detailedDescription);
        if (newCampaign.websiteUrl) formData.append('websiteUrl', newCampaign.websiteUrl);

        await campaignAPI.uploadCampaignData(campaignId, formData);
      }
      
      showModal('Success!', 'Campaign created successfully!', 'success');
      setNewCampaign({
        beneficiary: '',
        title: '',
        description: '',
        goalAmount: '',
        durationDays: '',
        category: '',
        location: '',
        detailedDescription: '',
        websiteUrl: '',
        imageFile: null
      });
      await loadCampaigns();
    } catch (error) {
      console.error('Error creating campaign:', error);
      showModal('Error', 'Error creating campaign: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return {
    newCampaign,
    setNewCampaign,
    createCampaign,
    loading
  };
};
