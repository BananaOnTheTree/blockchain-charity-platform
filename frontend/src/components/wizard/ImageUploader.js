import React from 'react';

const ImageUploader = ({ 
  id,
  label, 
  helperText,
  multiple = false,
  onFileChange,
  onFileRemove,
  selectedFile = null,
  icon = '📸',
  primaryText = 'Click to upload image',
  secondaryText = 'or drag and drop'
}) => {
  return (
    <div className="form-group">
      {label && <label>{label}</label>}
      <div className="file-upload-area">
        <input
          id={id}
          type="file"
          accept="image/*"
          multiple={multiple}
          onChange={onFileChange}
          className="file-input-hidden"
        />
        <label htmlFor={id} className={`file-upload-label ${multiple ? 'gallery-upload' : ''}`}>
          {selectedFile && !multiple ? (
            <div className="file-selected">
              <span className="file-icon">✓</span>
              <span className="file-name">{selectedFile.name}</span>
              <button 
                type="button" 
                className="file-remove"
                onClick={(e) => {
                  e.preventDefault();
                  onFileRemove && onFileRemove();
                }}
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="file-upload-prompt">
              <div className="upload-icon">{icon}</div>
              <div className="upload-text">
                <span className="upload-primary">{primaryText}</span>
                <span className="upload-secondary">{secondaryText}</span>
              </div>
              <span className="upload-formats">PNG, JPG, GIF up to 10MB</span>
            </div>
          )}
        </label>
      </div>
      {helperText && <span className="helper-text">{helperText}</span>}
    </div>
  );
};

export default ImageUploader;
