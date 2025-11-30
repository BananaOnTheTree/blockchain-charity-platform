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
    // Guard: ensure contract is available before attempting blockchain call
    if (!contract) {
      console.error('Contract instance is not ready (null) when creating campaign');
      showModal('Not Connected', 'Blockchain contract not available. Please connect your wallet and ensure the contract is deployed and the page is reloaded.', 'error');
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

      // Validate/resolve beneficiary to an on-chain address.
      let beneficiaryAddress = null;
      try {
        // Try to normalize as a hex address (throws if invalid)
        beneficiaryAddress = ethers.getAddress(newCampaign.beneficiary);
      } catch (err) {
        // Not a direct hex address; attempt to resolve as ENS name if provider available
        try {
          const provider = (contract && contract.provider) || (contract && contract.signer && contract.signer.provider);
          if (!provider) throw new Error('No provider available to resolve name');
          const resolved = await provider.resolveName(newCampaign.beneficiary);
          if (!resolved) throw new Error('Name did not resolve to an address');
          beneficiaryAddress = resolved;
        } catch (resolveErr) {
          console.error('Failed to normalize or resolve beneficiary:', resolveErr);
          showModal('Invalid Beneficiary', 'Beneficiary must be a valid Ethereum address. ENS names require a network that supports ENS (not available on local Hardhat). Please use a checksum address (0x...) instead.', 'error');
          return;
        }
      }

      const tx = await contract.createCampaign(
        beneficiaryAddress,
        newCampaign.title,
        newCampaign.description || '',
        goalInWei,
        durationInDays,
        dbUuid  // Pass database UUID to smart contract
      );
      
      const receipt = await tx.wait();
      // Try to extract the created uuidKey from the emitted event (CampaignCreated)
      try {
        const createdEvent = receipt.events?.find((e) => e.event === 'CampaignCreated');
        if (createdEvent) {
          const uuidKey = createdEvent.args?.[0];
          console.log('Created blockchain campaign uuidKey:', uuidKey);
        } else {
          console.log('CampaignCreated event not found in receipt; campaign created but no on-chain return value in transaction receipt');
        }
      } catch (err) {
        console.warn('Could not parse receipt for CampaignCreated event:', err);
      }

      // NOTE: backend linking endpoint historically expected a numeric campaignId. The contract now uses db UUIDs
      // as canonical identifiers. The DB record already contains the UUID returned from initCampaign, so explicit
      // linking by numeric id is no longer required here. If you want to persist the on-chain bytes32 key in the
      // database, update the backend to accept and store it.
      
      // Step 4: Upload image if provided
      if (newCampaign.imageFile) {
        const formData = new FormData();
        formData.append('image', newCampaign.imageFile);
        // Use the UUID in the API path (backend accepts UUID or numeric id)
        await campaignAPI.uploadCampaignData(dbUuid, formData);
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
