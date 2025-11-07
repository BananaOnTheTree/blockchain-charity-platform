import React from 'react';

const ImagePreview = ({ file, onClick, onRemove, className = '' }) => {
  if (!file) return null;

  const imageUrl = file instanceof File 
    ? URL.createObjectURL(file) 
    : file;

  return (
    <div className={`image-preview ${className}`}>
      <img 
        src={imageUrl} 
        alt="Preview"
        onClick={onClick}
        style={{ cursor: onClick ? 'pointer' : 'default' }}
      />
      {onClick && <div className="preview-overlay">Click to view full size</div>}
      {onRemove && (
        <button
          type="button"
          className="preview-remove"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          ×
        </button>
      )}
    </div>
  );
};

export default ImagePreview;
