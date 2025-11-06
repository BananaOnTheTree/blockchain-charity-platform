import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import CharityCampaignFactoryABI from '../CharityCampaignFactory.json';

const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS || 'YOUR_CONTRACT_ADDRESS';

export const useWeb3 = (showModal) => {
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState('');
  const [networkError, setNetworkError] = useState('');

  const initializeProvider = useCallback(async () => {
    try {
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        
        try {
          const accounts = await window.ethereum.request({ 
            method: 'eth_requestAccounts' 
          });
          setAccount(accounts[0]);

          const signer = await provider.getSigner();
          const campaignContract = new ethers.Contract(
            CONTRACT_ADDRESS,
            CharityCampaignFactoryABI.abi,
            signer
          );
          setContract(campaignContract);

          const network = await provider.getNetwork();
          if (network.chainId !== 31337n) {
            setNetworkError('Please switch to Hardhat local network (localhost:8545)');
            showModal('Wrong Network', 'Please switch to Hardhat local network', 'error');
          } else {
            setNetworkError('');
          }

          window.ethereum.on('accountsChanged', (accounts) => {
            setAccount(accounts[0]);
            window.location.reload();
          });

          window.ethereum.on('chainChanged', () => {
            window.location.reload();
          });

        } catch (error) {
          console.error('Error requesting accounts:', error);
          showModal('Connection Error', 'Failed to connect to MetaMask. Please try again.', 'error');
        }
      } else {
        setNetworkError('MetaMask not detected. Please install MetaMask extension.');
        showModal('MetaMask Not Found', 'Please install MetaMask to use this application.', 'error');
      }
    } catch (error) {
      console.error('Error initializing provider:', error);
      showModal('Error', 'Failed to initialize Web3 provider', 'error');
    }
  }, [showModal]);

  useEffect(() => {
    initializeProvider();
  }, [initializeProvider]);

  return { contract, account, networkError };
};
