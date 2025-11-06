import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { campaignAPI } from '../api';

export const useCampaignOperations = (contract, account, showModal) => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadCampaigns = useCallback(async () => {
    if (!contract || !account) return;

    try {
      setLoading(true);
      const campaignCount = await contract.getCampaignCount();
      const campaignsArray = [];

      for (let i = 0; i < campaignCount; i++) {
        const campaign = await contract.getCampaign(i);
        const userContribution = await contract.getContribution(i, account);
        
        let metadata = null;
        try {
          const response = await campaignAPI.getCampaign(i);
          metadata = response.data;
        } catch (err) {
          console.log(`No metadata found for campaign ${i}`);
        }

        campaignsArray.push({
          id: i,
          beneficiary: campaign[0],
          title: campaign[1],
          description: campaign[2],
          goalAmount: ethers.formatEther(campaign[3]),
          deadline: new Date(Number(campaign[4]) * 1000),
          totalRaised: ethers.formatEther(campaign[5]),
          finalized: campaign[6],
          refundEnabled: campaign[7],
          creator: campaign[8],
          userContribution: ethers.formatEther(userContribution),
          category: metadata?.category,
          location: metadata?.location,
          imageUrl: metadata?.imageUrl
        });
      }

      setCampaigns(campaignsArray);
    } catch (error) {
      console.error('Error loading campaigns:', error);
      showModal('Error', 'Failed to load campaigns', 'error');
    } finally {
      setLoading(false);
    }
  }, [contract, account, showModal]);

  const donate = async (campaignId, amount) => {
    try {
      setLoading(true);
      const tx = await contract.donate(campaignId, {
        value: ethers.parseEther(amount)
      });
      await tx.wait();
      showModal('Success!', 'Donation successful! Thank you for your contribution.', 'success');
      await loadCampaigns();
    } catch (error) {
      console.error('Error donating:', error);
      showModal('Error', 'Error donating: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const finalizeCampaign = async (campaignId) => {
    try {
      setLoading(true);
      const tx = await contract.finalizeCampaign(campaignId);
      await tx.wait();
      showModal('Success!', 'Campaign finalized! Funds have been transferred to the beneficiary.', 'success');
      await loadCampaigns();
    } catch (error) {
      console.error('Error finalizing campaign:', error);
      showModal('Error', 'Error finalizing: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const claimRefund = async (campaignId) => {
    try {
      setLoading(true);
      const tx = await contract.claimRefund(campaignId);
      await tx.wait();
      showModal('Success!', 'Refund claimed successfully!', 'success');
      await loadCampaigns();
    } catch (error) {
      console.error('Error claiming refund:', error);
      showModal('Error', 'Error claiming refund: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return {
    campaigns,
    loading,
    loadCampaigns,
    donate,
    finalizeCampaign,
    claimRefund
  };
};
