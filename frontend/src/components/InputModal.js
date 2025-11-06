import React, { useState, useEffect } from 'react';
import './InputModal.css';

const InputModal = ({ isOpen, onClose, onSubmit, title, label, placeholder, type = 'text', defaultValue = '' }) => {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    if (isOpen) {
      setValue(defaultValue);
    }
  }, [isOpen, defaultValue]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (value.trim()) {
      onSubmit(value);
      setValue('');
      onClose();
    }
  };

  const handleCancel = () => {
    setValue('');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleCancel}>
      <div className="modal-content input-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header info">
          <span className="modal-icon">💰</span>
          <h3>{title}</h3>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <label htmlFor="input-field">{label}</label>
            <input
              id="input-field"
              type={type}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={placeholder}
              autoFocus
              step="any"
              min="0"
            />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={handleCancel}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={!value.trim()}>
              Confirm
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InputModal;
