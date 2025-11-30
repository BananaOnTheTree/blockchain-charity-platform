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
      
      // Step 1: Create database record first and get DB ID
      const dbMetadata = {
        category: newCampaign.category || null,
        location: newCampaign.location || null,
        detailedDescription: newCampaign.detailedDescription || null,
        websiteUrl: newCampaign.websiteUrl || null
      };
      
      const dbResponse = await campaignAPI.initCampaign(dbMetadata);
      
      if (!dbResponse.success) {
        throw new Error('Failed to create database record');
      }
      
  // Use the UUID returned by the backend (safer and stable across environments)
  const dbUuid = dbResponse.dbUuid || dbResponse.dbId; // fallback if backend returns numeric id
  console.log('Created database record with UUID:', dbUuid);
      
      // Step 2: Create blockchain campaign with DB ID
      const goalInWei = ethers.parseEther(newCampaign.goalAmount);
      const durationInDays = parseInt(newCampaign.durationDays);
      
      const tx = await contract.createCampaign(
        newCampaign.beneficiary,
        newCampaign.title,
        newCampaign.description || '',
        goalInWei,
        durationInDays,
        dbUuid  // Pass database UUID to smart contract
      );
      
      const receipt = await tx.wait();
      const campaignId = Number(await contract.getCampaignCount()) - 1;
      console.log('Created blockchain campaign with ID:', campaignId);
      
      // Step 3: Link the database record to the blockchain campaign ID
  // Link backend record by UUID to the blockchain campaignId
  await campaignAPI.linkCampaign(dbUuid, campaignId);
      console.log('Linked DB record to blockchain campaign');
      
      // Step 4: Upload image if provided
      if (newCampaign.imageFile) {
        const formData = new FormData();
        formData.append('image', newCampaign.imageFile);
        await campaignAPI.uploadCampaignData(campaignId, formData);
      }
      
      showModal('Success!', 'Campaign created successfully with database integration!', 'success');
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
