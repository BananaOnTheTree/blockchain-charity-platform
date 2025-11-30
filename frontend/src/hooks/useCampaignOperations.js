import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { campaignAPI } from '../api';

export const useCampaignOperations = (contract, account, showModal) => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [blockchainTime, setBlockchainTime] = useState(null);

  const loadCampaigns = useCallback(async () => {
    console.log('🔍 loadCampaigns called - contract:', contract, 'account:', account);
    if (!contract || !account) {
      console.log('⚠️ Contract or account not available yet');
      return;
    }

    try {
      setLoading(true);
      console.log('📡 Fetching campaigns from chain (on-chain-first enumeration)');
      const campaignCount = await contract.getCampaignCount();
      console.log('✅ Campaign count (on-chain):', campaignCount.toString());

      // Get current blockchain time
      const provider = contract.runner.provider;
      const blockNumber = await provider.getBlockNumber();
      const block = await provider.getBlock(blockNumber);
      const currentBlockchainTime = block.timestamp;
      setBlockchainTime(currentBlockchainTime);
      console.log('⏰ Blockchain time:', new Date(currentBlockchainTime * 1000).toLocaleString());

      const campaignsArray = [];

      // Enumerate on-chain keys and fetch campaigns by key
      for (let i = 0; i < campaignCount; i++) {
        try {
          const key = await contract.campaignKeys(i);
          console.log(`📥 Loading campaign (key): ${key}`);

          // New contract getter that returns campaign by bytes32 key
          const campaign = await contract.getCampaignByKey(key);
          console.log(`  Title: ${campaign[1]}`);

          // dbUuid is returned as part of the campaign struct
          const dbUuid = campaign[9];

          const userContribution = await contract.getContribution(dbUuid, account);

          // Optionally overlay backend metadata if present
          let metadata = null;
          try {
            const response = await campaignAPI.getCampaign(encodeURIComponent(dbUuid));
            metadata = response.data;
          } catch (err) {
            // Not critical — on-chain is source of truth
          }

          campaignsArray.push({
            id: dbUuid,
            beneficiary: campaign[0],
            title: campaign[1],
            description: campaign[2],
            goalAmount: ethers.formatEther(campaign[3]),
            deadline: new Date(Number(campaign[4]) * 1000),
            totalRaised: ethers.formatEther(campaign[5]),
            finalized: campaign[6],
            refundEnabled: campaign[7],
            creator: campaign[8],
            dbUuid: dbUuid,
            userContribution: ethers.formatEther(userContribution),
            category: metadata?.category,
            location: metadata?.location,
            imageUrl: metadata?.imageUrl
          });
        } catch (err) {
          console.error('Failed to load on-chain campaign at index', i, err);
        }
      }

      console.log('✅ Total campaigns loaded:', campaignsArray.length, campaignsArray);
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
      
      // Get campaign details before finalizing to check if goal was reached
      const campaign = await contract.getCampaign(campaignId);
      const goalAmount = campaign[3];
      const totalRaised = campaign[5];
      const goalReached = totalRaised >= goalAmount;
      
      const tx = await contract.finalizeCampaign(campaignId);
      const receipt = await tx.wait();

      // Look for BeneficiaryBalanceChanged event and log before/after balances
      try {
        const ev = receipt.events && receipt.events.find((e) => e.event === 'BeneficiaryBalanceChanged');
        if (ev && ev.args) {
          const uuidKey = ev.args[0] || ev.args.uuidKey;
          const beneficiary = ev.args[1] || ev.args.beneficiary;
          const balanceBefore = ev.args[2] || ev.args.balanceBefore;
          const balanceAfter = ev.args[3] || ev.args.balanceAfter;
          try {
            console.log(`BeneficiaryBalanceChanged - uuidKey: ${uuidKey}, beneficiary: ${beneficiary}`);
            console.log(`  balanceBefore: ${ethers.formatEther(balanceBefore)} ETH`);
            console.log(`  balanceAfter:  ${ethers.formatEther(balanceAfter)} ETH`);
          } catch (formatErr) {
            // Fallback to raw values
            console.log('BeneficiaryBalanceChanged raw:', { uuidKey, beneficiary, balanceBefore: String(balanceBefore), balanceAfter: String(balanceAfter) });
          }
        }
      } catch (evErr) {
        console.warn('Could not parse BeneficiaryBalanceChanged event from receipt', evErr);
      }
      
      // Show appropriate message based on whether goal was reached
      if (goalReached) {
        showModal(
          'Campaign Finalized! 🎉', 
          `Goal reached! ${ethers.formatEther(totalRaised)} ETH has been transferred to the beneficiary.`, 
          'success'
        );
      } else {
        showModal(
          'Campaign Finalized', 
          `Campaign did not reach its goal. Refunds are now enabled for all donors. Total raised: ${ethers.formatEther(totalRaised)} ETH`, 
          'info'
        );
      }
      
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

  const editCampaign = async (campaignId, newTitle, newDescription) => {
    try {
      setLoading(true);
      
      // Step 1: Update on blockchain (single source of truth)
      console.log('🔗 Updating campaign on blockchain...');
      const tx = await contract.editCampaign(campaignId, newTitle, newDescription);
      await tx.wait();
      console.log('✅ Blockchain updated successfully');
      
      // Step 2: No need to sync title/description to database
      // Database only stores off-chain metadata (images, categories, etc.)
      // The frontend will always fetch title/description from blockchain
      
      showModal('Success!', 'Campaign updated successfully!', 'success');
      await loadCampaigns();
    } catch (error) {
      console.error('Error editing campaign:', error);
      showModal('Error', 'Error editing campaign: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return {
    campaigns,
    loading,
    blockchainTime,
    loadCampaigns,
    donate,
    finalizeCampaign,
    claimRefund,
    editCampaign
  };
};
