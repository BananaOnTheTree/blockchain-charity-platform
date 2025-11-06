import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import './App.css';
import Modal from './components/Modal';
import InputModal from './components/InputModal';
import CampaignDetail from './pages/CampaignDetail';
import Layout from './components/Layout';
import BrowseCampaigns from './pages/BrowseCampaigns';
import CreateCampaign from './pages/CreateCampaign';
import MyCampaigns from './pages/MyCampaigns';
import About from './pages/About';
import { useWeb3 } from './hooks/useWeb3';
import { useModals } from './hooks/useModals';
import { useCampaignOperations } from './hooks/useCampaignOperations';
import { useCreateCampaign } from './hooks/useCreateCampaign';
import { getProgressPercentage, isDeadlinePassed, canFinalizeCampaign } from './utils/campaignUtils';

function App() {
  // Custom hooks
  const { modal, inputModal, showModal, closeModal, showInputModal, closeInputModal } = useModals();
  const { contract, account, networkError } = useWeb3(showModal);
  const { campaigns, loading, loadCampaigns, donate, finalizeCampaign, claimRefund, editCampaign } = 
    useCampaignOperations(contract, account, showModal);
  const { newCampaign, setNewCampaign, createCampaign, loading: createLoading } = 
    useCreateCampaign(contract, showModal, loadCampaigns);

  // Load campaigns when contract is ready
  useEffect(() => {
    if (contract && account) {
      loadCampaigns();
    }
  }, [contract, account, loadCampaigns]);

  // Helper function for donation input
  const handleDonation = (campaignId) => {
    showInputModal(
      'Make a Donation',
      'Enter donation amount in ETH:',
      '0.1',
      (amount) => {
        if (amount && parseFloat(amount) > 0) {
          donate(campaignId, amount);
        }
      }
    );
  };

  // Wrapper component for campaign detail page
  const CampaignDetailPage = () => {
    const { campaignId } = useParams();
    const navigate = useNavigate();
    const [refreshKey, setRefreshKey] = useState(0);

    const handleDonationWithRefresh = (campaignId) => {
      showInputModal(
        'Make a Donation',
        'Enter donation amount in ETH:',
        '0.1',
        async (amount) => {
          if (amount && parseFloat(amount) > 0) {
            await donate(campaignId, amount);
            setRefreshKey(prev => prev + 1);
          }
        }
      );
    };

    const handleFinalizeWithRefresh = async (campaignId) => {
      await finalizeCampaign(campaignId);
      setRefreshKey(prev => prev + 1);
    };

    const handleRefundWithRefresh = async (campaignId) => {
      await claimRefund(campaignId);
      setRefreshKey(prev => prev + 1);
    };

    const handleEditWithRefresh = async (campaignId, newTitle, newDescription) => {
      await editCampaign(campaignId, newTitle, newDescription);
      setRefreshKey(prev => prev + 1);
    };

    return (
      <Layout account={account} loading={loading} networkError={networkError}>
        <CampaignDetail
          key={refreshKey}
          campaignId={parseInt(campaignId)}
          contract={contract}
          account={account}
          onBack={() => navigate('/')}
          onDonate={handleDonationWithRefresh}
          onFinalize={handleFinalizeWithRefresh}
          onClaimRefund={handleRefundWithRefresh}
          onEdit={handleEditWithRefresh}
          showModal={showModal}
          showInputModal={showInputModal}
        />
        <Modal {...modal} onClose={closeModal} />
        <InputModal {...inputModal} onClose={closeInputModal} type="number" />
      </Layout>
    );
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={
          <Layout account={account} loading={loading} networkError={networkError}>
            <BrowseCampaigns
              campaigns={campaigns}
              loading={loading}
              account={account}
              handleDonation={handleDonation}
              finalizeCampaign={finalizeCampaign}
              claimRefund={claimRefund}
              getProgressPercentage={getProgressPercentage}
              isDeadlinePassed={isDeadlinePassed}
              canFinalizeCampaign={canFinalizeCampaign}
            />
            <Modal {...modal} onClose={closeModal} />
            <InputModal {...inputModal} onClose={closeInputModal} type="number" />
          </Layout>
        } />

        <Route path="/create" element={
          <Layout account={account} loading={createLoading} networkError={networkError}>
            <CreateCampaign
              newCampaign={newCampaign}
              setNewCampaign={setNewCampaign}
              createCampaign={createCampaign}
              loading={createLoading}
            />
            <Modal {...modal} onClose={closeModal} />
          </Layout>
        } />

        <Route path="/my-campaigns" element={
          <Layout account={account} loading={loading} networkError={networkError}>
            <MyCampaigns
              campaigns={campaigns}
              account={account}
              loading={loading}
              finalizeCampaign={finalizeCampaign}
              getProgressPercentage={getProgressPercentage}
              canFinalizeCampaign={canFinalizeCampaign}
            />
            <Modal {...modal} onClose={closeModal} />
            <InputModal {...inputModal} onClose={closeInputModal} type="number" />
          </Layout>
        } />

        <Route path="/about" element={
          <Layout account={account} loading={loading} networkError={networkError}>
            <About />
          </Layout>
        } />

        <Route path="/campaign/:campaignId" element={<CampaignDetailPage />} />
      </Routes>
    </Router>
  );
}

export default App;
