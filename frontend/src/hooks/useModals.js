import { useState, useCallback } from 'react';

export const useModals = () => {
  const [modal, setModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    onConfirm: null
  });

  const [inputModal, setInputModal] = useState({
    isOpen: false,
    title: '',
    label: '',
    placeholder: '',
    onSubmit: null
  });

  const showModal = useCallback((title, message, type = 'info', onConfirm = null) => {
    setModal({
      isOpen: true,
      title,
      message,
      type,
      onConfirm
    });
  }, []);

  const closeModal = useCallback(() => {
    setModal({ isOpen: false, title: '', message: '', type: 'info', onConfirm: null });
  }, []);

  const showInputModal = useCallback((title, label, placeholder, onSubmit) => {
    setInputModal({
      isOpen: true,
      title,
      label,
      placeholder,
      onSubmit
    });
  }, []);

  const closeInputModal = useCallback(() => {
    setInputModal({ isOpen: false, title: '', label: '', placeholder: '', onSubmit: null });
  }, []);

  return {
    modal,
    inputModal,
    showModal,
    closeModal,
    showInputModal,
    closeInputModal
  };
};
